import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { parse, stringify } from 'yaml';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const stateFile = '.local-template-hashes.json';
const template = path.join(root, 'packages/templates/app-template-default');
const localApp = path.join(root, 'local/default');

async function stat(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function hash(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

async function snapshot(dir) {
  const hashes = {};
  for (const entry of await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  })) {
    const file = path.join(entry.parentPath, entry.name);
    if (entry.isSymbolicLink())
      throw new Error('Unexpected template symlink: ' + file);
    if (entry.isFile()) hashes[path.relative(dir, file)] = await hash(file);
  }
  return hashes;
}

// Compare the last generated content, the next template and the local copy before applying any change.
export async function syncTemplate(staged, app, refresh) {
  const incoming = await snapshot(staged);
  const state = path.join(app, stateFile);
  if ((await stat(app))?.isSymbolicLink())
    throw new Error('Unexpected symlink: ' + app);
  const prior = await stat(state);
  if (prior && !prior.isFile())
    throw new Error('Invalid template state: ' + state);
  if (!prior && (await stat(app)) && (await readdir(app)).length)
    throw new Error('Existing directory has no local template state: ' + app);
  if (!prior) {
    await mkdir(app, { recursive: true });
    await writeFile(state, 'null', { flag: 'wx' });
  }
  const previous = prior ? JSON.parse(await readFile(state, 'utf8')) : null;
  const before = previous ?? {};
  const files = [
    ...new Set([...Object.keys(before), ...Object.keys(incoming)]),
  ].filter((file) => before[file] !== incoming[file]);
  if (previous && (!files.length || !refresh))
    return { stale: files.length > 0, changed: false };
  const conflicts = [];
  const changes = [];
  for (const file of files) {
    const parts = file.split(path.sep);
    if (path.isAbsolute(file) || parts.includes('..') || file === stateFile)
      throw new Error('Invalid template path: ' + file);
    let parent = app;
    for (const part of parts.slice(0, -1)) {
      parent = path.join(parent, part);
      const info = await stat(parent);
      if (info && !info.isDirectory())
        throw new Error('Template path blocked by local file: ' + parent);
    }
    const target = path.join(app, file);
    const info = await stat(target);
    const current = info?.isFile()
      ? await hash(target)
      : info
        ? null
        : undefined;
    if (current === incoming[file]) continue;
    if (current !== before[file]) conflicts.push(file);
    else changes.push(file);
  }
  if (conflicts.length)
    throw new Error(
      'Local edits conflict with the template:\n' + conflicts.join('\n'),
    );
  await mkdir(app, { recursive: true });
  const temporary = await mkdtemp(path.join(app, '.template-state-'));
  try {
    for (const file of changes) {
      const target = path.join(app, file);
      if (!Object.hasOwn(incoming, file)) await rm(target);
      else {
        await mkdir(path.dirname(target), { recursive: true });
        const copy = path.join(temporary, 'file');
        await cp(path.join(staged, file), copy);
        await rename(copy, target);
      }
    }
    await writeFile(path.join(temporary, 'state'), JSON.stringify(incoming));
    await rename(path.join(temporary, 'state'), state);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  return { stale: false, changed: true };
}

// Read working-tree files, including new source files, and respect the template and repository ignore rules.
export async function stageTemplate(source, staged) {
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.'],
    { cwd: source, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const sourceRoot = await realpath(source);
  const runtimeEntries = new Set([
    'config.yml',
    'config.toml',
    'storage',
    'dist',
    'node_modules',
  ]);
  for (const file of files) {
    const [top] = file.split('/');
    if (
      runtimeEntries.has(top) ||
      (top !== '.env.example' && /^\.env(?:\.|$)/u.test(top)) ||
      /\.sqlite(?:-(?:wal|shm|journal))?$/u.test(file)
    )
      continue;
    const from = path.join(sourceRoot, file);
    const info = await stat(from);
    if (!info) continue; // A tracked file can have an unstaged deletion.
    if (!info.isFile() || (await realpath(from)) !== from)
      throw new Error('Unexpected template entry: ' + from);
    const to = path.join(staged, file);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to);
  }

  const manifestPath = path.join(staged, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const templateName = manifest.name;
  manifest.name = templateName + '-local';
  manifest.private = true;
  delete manifest.publishConfig;
  // config init uses SQLite as a runtime dependency. Record it before the first install.
  const driver = '@nocobase/db-sqlite';
  manifest.dependencies[driver] ??= manifest.devDependencies[driver];
  delete manifest.devDependencies[driver];
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  for (const relative of ['client/runtime.ts', 'client/service-provider.ts']) {
    const target = path.join(staged, relative);
    await writeFile(
      target,
      (await readFile(target, 'utf8')).replaceAll(templateName, manifest.name),
    );
  }
  // The template's Tailwind configuration registers linked plugin sources separately.
  const css = path.join(staged, 'client/styles.css');
  await writeFile(
    css,
    (await readFile(css, 'utf8')).replace(
      "@import 'tailwindcss';",
      "@import 'tailwindcss' source('.');",
    ),
  );
}

// Only the app is a member of this workspace. Reuse the template's installed dependencies, including
// singleton peers such as React, while letting pnpm resolve additions to the local manifest independently.
export async function stageWorkspace(staged, app, source) {
  const settings = parse(
    await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8'),
  );
  settings.packages = ['.'];
  const manifest = JSON.parse(
    await readFile(path.join(staged, 'package.json'), 'utf8'),
  );
  for (const [name, spec] of Object.entries({
    ...manifest.devDependencies,
    ...manifest.dependencies,
  })) {
    const target = path
      .relative(app, path.join(source, 'node_modules', name))
      .split(path.sep)
      .join('/');
    settings.overrides[`${manifest.name}>${name}@${spec}`] = 'link:' + target;
  }
  await writeFile(
    path.join(staged, 'pnpm-workspace.yaml'),
    stringify(settings),
  );
}

async function installLocal(app) {
  const workspace = path.join(app, 'pnpm-workspace.yaml');
  if (!(await stat(workspace)))
    throw new Error(
      `Run pnpm local:refresh ${path.basename(app)} to migrate this app to its own workspace.`,
    );
  const marker = path.join(app, 'node_modules/.local-install-hash');
  const lock = path.join(app, 'pnpm-lock.yaml');
  const fingerprint =
    (await hash(path.join(app, 'package.json'))) + (await hash(workspace));
  if (
    (await stat(lock)) &&
    (await stat(marker)) &&
    (await readFile(marker, 'utf8')) === fingerprint
  )
    return;
  execFileSync('pnpm', ['install', '--no-frozen-lockfile'], {
    cwd: app,
    stdio: 'inherit',
  });
  await writeFile(marker, fingerprint);
}

async function prepare(action) {
  const staged = await mkdtemp(path.join(tmpdir(), 'nocobase-default-'));
  try {
    await stageTemplate(template, staged);
    await stageWorkspace(staged, localApp, template);
    const result = await syncTemplate(staged, localApp, action === 'refresh');
    if (result.stale)
      console.warn(
        'Template changed. Run pnpm local:refresh default to apply it.',
      );
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
  await installLocal(localApp);
  if (action === 'start' && !(await stat(path.join(localApp, 'config.yml'))))
    execFileSync(
      'pnpm',
      ['exec', 'nocobase', 'config', 'init', '--dialect', 'sqlite'],
      { cwd: localApp, stdio: 'inherit' },
    );
}

async function main(action, edition, ...extra) {
  if (
    !['start', 'refresh'].includes(action) ||
    edition !== 'default' ||
    extra.length
  )
    throw new Error('Use pnpm dev:default or pnpm local:refresh default.');
  const cache = path.join(root, 'node_modules/.cache/local-default');
  await mkdir(cache, { recursive: true });
  // Serialize generation and installation. SQLite releases the lock even if a command is interrupted.
  const lock = new DatabaseSync(path.join(cache, 'prepare.sqlite'), {
    timeout: 120000,
  });
  try {
    lock.exec('BEGIN IMMEDIATE');
    await prepare(action);
  } finally {
    lock.close();
  }
  if (action === 'refresh') return;
  const child = spawn('pnpm', ['dev'], { cwd: localApp, stdio: 'inherit' });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => child.kill(signal));
  child.once('exit', (code, signal) => {
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 143);
  });
}

if (process.argv[1] === import.meta.filename)
  await main(...process.argv.slice(2));
