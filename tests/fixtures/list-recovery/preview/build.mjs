import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreInputs } from './restore.mjs';
import { serveCandidate } from './dependencies.mjs';
import { packSamples } from './pack.mjs';
import { deduplicateStaging } from './deduplicate.mjs';

export async function buildSamples(work) {
  const manifest = await restoreInputs(work);
  const dependency = await serveCandidate(work, manifest);
  const env = {
    ...process.env,
    ENVIRONMENT: 'acceptance-child',
    APP_ID: '',
    NOCOBASE_ACCEPTANCE_BUILD: '',
    npm_config_registry: 'https://registry.npmjs.org',
  };
  delete env.NOCOBASE_TOOL_ROOT;
  delete env.NOCOBASE_APP_ROOT;
  delete env.NOCOBASE_CLI_HOOKS;
  const run = (args, cwd) =>
    new Promise((resolve, reject) => {
      const child = spawn('pnpm', args, { cwd, env, stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(Error(`Sample command failed (${code}): ${args.join(' ')}`)),
      );
    });
  try {
    for (const [id, sample] of Object.entries(manifest.samples)) {
      const cwd = path.join(work, sample.sourceDir);
      const start = Date.now();
      await writeFile(
        path.join(cwd, '.npmrc'),
        `registry=https://registry.npmjs.org\n@nocobase:registry=${dependency.url}\n`,
      );
      await run(['install', '--frozen-lockfile'], cwd);
      if (
        createHash('sha256')
          .update(await readFile(path.join(cwd, 'pnpm-lock.yaml')))
          .digest('hex') !== sample.lockHash
      )
        throw Error(`Lock changed: ${id}`);
      await run(['typecheck'], cwd);
      await run(['build', '--target', 'linux-x64'], cwd);
      sample.buildMs = Date.now() - start;
      console.log(
        JSON.stringify({
          id,
          buildMs: sample.buildMs,
          result: 'built from frozen recovery inputs',
        }),
      );
    }
    await writeFile(
      path.join(work, 'samples.json'),
      `${JSON.stringify({ samples: manifest.samples }, null, 2)}\n`,
    );
    return manifest;
  } finally {
    await dependency.close();
  }
}

export async function buildPreview(carrier) {
  await mkdir(path.join(carrier, 'storage'), { recursive: true });
  const work = await mkdtemp(
    path.join(carrier, 'storage', 'list-recovery-build-'),
  );
  await buildSamples(work);
  // All hard links are made in an owned copy, never in pnpm's dependency store.
  const staging = path.join(work, 'staging');
  await mkdir(staging);
  await cp(path.join(carrier, 'dist'), path.join(staging, 'dist'), {
    recursive: true,
    verbatimSymlinks: true,
    filter: (file) =>
      !['.env', '.env.local', 'config.yml', '.npmrc'].includes(
        path.relative(path.join(carrier, 'dist'), file),
      ),
  });
  await packSamples(staging, path.join(work, 'samples.json'));
  const dedup = await deduplicateStaging(staging);
  // Preserve hard links by moving the finished tree on the same filesystem.
  const { rename, rm } = await import('node:fs/promises');
  await rm(path.join(carrier, 'dist'), { recursive: true });
  await rename(path.join(staging, 'dist'), path.join(carrier, 'dist'));
  console.log(JSON.stringify({ acceptanceBuild: work, ...dedup }));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--samples')
    await buildSamples(path.resolve(process.argv[3]));
  else await buildPreview(path.resolve(process.argv[2]));
}
