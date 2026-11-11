import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { parseDocument } from 'yaml';

// Configure only this checkout; no tunnel, DNS, deployment or demo initialization is performed.
const origin = new URL(
  process.env.EXAMPLE_PUBLIC_ORIGIN || 'http://127.0.0.1:13230',
);
if (
  !['http:', 'https:'].includes(origin.protocol) ||
  origin.username ||
  origin.password ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash
)
  throw new Error(
    'EXAMPLE_PUBLIC_ORIGIN must be an HTTP(S) origin without a path or credentials.',
  );
const mode =
  process.env.EXAMPLE_MODE || (origin.protocol === 'https:' ? 'sso' : 'local');
if (
  !['local', 'sso'].includes(mode) ||
  (mode === 'sso' && origin.protocol !== 'https:')
)
  throw new Error(
    'Use local mode for HTTP account login, or sso mode with an operator-provided trusted HTTPS origin.',
  );
if (!existsSync('config.yml')) {
  const result = spawnSync(
    'pnpm',
    ['nocobase', 'config', 'init', '--dialect', 'sqlite'],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
const config = parseDocument(await readFile('config.yml', 'utf8'));
if (config.errors.length)
  throw new Error('Existing config.yml is invalid; it has not been changed.');
for (const [keys, value] of [
  [['app', 'publicOrigin'], origin.origin],
  [['server', 'host'], '127.0.0.1'],
  [['server', 'port'], 13230],
  [['client', 'app', 'title'], '应用模板示例'],
  [['i18n', 'defaultLocale'], 'zh-CN'],
  [
    ['auth', 'trustedOrigins'],
    [
      ...new Set([
        ...(config.getIn(['auth', 'trustedOrigins'])?.toJSON?.() || []),
        origin.origin,
      ]),
    ],
  ],
  [['auth', 'advanced', 'useSecureCookies'], origin.protocol === 'https:'],
  [['releases', 'host', 'enabled'], mode === 'sso'],
  [['releases', 'host', 'host'], '127.0.0.1'],
  [['releases', 'host', 'port'], 13231],
  [['releases', 'host', 'publicUrl'], origin.origin],
])
  config.setIn(keys, value);
await writeFile('config.yml', String(config), { mode: 0o600 });
await chmod('config.yml', 0o600);
console.log(
  `Configured ${mode} mode for ${origin.origin}/main/. Run config check before starting.`,
);
console.log(
  mode === 'local'
    ? 'Use local account login. Remote HTTP OIDC callbacks are not supported.'
    : 'Use your existing trusted HTTPS ingress. Secure cookies remain enabled.',
);
console.log(
  'Existing instance URLs, versions and data have not been changed. Demo initialization is a separate explicit operation.',
);
