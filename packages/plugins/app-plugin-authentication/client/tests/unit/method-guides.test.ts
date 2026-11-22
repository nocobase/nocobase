import { describe, expect, it } from 'vitest';

import {
  methodGuideSnippets,
  passkeyRelyingParty,
} from '../../pages/method-guides.js';

/** `import { name } from 'module';` lines of a snippet. */
function imports(snippet: string): { name: string; module: string }[] {
  return [...snippet.matchAll(/import \{ (\w+) \} from '([^']+)';/gu)].map(
    ([, name, module]) => ({ name, module }),
  );
}

describe('the two-factor and passkey guides', () => {
  it('import only what the locked Better Auth version exports', async () => {
    const { server, client } = methodGuideSnippets('twoFactor');
    const named = [...imports(server), ...imports(client)];
    expect(named).toEqual([
      { name: 'twoFactor', module: 'better-auth/plugins' },
      { name: 'twoFactorClient', module: 'better-auth/client/plugins' },
    ]);
    for (const { name, module } of named)
      expect(
        (await import(/* @vite-ignore */ module)) as Record<string, unknown>,
      ).toHaveProperty(name, expect.any(Function));
  });

  it('name the passkey package’s own exports, installed alongside better-auth', () => {
    const { install, server, client } = methodGuideSnippets('passkey');
    expect(install).toMatch(/^pnpm add @better-auth\/passkey@/u);
    // @better-auth/passkey 1.7.21 exports `passkey` from its root and `passkeyClient` from `/client`.
    expect([...imports(server), ...imports(client)]).toEqual([
      { name: 'passkey', module: '@better-auth/passkey' },
      { name: 'passkeyClient', module: '@better-auth/passkey/client' },
    ]);
    expect(server).toContain(
      "schema: { passkey: { fields: { credentialID: 'credentialId' } } }",
    );
  });

  it('bind passkeys to app.publicOrigin, with placeholders without one', () => {
    expect(passkeyRelyingParty('https://crm.example.com:8443/main')).toEqual({
      rpID: 'crm.example.com',
      origin: 'https://crm.example.com:8443',
    });
    const server = methodGuideSnippets(
      'passkey',
      'https://crm.example.com',
    ).server;
    expect(server).toContain("rpID: 'crm.example.com'");
    expect(server).toContain("origin: 'https://crm.example.com'");
    for (const origin of [null, undefined, 'not a url'])
      expect(passkeyRelyingParty(origin)).toEqual({
        rpID: '<your-domain>',
        origin: 'https://<your-domain>',
      });
  });

  it('need no package for two-factor and add tables for both', () => {
    expect(methodGuideSnippets('twoFactor').install).toBeUndefined();
    expect(methodGuideSnippets('twoFactor').migration).toContain(
      "createCollection('twoFactor'",
    );
    expect(methodGuideSnippets('passkey').migration).toContain(
      "createCollection('passkey'",
    );
  });
});
