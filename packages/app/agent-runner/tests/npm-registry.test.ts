// The npm launcher's rules (src/agent/npm-registry.ts) over npmrc text and the real shapes of pnpm 11's and npm's
// install failures, and the worker's once-per-run token (src/agent/npm-credentials.ts).
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_PRIVATE_REGISTRY,
  declaration,
  expandEnv,
  maskPrivate,
  notFoundPackage,
  privateLines,
  privateRefused,
} from '../src/agent/npm-registry.ts';
import { NpmTokenSource } from '../src/agent/npm-credentials.ts';
import { packageManagerScript } from '../src/agent/runner-tools.ts';
import { NOCOBASE_NPM_REGISTRY } from '../src/protocol/index.ts';
import { ApiError, type ApiClient } from '../src/lib/http.ts';

const PRIVATE = DEFAULT_PRIVATE_REGISTRY;

describe('the private npm registry rules', () => {
  it('names the registry the protocol names', () => {
    expect(DEFAULT_PRIVATE_REGISTRY).toBe(NOCOBASE_NPM_REGISTRY);
  });

  it('masks only the lines that point at the private registry or carry its credentials', () => {
    const machine = [
      'registry=https://registry.npmmirror.com/',
      'cafile=/etc/ssl/corp.pem',
      '@nocobase:registry=https://pkg-v3.nocobase.com/',
      '@acme:registry="https://pkg-v3.nocobase.com"',
      '//pkg-v3.nocobase.com/:_authToken=stale-token',
      '//pkg-v3.nocobase.com/:always-auth=true',
      '//registry.npmmirror.com/:_authToken=mirror-token',
      '# @nocobase:registry=https://pkg-v3.nocobase.com/',
    ].join('\n');
    const { text, masked } = maskPrivate(machine, PRIVATE);
    expect(masked).toBe(4);
    expect(text.split('\n')).toEqual([
      'registry=https://registry.npmmirror.com/',
      'cafile=/etc/ssl/corp.pem',
      '//registry.npmmirror.com/:_authToken=mirror-token',
      '# @nocobase:registry=https://pkg-v3.nocobase.com/',
    ]);
    expect(
      maskPrivate('registry=https://pkg-v3.nocobase.com/', PRIVATE),
    ).toEqual({ text: '', masked: 1 });
  });

  it('resolves environment references as npm and pnpm do', () => {
    const env = { HOST: 'pkg-v3.nocobase.com', EMPTY: '' };
    expect(expandEnv('//${HOST}/:_authToken=${TOKEN}', env)).toBe(
      '//pkg-v3.nocobase.com/:_authToken=${TOKEN}',
    );
    expect(expandEnv('a${UNSET?}b', env)).toBe('ab');
    expect(expandEnv('${EMPTY:-fallback} ${UNSET:-x}', env)).toBe('fallback x');
    expect(expandEnv('\\${HOST} \\\\${HOST}', env)).toBe(
      '${HOST} \\pkg-v3.nocobase.com',
    );
  });

  it('masks private registry lines however they are written', () => {
    const env = {
      PRIVATE_REGISTRY: 'https://pkg-v3.nocobase.com',
      PRIVATE_HOST: 'PKG-V3.NocoBase.com',
      MIRROR: 'https://registry.npmmirror.com/',
    };
    const machine = [
      'registry=${MIRROR}',
      '@nocobase:registry=${PRIVATE_REGISTRY}',
      '@acme:registry=https://${PRIVATE_HOST}//',
      '@NocoBase:registry=HTTP://PKG-V3.NOCOBASE.COM',
      '//${PRIVATE_HOST}/:_authToken=stale-token',
      '@other:registry=${UNSET_REGISTRY}',
    ].join('\n');
    const { text, masked } = maskPrivate(machine, PRIVATE, env);
    expect(masked).toBe(4);
    expect(text.split('\n')).toEqual([
      'registry=${MIRROR}',
      '@other:registry=${UNSET_REGISTRY}',
    ]);
    expect(
      declaration(['@nocobase:registry=${PRIVATE_REGISTRY}'], PRIVATE, env),
    ).toEqual({ private: true, nocobaseElsewhere: false });
    expect(declaration(['@nocobase:registry=${MIRROR}'], PRIVATE, env)).toEqual(
      { private: false, nocobaseElsewhere: true },
    );
  });

  it('reads keys and values as ini does, quoted or commented', () => {
    const machine = [
      '"@nocobase:registry"=https://pkg-v3.nocobase.com/',
      '"//pkg-v3.nocobase.com/:_authToken"=stale-token',
      '\'@acme:registry\' = "https://pkg-v3.nocobase.com"',
      'registry = https://pkg-v3.nocobase.com/ ; the private one',
      '"registry"="https://registry.npmmirror.com/"',
      '[section]',
      '; registry=https://pkg-v3.nocobase.com/',
    ].join('\n');
    const { text, masked } = maskPrivate(machine, PRIVATE);
    expect(masked).toBe(4);
    expect(text.split('\n')).toEqual([
      '"registry"="https://registry.npmmirror.com/"',
      '[section]',
      '; registry=https://pkg-v3.nocobase.com/',
    ]);
    expect(
      declaration(
        ['"@nocobase:registry"="https://pkg-v3.nocobase.com/"'],
        PRIVATE,
      ),
    ).toEqual({ private: true, nocobaseElsewhere: false });
    expect(
      declaration(["'@nocobase:registry'=https://npm.acme.test/"], PRIVATE),
    ).toEqual({ private: false, nocobaseElsewhere: true });
  });

  it('splits lines as ini does, at a lone CR and at mixed line breaks', () => {
    const lines = [
      'registry=https://registry.npmmirror.com/',
      '@nocobase:registry=https://pkg-v3.nocobase.com/',
      'cafile=/etc/ssl/corp.pem',
      '//pkg-v3.nocobase.com/:_authToken=stale-token',
      '"@acme:registry"="https://pkg-v3.nocobase.com"',
    ];
    const kept = [
      'registry=https://registry.npmmirror.com/',
      'cafile=/etc/ssl/corp.pem',
    ];
    for (const text of [
      lines.join('\r'),
      `${lines[0]}\r${lines[1]}\n${lines[2]}\r\n${lines[3]}\n\r${lines[4]}`,
    ]) {
      const result = maskPrivate(text, PRIVATE);
      expect(result.masked).toBe(3);
      expect(result.text.split('\n')).toEqual(kept);
      expect(result.text).not.toContain('pkg-v3');
    }
    expect(
      declaration(
        [
          'auto-install-peers=true\r@nocobase:registry=https://pkg-v3.nocobase.com/',
        ],
        PRIVATE,
      ),
    ).toEqual({ private: true, nocobaseElsewhere: false });
    expect(
      declaration(
        [
          'auto-install-peers=true\r\n\rregistry=https://registry.npmmirror.com/\r@nocobase:registry=https://npm.acme.test/',
        ],
        PRIVATE,
      ),
    ).toEqual({ private: false, nocobaseElsewhere: true });
  });

  it('reads a declaration from committed npmrc files', () => {
    expect(declaration([], PRIVATE)).toEqual({
      private: false,
      nocobaseElsewhere: false,
    });
    expect(
      declaration(['@nocobase:registry=https://pkg-v3.nocobase.com/'], PRIVATE),
    ).toEqual({ private: true, nocobaseElsewhere: false });
    expect(
      declaration(
        ['auto-install-peers=true', 'registry=https://pkg-v3.nocobase.com'],
        PRIVATE,
      ).private,
    ).toBe(true);
    expect(
      declaration(['@nocobase:registry=https://npm.acme.test/'], PRIVATE),
    ).toEqual({ private: false, nocobaseElsewhere: true });
    expect(
      declaration(['registry=https://registry.npmmirror.com/'], PRIVATE),
    ).toEqual({ private: false, nocobaseElsewhere: false });
  });

  it('adds the scope and the credential line', () => {
    expect(privateLines(PRIVATE, 'secret-token', true)).toEqual([
      '@nocobase:registry=https://pkg-v3.nocobase.com/',
      '//pkg-v3.nocobase.com/:_authToken=secret-token',
    ]);
    expect(privateLines(PRIVATE, 'secret-token', false)).toEqual([
      '//pkg-v3.nocobase.com/:_authToken=secret-token',
    ]);
    expect(privateLines(PRIVATE, null, false)).toEqual([]);
  });

  it.each([
    [
      'a pnpm metadata 404',
      ' ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@nocobase%2Fplugin-acme: Not Found - 404\n\nThis error happened while installing a direct dependency of /work/app',
      { name: '@nocobase/plugin-acme' },
    ],
    [
      'a pnpm 404 as the append-only reporter prints it',
      '[ERR_PNPM_FETCH_404] GET http://127.0.0.1:4873/@nocobase%2Ffx-private: Not Found - 404',
      { name: '@nocobase/fx-private' },
    ],
    [
      'a pnpm tarball 404 on a mirror',
      ' ERR_PNPM_FETCH_404  GET https://registry.npmmirror.com/@nocobase/plugin-acme/-/plugin-acme-1.0.0.tgz: Not Found - 404',
      { name: '@nocobase/plugin-acme' },
    ],
    [
      'a pnpm missing version',
      ' ERR_PNPM_NO_MATCHING_VERSION  No matching version found for @nocobase/caching@1.0.0-beta.4 while fetching it from https://registry.npmjs.org/',
      { name: '@nocobase/caching', spec: '1.0.0-beta.4' },
    ],
    [
      'an npm 404',
      'npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/@nocobase%2fplugin-acme - Not found\nnpm error 404',
      { name: '@nocobase/plugin-acme' },
    ],
    [
      'an npm missing version',
      'npm error code ETARGET\nnpm error notarget No matching version found for @nocobase/app-cli@1.0.0-beta.32.',
      { name: '@nocobase/app-cli', spec: '1.0.0-beta.32' },
    ],
  ])('finds the @nocobase package in %s', (_name, output, expected) => {
    expect(notFoundPackage(output, PRIVATE)).toEqual(expected);
  });

  it.each([
    [
      'another scope',
      ' ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@acme%2Fthing: Not Found - 404',
    ],
    [
      'the private registry itself',
      ' ERR_PNPM_FETCH_404  GET https://pkg-v3.nocobase.com/@nocobase%2Fplugin-acme: Not Found - 404',
    ],
    [
      'a missing version on the private registry',
      ' ERR_PNPM_NO_MATCHING_VERSION  No matching version found for @nocobase/caching@9.9.9 while fetching it from https://pkg-v3.nocobase.com/',
    ],
    ['another failure', ' ERR_PNPM_ENOSPC  no space left on device'],
  ])('finds nothing in %s', (_name, output) => {
    expect(notFoundPackage(output, PRIVATE)).toBeNull();
  });

  it('tells the private registry refusing the token from other refusals', () => {
    expect(
      privateRefused(
        ' ERR_PNPM_FETCH_401  GET https://pkg-v3.nocobase.com/@nocobase%2Fx: Unauthorized - 401',
        PRIVATE,
      ),
    ).toBe(true);
    expect(
      privateRefused(
        ' ERR_PNPM_FETCH_401  GET https://registry.npmjs.org/@acme%2Fx: Unauthorized - 401',
        PRIVATE,
      ),
    ).toBe(false);
  });

  it('hands only registry calls to the launcher, and every npx call', () => {
    const pnpm = packageManagerScript('pnpm', ['/n/node', '/p/pnpm.mjs'], {
      node: '/n/node',
      launcher: ['/r/npm-launcher.js'],
    });
    expect(pnpm).toContain(
      `install|i|add|update|up|upgrade|dlx|fetch|install-test|it) exec '/n/node' '/r/npm-launcher.js' pnpm '/n/node' '/p/pnpm.mjs' -- "$@" ;;`,
    );
    expect(pnpm).toContain(`exec '/n/node' '/p/pnpm.mjs' "$@"`);
    const npx = packageManagerScript('npm', ['/usr/bin/npx'], {
      always: true,
      node: '/n/node',
      launcher: ['/r/npm-launcher.js'],
    });
    expect(npx).toBe(
      `#!/bin/sh\nexec '/n/node' '/r/npm-launcher.js' npm '/usr/bin/npx' -- "$@"\n`,
    );
  });
});

describe("the run's token", () => {
  const client = (post: ApiClient['post']) =>
    ({ post }) as unknown as ApiClient;

  it('asks the application once per run, and redacts what it gave', async () => {
    const post = vi.fn(async () => ({ token: 'synthetic-token-1234' }));
    const secrets: string[] = [];
    const source = new NpmTokenSource({
      client: client(post as never),
      runId: 'run-1',
      attempt: 2,
      onSecret: (secret) => secrets.push(secret),
      onLost: () => undefined,
    });
    expect(await source.get('notFound', '@nocobase/x')).toBe(
      'synthetic-token-1234',
    );
    expect(await source.get('declared')).toBe('synthetic-token-1234');
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]?.slice(0, 2)).toEqual([
      '/api/agents/runners/runs/run-1/npmCredentials',
      { attempt: 2, reason: 'notFound', package: '@nocobase/x' },
    ]);
    expect(secrets).toEqual(['synthetic-token-1234']);
  });

  it('keeps "none configured" for the run, asks again after a failure, and stops when the run is lost', async () => {
    let calls = 0;
    const lost: string[] = [];
    const source = new NpmTokenSource({
      client: client((async () => {
        calls += 1;
        if (calls === 1) throw new Error('offline');
        if (calls === 2) return { token: null };
        throw new ApiError(409, 'LEASE_LOST', 'lost');
      }) as never),
      runId: 'run-1',
      attempt: 1,
      onSecret: () => undefined,
      onLost: (code) => lost.push(code),
    });
    await expect(source.get('declared')).rejects.toThrow('offline');
    expect(await source.get('declared')).toBeNull();
    expect(await source.get('declared')).toBeNull();
    expect(calls).toBe(2);

    const other = new NpmTokenSource({
      client: client((async () => {
        throw new ApiError(409, 'LEASE_LOST', 'lost');
      }) as never),
      runId: 'run-2',
      attempt: 1,
      onSecret: () => undefined,
      onLost: (code) => lost.push(code),
    });
    await expect(other.get('declared')).rejects.toThrow();
    expect(lost).toEqual(['LEASE_LOST']);
    await expect(other.get('declared')).rejects.toThrow('no longer');
  });
});
