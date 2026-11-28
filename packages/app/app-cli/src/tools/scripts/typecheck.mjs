import path from 'node:path';
import spawn from 'cross-spawn';

import { buildNodeOptions } from './utils/build-workspace.mjs';
import { resolveTypeScript } from './utils/typescript.mjs';

const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const compiler = resolveTypeScript(rootDir);
process.env.NODE_OPTIONS = buildNodeOptions(process.env.NODE_OPTIONS);

console.log(`Using ${compiler.name}`);
for (const config of [
  'tsconfig.json',
  'tsconfig.node.json',
  'tsconfig.server.json',
]) {
  const result = spawn.sync(
    compiler.command,
    [...compiler.args, '-p', config, '--noEmit'],
    { cwd: rootDir, stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
