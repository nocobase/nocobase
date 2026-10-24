import { createHash } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { readJson, writeJsonAtomic, type RunnerPaths } from '../lib/home.ts';

const LOCKFILES = [
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'npm-shrinkwrap.json',
  'deno.lock',
  'Cargo.lock',
  'Gemfile.lock',
  'poetry.lock',
  'uv.lock',
  'Pipfile.lock',
  'composer.lock',
  'go.sum',
];

function recordPath(paths: RunnerPaths, dir: string): string {
  return path.join(
    paths.home,
    'preparation',
    `${createHash('sha256').update(path.resolve(dir)).digest('hex')}.json`,
  );
}

export async function preparationHash(
  dir: string,
  prompt = '',
): Promise<string> {
  const hash = createHash('sha256').update(JSON.stringify(prompt));
  for (const file of LOCKFILES) {
    const contents = await readFile(path.join(dir, file)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
        return undefined;
      },
    );
    hash
      .update(JSON.stringify([file, contents?.length ?? null]))
      .update(contents ?? '');
  }
  return hash.digest('hex');
}

export async function preparationCurrent(
  paths: RunnerPaths,
  dir: string,
  hash: string,
): Promise<boolean> {
  return (
    (
      await readJson<{ hash: string }>(recordPath(paths, dir)).catch(
        () => undefined,
      )
    )?.hash === hash
  );
}

export async function confirmPreparation(
  paths: RunnerPaths,
  dir: string,
  prompt: string | undefined,
  hash: string,
): Promise<void> {
  if ((await preparationHash(dir, prompt)) === hash)
    await writeJsonAtomic(recordPath(paths, dir), { hash });
}

export async function invalidatePreparation(
  paths: RunnerPaths,
  dir: string,
): Promise<void> {
  await rm(recordPath(paths, dir), { force: true });
}
