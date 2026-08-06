// Canonical-host enforcement: www -> apex and http -> https, then serve static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
