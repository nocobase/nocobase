// Runs one of the development and build scripts under `tools/scripts/` against an application.
//
// The scripts stay plain Node modules run in a child process: each reads the application root from
// `NOCOBASE_TOOL_ROOT`, and several exit the process themselves, which a command running inside the CLI must not do.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const TOOL_ENTRIES = {
  dev: 'dev/index',
  build: 'build',
  start: 'start',
  retarget: 'utils/retarget-native',
  verify: 'utils/verify-server-deps',
} as const;
export type AppTool = keyof typeof TOOL_ENTRIES;
export interface RunAppToolOptions {
  readonly rootDir: string;
  readonly args?: readonly string[];
  /** Added to the child's environment, on top of this process's. */
  readonly env?: Readonly<Record<string, string>>;
  /** Node options for the child, such as a loader. Defaults to this process's. */
  readonly execArgv?: readonly string[];
}
export function runAppTool(
  tool: AppTool,
  options: RunAppToolOptions,
): Promise<number> {
  const rootDir = path.resolve(options.rootDir);
  const entry = fileURLToPath(
    new URL(`./scripts/${TOOL_ENTRIES[tool]}.mjs`, import.meta.url),
  );
  const env = {
    ...process.env,
    ...options.env,
    NOCOBASE_TOOL_ROOT: rootDir,
  };
  const execArgv = [...(options.execArgv ?? process.execArgv)];
  if (tool === 'dev') {
    return import('./scripts/dev/supervisor.mjs').then(
      ({ superviseDevelopment }) =>
        superviseDevelopment({ rootDir, entry, baseEnv: env, execArgv }),
    );
  }
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [...execArgv, entry, ...(options.args ?? process.argv.slice(2))],
      { cwd: rootDir, env, stdio: 'inherit' },
    );
    const stop = (): void => {
      child.kill('SIGTERM');
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    const cleanup = (): void => {
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
    };
    child.once('error', (error) => {
      cleanup();
      reject(error);
    });
    child.once('close', (code, signal) => {
      cleanup();
      resolve(code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1));
    });
  });
}
