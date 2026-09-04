// Canonical-host enforcement: www -> apex and http -> https, then serve static assets.
// Also owns POST /api/quote so every lead is recorded on our own infrastructure
// before it is handed to FormSubmit — a third-party outage must never lose one.

const FALLBACK_QUOTE_EMAIL = "info@perfectprofile.com.au";

// Sent as Origin/Referer on the FormSubmit relay — see the note at that fetch.
const SITE_ORIGIN = "https://perfectprofile.com.au";

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

  const name = [submission.fields["first-name"], submission.fields.surname]
    .filter(Boolean)
    .join(" ");

  const relay = new FormData();
  for (const [k, v] of Object.entries(submission.fields)) relay.append(k, v);
  relay.append("_subject", "Quote request – " + (name || "Perfect Profile site"));
  // Make Reply-To explicit rather than relying on FormSubmit's field-name guessing,
  // so hitting Reply in the inbox goes to the prospect.
  if (submission.fields.email) relay.append("_replyto", submission.fields.email);

  const address = env.QUOTE_EMAIL || FALLBACK_QUOTE_EMAIL;
  let delivered = false;
  let relayError = "";
  try {
    const res = await fetch("https://formsubmit.co/ajax/" + address, {
      method: "POST",
      headers: {
        Accept: "application/json",
        // FormSubmit refuses requests without a browser-shaped Origin/Referer
        // ("...will not work in pages browsed as HTML files"). The browser used
        // to supply these; relaying server-side, we must set them ourselves.
        Origin: SITE_ORIGIN,
        Referer: SITE_ORIGIN + "/requestaquote",
      },
      body: relay,
    });
    // FormSubmit answers 200 even when it refuses the message, and reports the
    // real outcome as the string "true"/"false" in the body. Status alone lies.
    const body = await res.json().catch(() => ({}));
    delivered = res.ok && String(body.success) === "true";
    if (!delivered) relayError = String(body.message || "HTTP " + res.status);
  } catch (err) {
    relayError = String(err);
  }

  if (stored && delivered) {
    submission.delivered = true;
    try {
      await store.put(key, JSON.stringify(submission));
    } catch {
      // The lead is already saved; a failed status update is not worth failing on.
    }
  }

  // The visitor is told the truth: we succeeded if we hold the lead OR sent it.
  if (stored || delivered) {
    // Only start the clock once something actually landed, so a prospect whose
    // submission failed can retry immediately instead of being locked out.
    if (store) {
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
    return json({ ok: true, stored, delivered });
  }

  // Keep the third party's error out of the response — it can echo the
  // destination address. Visible instead via `npx wrangler tail`.
  console.error("quote capture failed", { ip, relayError });
  return json({ ok: false, error: "not_captured" }, 502);
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
    return env.ASSETS.fetch(request);
  },
};
