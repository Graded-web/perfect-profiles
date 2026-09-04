// Canonical-host enforcement: www -> apex and http -> https, then serve static assets.
// Also owns POST /api/quote, which records every lead on our own infrastructure
// so a FormSubmit failure can never lose one.
//
// Delivery deliberately stays in the browser. FormSubmit sits behind Cloudflare
// too, and rejects server-side relays from a Worker ("...will not work in pages
// browsed as HTML files") even with Origin/Referer set — the same request
// succeeds from an ordinary host. So: the worker captures, the browser delivers,
// and the client confirms delivery back here so the record stays accurate.

// Enough for a long enquiry, small enough that the endpoint can't be used as a drain.
const MAX_BODY_BYTES = 64 * 1024;

// One submission per IP per 30s. Generous for a human, useless to a bot, and
// short enough not to block a second person behind a shared office IP for long.
const THROTTLE_SECONDS = 30;

// KV refuses any expirationTtl under 60s, so the key outlives the window it
// guards. The timestamp stored in it — not the key's presence — is what decides.
const THROTTLE_KEY_TTL = 60;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function handleQuote(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BODY_BYTES) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Bots fill hidden fields; humans can't see them. Accept silently so the bot
  // learns nothing, but store and relay nothing.
  if ((form.get("_honey") || "").toString().trim() !== "") {
    return json({ ok: true, stored: false, delivered: false });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const store = env.QUOTES;

  const throttleKey = `throttle:${ip}`;
  if (store) {
    const last = Number(await store.get(throttleKey));
    if (last && Date.now() - last < THROTTLE_SECONDS * 1000) {
      return json({ ok: false, error: "rate_limited" }, 429);
    }
  }

  const submission = {
    receivedAt: new Date().toISOString(),
    ip,
    userAgent: request.headers.get("User-Agent") || "",
    fields: Object.fromEntries(
      [...form.entries()].filter(([k]) => k !== "_honey").map(([k, v]) => [k, v.toString()])
    ),
    delivered: false,
  };

  // Capture first. If the relay below fails, the lead is still on disk.
  const key = `quote:${submission.receivedAt}:${crypto.randomUUID().slice(0, 8)}`;
  let stored = false;
  if (store) {
    try {
      await store.put(key, JSON.stringify(submission));
      stored = true;
    } catch (err) {
      // Surface it: a working relay would otherwise mask capture being broken.
      console.error("lead capture write failed", String(err));
      stored = false;
    }
  }

  if (stored) {
    // Only start the clock once the lead actually landed, so a prospect whose
    // submission failed can retry immediately instead of being locked out.
    try {
      await store.put(throttleKey, String(Date.now()), {
        expirationTtl: THROTTLE_KEY_TTL,
      });
    } catch (err) {
      // Never fail a captured lead over throttling — but say so, because a
      // silent catch here once hid the throttle being disabled entirely.
      console.error("throttle write failed", String(err));
    }
  }

  // `key` lets the client confirm delivery afterwards. `ok` reflects capture
  // only; the browser decides what to tell the visitor, since it also delivers.
  return json({ ok: stored, stored, key: stored ? key : null });
}

// The browser reports back whether FormSubmit accepted the message, so a lead
// sitting in KV can be told apart from one that actually reached the inbox.
async function handleQuoteConfirm(request, env) {
  const store = env.QUOTES;
  if (!store) return json({ ok: false, error: "no_store" }, 404);

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith("quote:")) return json({ ok: false, error: "bad_key" }, 400);

  const raw = await store.get(key);
  if (!raw) return json({ ok: false, error: "not_found" }, 404);

  try {
    const record = JSON.parse(raw);
    record.delivered = true;
    await store.put(key, JSON.stringify(record));
  } catch (err) {
    console.error("confirm write failed", String(err));
    return json({ ok: false, error: "write_failed" }, 500);
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/pricing" || url.pathname === "/pricing.html") {
      url.pathname = "/requestaquote";
      url.protocol = "https:";
      if (url.hostname.startsWith("www.")) url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    // /contact-us briefly held the contact page (2026-08-12) before it moved to /contact
    if (url.pathname === "/contact-us" || url.pathname === "/contact-us.html") {
      url.pathname = "/contact";
      url.protocol = "https:";
      if (url.hostname.startsWith("www.")) url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    // Loopback is never a real host; exempting it lets `wrangler dev` be driven
    // over plain http locally instead of redirecting every request away.
    const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const needsHost = url.hostname.startsWith("www.");
    const needsScheme = url.protocol === "http:" && !isLoopback;
    if (needsHost || needsScheme) {
      if (needsHost) url.hostname = url.hostname.slice(4);
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/api/quote") return handleQuote(request, env);
    if (url.pathname === "/api/quote/confirm") {
      return request.method === "POST"
        ? handleQuoteConfirm(request, env)
        : json({ ok: false, error: "method_not_allowed" }, 405);
    }
    return env.ASSETS.fetch(request);
  },
};
