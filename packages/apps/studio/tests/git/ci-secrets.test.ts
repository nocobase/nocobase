// @vitest-environment node
/**
 * What setting a repository's CI up asks of the code host, against the GitHub stand-in (never GitHub): a libsodium
 * sealed box checked against a vector computed by independent implementations (TweetNaCl's `crypto_box` and Python's
 * BLAKE2b), files written through the contents API, branches made or moved through the refs API, an Actions secret
 * sealed to the repository's own key, and an app connection whose installation was not granted `secrets: write` yet:
 * reported on the connection and refused before the host is asked.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  APP_PERMISSIONS,
  missingAppPermissions,
} from '../../server/git/github.js';
import type { GitAuth } from '../../server/git/platform.js';
import { openSealedBox, sealedBox } from '../../server/git/sealed-box.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { createFakeGitHub } from './fake-github.js';

const REPO = 'acme/shop';
const auth: GitAuth = { apiBaseUrl: 'https://api.github.com', token: null };

// The recipient's key pair and the one-time key are fixed; the sealed box below was computed by TweetNaCl
// (`nacl.box` with the nonce BLAKE2b-192(ephemeral ‖ recipient) from Python's hashlib), not by this code.
const RECIPIENT_SECRET = Buffer.from(
  '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
  'hex',
);
const RECIPIENT_PUBLIC = Buffer.from(
  'B6N8vBQgk8i3VdwbEOhstCY3StFqqFPtC9/AsrhtHHw=',
  'base64',
);
const EPHEMERAL_SECRET = Buffer.from(
  'c8c7c6c5c4c3c2c1c0bfbebdbcbbbab9b8b7b6b5b4b3b2b1b0afaeadacabaaa9',
  'hex',
);
const SEALED =
  'ja/P7q6QRe6aeNeKmfzzLneB5EHrBzCWw0K44tzDthI7nZT1CfGTXUj2AGEZfLgz4Ke4Ve69u/yB/lidok35ug==';

describe('a sealed box', () => {
  it('matches libsodium’s crypto_box_seal for a known key pair', () => {
    const sealed = sealedBox(
      RECIPIENT_PUBLIC,
      Buffer.from('studio-ci-secret'),
      EPHEMERAL_SECRET,
    );
    expect(Buffer.from(sealed).toString('base64')).toBe(SEALED);
    expect(
      Buffer.from(
        openSealedBox(RECIPIENT_SECRET, Buffer.from(SEALED, 'base64'))!,
      ).toString(),
    ).toBe('studio-ci-secret');
  });

  it('draws a new one-time key each time, and opens only for the recipient', () => {
    const message = Buffer.from('another secret');
    const first = sealedBox(RECIPIENT_PUBLIC, message);
    const second = sealedBox(RECIPIENT_PUBLIC, message);
    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(false);
    expect(
      Buffer.from(openSealedBox(RECIPIENT_SECRET, second)!).toString(),
    ).toBe('another secret');
    expect(openSealedBox(EPHEMERAL_SECRET, first)).toBeNull();
    const tampered = Uint8Array.from(first);
    tampered[tampered.length - 1] ^= 1;
    expect(openSealedBox(RECIPIENT_SECRET, tampered)).toBeNull();
  });
});

describe('files, branches and CI secrets on GitHub', () => {
  it('writes a file as a commit, reads it back, and updates it by its version', async () => {
    const github = createFakeGitHub();
    github.addRepo(REPO);
    const { platform } = github;
    expect(
      await platform.readFile(
        auth,
        REPO,
        '.github/workflows/nb-studio.yml',
        'main',
      ),
    ).toBeNull();
    const written = await platform.putFile(auth, REPO, {
      path: '.github/workflows/nb-studio.yml',
      content: 'name: Studio\n',
      message: 'Add Studio CI workflow',
      branch: 'main',
    });
    expect(written.commitSha).toBe(github.headOf(REPO, 'main'));
    const read = await platform.readFile(
      auth,
      REPO,
      '.github/workflows/nb-studio.yml',
      'main',
    );
    expect(read).toEqual({ sha: written.sha, content: 'name: Studio\n' });
    // An update names the version it replaces.
    await expect(
      platform.putFile(auth, REPO, {
        path: '.github/workflows/nb-studio.yml',
        content: 'name: Studio 2\n',
        message: 'Update',
        branch: 'main',
      }),
    ).rejects.toMatchObject({ status: 409 });
    await platform.putFile(auth, REPO, {
      path: '.github/workflows/nb-studio.yml',
      content: 'name: Studio 2\n',
      message: 'Update',
      branch: 'main',
      sha: read!.sha,
    });
    const body = github.requests.find(
      (request) =>
        request.method === 'PUT' && request.path.includes('contents'),
    )?.body as Record<string, unknown>;
    expect(body).toMatchObject({
      branch: 'main',
      message: 'Add Studio CI workflow',
    });
    expect(Buffer.from(String(body.content), 'base64').toString()).toBe(
      'name: Studio\n',
    );
  });

  it('creates a branch at a commit, moves it when it exists, and reads its head', async () => {
    const github = createFakeGitHub();
    github.addRepo(REPO);
    github.pushCommits(REPO, 'main', 'c1', 'c2');
    const { platform } = github;
    expect(await platform.branchSha(auth, REPO, 'main')).toBe('c2');
    expect(await platform.branchSha(auth, REPO, 'studio/ci-setup')).toBeNull();
    await platform.createBranch(auth, REPO, {
      name: 'studio/ci-setup',
      fromSha: 'c1',
    });
    expect(await platform.branchSha(auth, REPO, 'studio/ci-setup')).toBe('c1');
    await platform.createBranch(auth, REPO, {
      name: 'studio/ci-setup',
      fromSha: 'c2',
    });
    expect(await platform.branchSha(auth, REPO, 'studio/ci-setup')).toBe('c2');
    expect(
      github.requests
        .filter((request) => request.path.includes('/git/ref'))
        .map((request) => `${request.method} ${request.status}`),
    ).toEqual([
      'GET 200',
      'GET 404',
      'POST 201',
      'GET 200',
      'POST 422',
      'PATCH 200',
      'GET 200',
    ]);
  });

  it('seals an Actions secret to the repository’s public key and sends only the ciphertext', async () => {
    const github = createFakeGitHub();
    github.addRepo(REPO);
    await github.platform.setCiSecret(auth, REPO, {
      name: 'NB_STUDIO_API_KEY',
      value: 'fk_live_secret',
    });
    expect(github.openSecret(REPO, 'NB_STUDIO_API_KEY')).toBe('fk_live_secret');
    const put = github.requests.find(
      (request) =>
        request.method === 'PUT' &&
        request.path.endsWith('/actions/secrets/NB_STUDIO_API_KEY'),
    );
    expect(put?.body).toMatchObject({ key_id: expect.any(String) });
    expect(JSON.stringify(put?.body)).not.toContain('fk_live_secret');
  });

  it('names the permissions an installation lacks', () => {
    expect(APP_PERMISSIONS.secrets).toBe('write');
    expect(missingAppPermissions({ ...APP_PERMISSIONS })).toEqual([]);
    const { secrets: _secrets, ...older } = APP_PERMISSIONS;
    expect(missingAppPermissions(older)).toEqual(['secrets:write']);
    expect(
      missingAppPermissions({ ...APP_PERMISSIONS, secrets: 'read' }),
    ).toEqual(['secrets:write']);
  });
});

describe('an app connection without the secrets permission', () => {
  let h: BridgeHarness;
  afterEach(() => h.close());

  it('says so on the connection, and refuses to write a secret before asking GitHub', async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    h.roles.set('alice', 'admin');
    h.github.app.installations.set('acme', '77');
    const { secrets: _secrets, ...older } = APP_PERMISSIONS;
    h.github.installationPermissions.set('77', older);
    h.github.addRepo(REPO);
    const connection = await h.gitConnections.create('alice', {
      kind: 'app',
      name: 'Acme app',
      appId: h.github.app.appId,
      privateKey: h.github.app.privateKey,
      account: 'acme',
    });
    expect(connection).toMatchObject({
      missingPermissions: ['secrets:write'],
      permissionsUrl:
        'https://github.com/organizations/acme/settings/installations/77',
    });
    expect((await h.gitConnections.list())[0]?.missingPermissions).toEqual([
      'secrets:write',
    ]);
    await expect(
      h.gitConnections.setCiSecret(connection.id, REPO, {
        name: 'NB_STUDIO_API_KEY',
        value: 'secret',
      }),
    ).rejects.toMatchObject({ details: { code: 'GIT_PERMISSION_MISSING' } });
    expect(
      h.github.requests.some((request) => request.path.includes('secrets')),
    ).toBe(false);
  });

  it('a token connection reports nothing missing and writes through the token', async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    h.roles.set('alice', 'admin');
    h.github.tokens.add('ghp_repo');
    h.github.addRepo(REPO);
    const connection = await h.gitConnections.create('alice', {
      kind: 'token',
      name: 'Token',
      token: 'ghp_repo',
      account: 'acme',
    });
    expect(connection.missingPermissions).toEqual([]);
    await h.gitConnections.setCiSecret(connection.id, REPO, {
      name: 'NB_STUDIO_API_KEY',
      value: 'secret',
    });
    expect(h.github.openSecret(REPO, 'NB_STUDIO_API_KEY')).toBe('secret');
  });
});
