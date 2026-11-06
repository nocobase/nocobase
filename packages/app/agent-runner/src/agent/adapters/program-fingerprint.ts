import { realpath, stat } from 'node:fs/promises';

/** A filesystem observation does not start the program or inspect account credentials. */
export async function programFingerprint(
  command: string | undefined,
  args: readonly string[] = [],
): Promise<string> {
  if (!command) return 'missing';
  try {
    const file = await realpath(command);
    const info = await stat(file);
    return JSON.stringify([command, file, args, info.mtimeMs, info.size]);
  } catch {
    return 'missing';
  }
}
