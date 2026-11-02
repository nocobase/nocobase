/** Finding a program as a shell would, on macOS, Linux and Windows. */
import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * The absolute path of the program named `name` in `dirs` or on PATH: an executable file of that name, or on Windows a
 * file of that name with one of PATHEXT's extensions, such as `npx.cmd` or `opencode.exe`.
 */
export async function findProgram(
  name: string,
  dirs: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<string | undefined> {
  const windows = platform === 'win32';
  const paths = windows ? path.win32 : path.posix;
  const searched = [
    ...dirs,
    ...(variable(env, 'PATH', platform) ?? '').split(paths.delimiter),
  ].filter(Boolean);
  const extensions = windows
    ? (variable(env, 'PATHEXT', platform) ?? '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .filter(Boolean)
    : [''];
  for (const dir of searched) {
    for (const extension of extensions) {
      const candidate = paths.join(dir, name + extension.toLowerCase());
      if (await runnable(candidate, windows)) return candidate;
    }
  }
  return undefined;
}

/** An environment variable; on Windows its name has any case, as `Path` usually has. */
export function variable(
  env: NodeJS.ProcessEnv,
  name: string,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  if (platform !== 'win32') return env[name];
  const key = Object.keys(env).find(
    (candidate) => candidate.toUpperCase() === name,
  );
  return key === undefined ? undefined : env[key];
}

async function runnable(file: string, windows: boolean): Promise<boolean> {
  try {
    // Windows has no execute bit: a file with a program's extension runs.
    if (windows) return (await stat(file)).isFile();
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
