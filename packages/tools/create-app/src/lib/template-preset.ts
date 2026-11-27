import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type EnterprisePreset = 'multi-app' | 'sub-app' | 'multi-portal';

interface Manifest {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  nocobase?: { presets?: string[]; capabilities?: string[]; cli?: unknown };
}

async function safePath(root: string, name: string): Promise<string> {
  if (
    path.isAbsolute(name) ||
    name.includes('\\') ||
    name.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error('Invalid preset file path.');
  let current = root;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error('Unexpected symbolic link in preset path: ' + name);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
  return current;
}

async function contents(file: string): Promise<Buffer | null> {
  try {
    return await readFile(file);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}
const hash = (data: Buffer | null): string | null =>
  data === null ? null : createHash('sha256').update(data).digest('hex');

// Apply data shipped by the edition inside the unpacked temporary directory, before creating the user's project.
export async function applyTemplatePreset(
  root: string,
  preset: EnterprisePreset,
): Promise<boolean> {
  const manifestPath = await safePath(root, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
  if (!manifest.nocobase?.presets?.includes(preset)) return false;
  const descriptor = JSON.parse(
    await readFile(await safePath(root, 'presets/' + preset + '.json'), 'utf8'),
  ) as {
    format: number;
    files: Record<string, { before: string | null; after: string | null }>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    cli?: unknown;
  };
  if (descriptor.format !== 1)
    throw new Error('Unsupported application preset format.');
  for (const [name, change] of Object.entries(descriptor.files)) {
    if (
      !/^(?:(?:client|server|cli|tests|\.agents\/rules)\/|(?:AGENTS\.md|README\.(?:md|MD)|vitest\.config\.ts|config\.example\.yml)$)/u.test(
        name,
      )
    )
      throw new Error('Unexpected application preset file: ' + name);
    const file = await safePath(root, name);
    if (hash(await contents(file)) !== change.before)
      throw new Error('Template and preset disagree on ' + name);
    if (change.after === null) {
      await rm(file, { force: true });
      continue;
    }
    if (!/^[0-9a-f]{64}$/u.test(change.after))
      throw new Error('Invalid application preset digest.');
    const data = await readFile(
      await safePath(root, 'presets/content/' + change.after),
    );
    if (hash(data) !== change.after)
      throw new Error('Invalid application preset content for ' + name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  }
  Object.assign(manifest.devDependencies, descriptor.devDependencies);
  Object.assign(manifest.dependencies, descriptor.dependencies);
  for (const name of Object.keys(descriptor.dependencies))
    delete manifest.devDependencies[name];
  manifest.nocobase.capabilities = [preset];
  if (descriptor.cli) manifest.nocobase.cli = descriptor.cli;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return true;
}
