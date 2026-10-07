import type { useAuthentication as UseAuthentication } from '@nocobase/app-plugin-authentication/client';

// The preview's stand-in for the authentication plugin's client export, aliased in vite.config.ts: the device
// endpoints answer after a short wait, `EXPI-RED0` as an expired code and anything starting with `ZZ` as an invalid
// one, so the device-approval demo shows each state without a server.
const wait = () => new Promise((resolve) => window.setTimeout(resolve, 600));

async function $fetch(
  path: string,
  init: { readonly query?: { readonly user_code?: string } },
): Promise<{ data: unknown; error: unknown }> {
  await wait();
  const code = (init.query?.user_code ?? '').replace(/[^a-z0-9]/giu, '');
  if (path === '/device') {
    if (code.toUpperCase() === 'EXPIRED0')
      return { data: null, error: { status: 400, error: 'expired_token' } };
    if (code.toUpperCase().startsWith('ZZ'))
      return { data: null, error: { status: 400, error: 'invalid_request' } };
    return { data: { status: 'pending', client_id: 'acme' }, error: null };
  }
  return { data: { success: true }, error: null };
}

function authentication() {
  return { client: { $fetch } };
}

export const useAuthentication =
  authentication as unknown as typeof UseAuthentication;
