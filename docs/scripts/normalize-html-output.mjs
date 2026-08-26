import fs from 'node:fs/promises';
import path from 'node:path';

const SKIP_FILES = new Set(['index.html', '404.html']);

function getOption(name) {
  const option = `--${name}`;
  const optionWithEquals = `${option}=`;

  for (let index = 0; index < process.argv.length; index++) {
    const arg = process.argv[index];

    if (arg === option) {
      return process.argv[index + 1];
    }

    if (arg.startsWith(optionWithEquals)) {
      return arg.slice(optionWithEquals.length);
    }
  }
}

function resolveOutDir() {
  const outDir = getOption('out-dir') || getOption('outDir');

  if (outDir) {
    return path.resolve(outDir);
  }

  const lang = getOption('lang') || process.env.DOCS_LANG || 'en';
  return path.resolve(lang === 'en' ? 'dist' : `dist/${lang}`);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetPath) {
  if (await pathExists(targetPath)) {
    const stats = await fs.stat(targetPath);
    if (!stats.isDirectory()) {
      throw new Error(`Target path is not a directory: ${targetPath}`);
    }
    return;
  }

  await fs.mkdir(targetPath, { recursive: true });
}

async function walk(dir) {
  let movedCount = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      movedCount += await walk(fullPath);
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name) !== '.html' || SKIP_FILES.has(entry.name)) {
      continue;
    }

    const fileName = path.basename(entry.name, '.html');
    const targetDir = path.join(dir, fileName);
    const targetFile = path.join(targetDir, 'index.html');

    if (await pathExists(targetFile)) {
      throw new Error(`Target already exists: ${targetFile}`);
    }

    await ensureDirectory(targetDir);
    await fs.rename(fullPath, targetFile);
    movedCount += 1;
  }

  return movedCount;
}

async function main() {
  const outDir = resolveOutDir();

  if (!(await pathExists(outDir))) {
    throw new Error(`Output directory does not exist: ${outDir}`);
  }

  const movedCount = await walk(outDir);
  console.log(`Normalized HTML output under ${outDir}. Moved ${movedCount} file(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
