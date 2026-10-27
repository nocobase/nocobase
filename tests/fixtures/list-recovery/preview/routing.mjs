// The host has already removed its mount path before dispatching to this wrapper.
export const sampleIds = Object.freeze([
  'default-new',
  'default-upgraded',
  'examples-new',
  'examples-upgraded',
]);

export function resolveSampleRequest(request) {
  const url = new URL(request.url);
  const match = /^\/acceptance\/([^/]+)(\/.*)?$/.exec(url.pathname);
  if (!match || !sampleIds.includes(match[1])) return null;
  const prefix = `/acceptance/${match[1]}`;
  url.pathname = match[2] || '/';
  return {
    id: match[1],
    prefix,
    request: new Request(url, request),
  };
}

// Absolute same-origin assets survive the outer host's HTML mount-path rewrite.
// The origin must come from runtime configuration, never a request Host header.
export async function preserveSampleAssets(response, publicOrigin, basePath) {
  if (
    !response.headers.get('content-type')?.startsWith('text/html') ||
    !response.body
  ) {
    return response;
  }
  const origin = new URL(publicOrigin);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password
  ) {
    throw new Error(
      'Preview public origin must be an HTTP origin without credentials',
    );
  }
  const html = await response.text();
  const rewritten = html.replace(
    /(\b(?:src|href|content)\s*=\s*["'])(\/[^"'<>]*)/gi,
    (attribute, opening, path) =>
      path.startsWith(`${basePath}/assets/`)
        ? `${opening}${origin.origin}${path}`
        : attribute,
  );
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
