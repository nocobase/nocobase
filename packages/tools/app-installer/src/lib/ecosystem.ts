export interface EcosystemOptions {
  /** pm2 process name. */
  name: string;
  /** Absolute path of the Node binary the application runs on. */
  nodePath: string;
  /**
   * Leave the process's children to it when pm2 stops it. The Hub stops its App Host child itself, and the child exits
   * on its own if the Hub is killed; an application without such a child keeps pm2's default and has its tree killed.
   */
  keepChildren?: boolean;
}

/**
 * Builds `ecosystem.config.cjs`, the pm2 configuration every start goes through.
 *
 * pm2 runs `node launcher.mjs` rather than the application's entry file. The file names nothing that changes: which
 * release runs and with which variables is decided by `launcher.mjs` each time the process starts, so a plain
 * `pm2 restart` picks up a switched `current` and an edited `app.env`.
 *
 * pm2 runs `node` itself, with the script as its argument. Pointing `script` at a module instead has pm2's fork mode
 * load it through `ProcessContainerFork.js`, where `import.meta.main` is false, so `standalone.js` never calls
 * `startServer()` and the application silently never starts.
 */
export function buildEcosystemConfig(options: EcosystemOptions): string {
  return `// Written by app-installer. Starting the application always goes through this file.
const path = require('node:path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: ${JSON.stringify(options.name)},
      // Run node itself, so launcher.mjs, and the application after it, are the main module (import.meta.main).
      script: ${JSON.stringify(options.nodePath)},
      // launcher.mjs reads app.env and resolves \`current\` on every start, so \`pm2 restart\` applies changes to either.
      args: [path.join(root, 'launcher.mjs')],
      interpreter: 'none',
      cwd: root,
      autorestart: true,
      min_uptime: '30s',
      max_restarts: 10,
      exp_backoff_restart_delay: 1000,
      // pm2 sends SIGKILL 1.6s after SIGINT by default; the application finishes what it is doing first.
      kill_timeout: 60000,${
        options.keepChildren
          ? `
      // The Hub stops its App Host child itself, and the child exits on its own if the Hub is killed.
      treekill: false,`
          : ''
      }
      out_file: path.join(root, 'logs/app.out.log'),
      error_file: path.join(root, 'logs/app.err.log'),
      time: true,
    },
  ],
};
`;
}

/**
 * Builds `launcher.mjs`, the script pm2 runs. On every start it reads `app.env`, resolves `current`, and replaces itself
 * with `node <release>/dist/server/standalone.js` through `process.execve`.
 *
 * Replacing the process rather than starting a child keeps the application on the pid pm2 watches, receiving pm2's
 * signals itself and running as the main module. A child would need its signals forwarded, and would outlive a
 * launcher that pm2 kills, holding the port the next start needs. Node flags given to the launcher, such as
 * `--max-old-space-size` in `args`, pass on to the application; pm2's `node_args` does not apply to an
 * `interpreter: 'none'` process.
 *
 * pm2 gives the launcher an IPC channel, but the channel does not survive `process.execve`: the application starts
 * without `process.send`, and pm2 options that rely on it, such as `wait_ready` and `shutdown_with_message`, are not
 * available.
 *
 * The entry is resolved to its real path, so a running application keeps loading its modules from the release it
 * started from even after `current` moves on.
 */
export function buildLauncher(): string {
  return `// Written by app-installer. pm2 runs this file; it starts the release \`current\` points at, with app.env applied.
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

const root = import.meta.dirname;
const env = {
  ...process.env,
  ...parseEnv(readFileSync(path.join(root, 'app.env'), 'utf8')),
};
const entry = realpathSync(path.join(root, 'current/dist/server/standalone.js'));

// Become the application rather than start it as a child: same pid for pm2, signals delivered directly, and
// standalone.js is the main module, which is what makes it start the server. Node flags and arguments pass on
// unchanged.
process.execve(
  process.execPath,
  [process.execPath, ...process.execArgv, entry, ...process.argv.slice(2)],
  env,
);
`;
}
