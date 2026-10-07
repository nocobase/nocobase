/**
 * The commands a page shows to install what this application serves (standalone builds with their own Node): the
 * runner, `nocobase-runner`, and the application's CLI. "Add runtime" shows one line with `--runner` and a registration
 * token (Cloudflare-Tunnel-style onboarding) that installs both, registers the runner and starts it as a user service;
 * the trust level and the coding tools it may run travel with the token, so the command carries nothing else. Without
 * `--runner`, a download token installs the CLI alone (`cliInstallCommand`).
 */
import { RUNNER_PRODUCT } from '@nocobase/agent-protocol';

/** The systems a page offers a command for. Windows is not supported by the runner yet. */
export const INSTALL_SYSTEMS = ['macos', 'linux', 'windows'] as const;

export type InstallSystem = (typeof INSTALL_SYSTEMS)[number];

/** Where this plugin serves the install script (`GET`), relative to the address. */
export const INSTALL_SCRIPT_PATH = '/api/agents/dist/installScript';

function quote(value: string): string {
  return /^[\w@%+=:,./-]+$/u.test(value)
    ? value
    : `'${value.replaceAll("'", `'"'"'`)}'`;
}

/** The one-line install of a runtime for `system`, or null where the runner does not run. */
export function installCommand(
  system: InstallSystem,
  server: string,
  token: string,
): string | null {
  if (system === 'windows') return null;
  const base = server.replace(/\/+$/u, '');
  return `curl -fsSL ${quote(`${base}${INSTALL_SCRIPT_PATH}`)} | sh -s -- --runner --server ${quote(base)} --token ${quote(token)}`;
}

/**
 * The one-line install of the CLI alone, with a download token; the script defaults its server to the address it came
 * from, so the line names it once.
 */
export function cliInstallCommand(server: string, token: string): string {
  const base = server.replace(/\/+$/u, '');
  return `curl -fsSL ${quote(`${base}${INSTALL_SCRIPT_PATH}`)} | sh -s -- --token ${quote(token)}`;
}

/** For a host that already has `nocobase-runner`: register it and install the login service. */
export function registerCommand(server: string, token: string): string {
  const base = server.replace(/\/+$/u, '');
  return `${RUNNER_PRODUCT} register --server ${quote(base)} --token ${quote(token)} && ${RUNNER_PRODUCT} service install`;
}

/**
 * What updates a runner now to the version this application serves: `nocobase-runner update`; null for a runner that
 * reported another product or none, which has to be installed again. An installed runner also updates on its own
 * between runs.
 */
export function upgradeCommand(product: string | null): string | null {
  return product === RUNNER_PRODUCT ? `${RUNNER_PRODUCT} update` : null;
}

/** The system the browser runs on, as the default tab. */
export function guessSystem(userAgent: string): InstallSystem {
  if (/windows/iu.test(userAgent)) return 'windows';
  if (/mac os|macintosh/iu.test(userAgent)) return 'macos';
  return 'linux';
}
