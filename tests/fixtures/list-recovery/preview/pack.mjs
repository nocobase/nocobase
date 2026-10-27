import {
  cp,
  copyFile,
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { sampleIds } from './routing.mjs';

// Inputs are the four independently generated and verified build outputs.
// This packages evidence; it never performs or marks a template upgrade.
export async function packSamples(carrierDir, manifestFile) {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const sources = new Set();
  for (const id of sampleIds) {
    const sample = manifest.samples?.[id];
    if (!sample?.sourceDir || !sample.target || sample.status !== 'verified') {
      throw new Error(`Unverified acceptance sample: ${id}`);
    }
    const source = await realpath(
      path.resolve(path.dirname(manifestFile), sample.sourceDir),
    );
    if (sources.has(source))
      throw new Error('Acceptance samples must have independent sources');
    sources.add(source);
    const pkg = JSON.parse(
      await readFile(path.join(source, 'package.json'), 'utf8'),
    );
    if (pkg.nocobase?.defaultTemplateVersion !== sample.target) {
      throw new Error(`Incomplete template upgrade: ${id}`);
    }
    const template = `@nocobase/app-template-${id.split('-')[0]}`;
    if (
      pkg.nocobase.templatePackage !== template ||
      sample.template !== template
    ) {
      throw new Error(`Wrong template identity: ${id}`);
    }
    if (
      id.endsWith('-upgraded') &&
      (!sample.base || sample.base === sample.target)
    ) {
      throw new Error(`Missing upgrade baseline: ${id}`);
    }
    for (const file of [
      'dist/server/embedded.js',
      'dist/client/index.html',
      'pnpm-lock.yaml',
    ]) {
      if (!(await stat(path.join(source, file))).isFile())
        throw new Error(`Missing sample build: ${id}`);
    }
  }
  try {
    await stat(path.join(carrierDir, 'dist/server/carrier-embedded.js'));
    throw new Error(
      'Acceptance archive is already packaged; rebuild the carrier first',
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const target = path.join(carrierDir, 'dist/acceptance');
  await mkdir(target, { recursive: true });
  const publicManifest = { samples: {} };
  for (const id of sampleIds) {
    const sample = manifest.samples[id];
    const source = path.resolve(path.dirname(manifestFile), sample.sourceDir);
    const dist = path.join(source, 'dist');
    await cp(dist, path.join(target, id, 'dist'), {
      recursive: true,
      verbatimSymlinks: true,
      filter: (file) =>
        !['.env', '.env.local', 'config.yml'].includes(
          path.relative(dist, file),
        ),
    });
    publicManifest.samples[id] = {
      base: sample.base,
      target: sample.target,
      template: sample.template,
    };
  }
  await writeFile(
    path.join(target, 'manifest.json'),
    `${JSON.stringify(publicManifest, null, 2)}\n`,
  );
  const server = path.join(carrierDir, 'dist/server');
  await rename(
    path.join(server, 'embedded.js'),
    path.join(server, 'carrier-embedded.js'),
  );
  for (const [source, destination] of [
    ['embedded.mjs', 'embedded.js'],
    ['routing.mjs', 'routing.mjs'],
  ]) {
    await copyFile(
      new URL(source, import.meta.url),
      path.join(server, destination),
    );
  }
}
