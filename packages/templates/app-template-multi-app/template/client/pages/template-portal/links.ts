/** Portal entry chooses platform sign-in; the child owns the OAuth flow and session. */
export function platformLoginUrl(appUrl: string): string {
  const url = new URL(appUrl);
  url.pathname = url.pathname.replace(/\/$/u, '') + '/login';
  url.search = new URLSearchParams({
    auth: 'platform',
    redirect: '/',
  }).toString();
  url.hash = '';
  return url.toString();
}
