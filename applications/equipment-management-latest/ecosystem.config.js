import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// The pm2 process name. `APP_PM2_NAME` chooses it; otherwise it follows the application's package name, read from the
// project root or, beside an unpacked deployment archive, from `dist/package.json`. Two applications on one machine
// then get different names: pm2 treats `pm2 start` on a name it already runs as a restart of that process.
const manifest = ['package.json', 'dist/package.json']
  .map((file) => path.join(import.meta.dirname, file))
  .find((file) => existsSync(file));
const packageName = manifest
  ? JSON.parse(readFileSync(manifest, 'utf8')).name
  : undefined;
const name =
  process.env.APP_PM2_NAME ||
  `nocobase-${String(packageName ?? 'app').replace(/^@[^/]+\//, '')}`;

export const apps = [
  {
    name,
    // pm2's fork mode loads a script through its own wrapper, so
    // import.meta.main is false there and standalone.js never starts the
    // server. Running node itself keeps standalone.js the main module.
    script: 'node',
    args: './dist/server/standalone.js',
    // Resolve `args` against this file's directory rather than wherever
    // `pm2 start` runs, so the path to this file can be given from anywhere.
    cwd: import.meta.dirname,
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
    },
  },
];

export default { apps };
