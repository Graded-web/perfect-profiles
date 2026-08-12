// Canonical-host enforcement: www -> apex and http -> https, then serve static assets.
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
    const needsHost = url.hostname.startsWith("www.");
    const needsScheme = url.protocol === "http:";
    if (needsHost || needsScheme) {
      if (needsHost) url.hostname = url.hostname.slice(4);
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
