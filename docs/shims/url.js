// Lightweight browser shim for Node's 'url' module used by utils/handlebars
// Provides a parse function returning a URL-like object via the WHATWG URL API.
export function parse(input) {
  try {
    const base = location?.origin || 'http://localhost/';
    const u = new URL(input, base);
    return {
      href: u.href,
      protocol: u.protocol,
      slashes: true,
      auth: null,
      host: u.host,
      port: u.port,
      hostname: u.hostname,
      hash: u.hash,
      search: u.search,
      query: u.searchParams.toString(),
      pathname: u.pathname,
      path: u.pathname + u.search,
      // legacy fields kept for compatibility
      toString() {
        return u.toString();
      },
    };
  } catch (e) {
    return { href: input };
  }
}

export default { parse };
