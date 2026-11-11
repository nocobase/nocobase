import { execFileSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTemplate } from './check-template.mjs';
import { packAppManifest } from './pack-app-manifest.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'template');

/** Publish a complete root App, not the tooling package that builds its source payload. */
export async function buildTemplate() {
  await checkTemplate(source, { allowWorkspaceProtocols: true });
  const wrapper = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );
  // Ask pnpm for workspace locations only; pnpm pack remains the version resolver.
  const projects = JSON.parse(
    execFileSync('pnpm', ['-r', 'list', '--depth=-1', '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  );
  const workspacePackages = new Map(
    projects.map((project) => [project.name, project.path]),
  );
  const temporary = await mkdtemp(path.join(root, '.template-stage-'));
  const staged = path.join(temporary, 'app');
  try {
    await cp(source, staged, {
      recursive: true,
      filter: (file) =>
        !['node_modules', 'dist', 'coverage'].includes(path.basename(file)),
    });
    const filename = path.join(staged, 'package.json');
    const manifest = JSON.parse(await readFile(filename, 'utf8'));
    const sourceName = manifest.name;
    Object.assign(manifest, {
      name: wrapper.name,
      version: wrapper.version,
      license: wrapper.license,
      description: wrapper.description,
      repository: wrapper.repository,
      publishConfig: { access: wrapper.publishConfig.access },
    });
    delete manifest.private;
    manifest.nocobase = {
      ...manifest.nocobase,
      templateKind: 'app',
      appDirectories: ['.', 'apps/sub'],
      templatePackage: wrapper.name,
      defaultTemplateVersion: wrapper.version,
    };
    await writeFile(filename, JSON.stringify(manifest, null, 2) + '\n');
    // Only runtime package identity changes. Persisted business and migration identifiers remain untouched.
    for (const file of [
      'client/runtime.ts',
      'client/service-provider.ts',
      'server/providers/app-example.ts',
    ]) {
      const target = path.join(staged, file);
      try {
        const contents = await readFile(target, 'utf8');
        await writeFile(target, contents.split(sourceName).join(wrapper.name));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    await cp(
      path.join(root, 'scripts/check-template.mjs'),
      path.join(staged, 'scripts/check-template.mjs'),
    );
    await cp(
      path.join(root, 'CHANGELOG.md'),
      path.join(staged, 'CHANGELOG.md'),
    );
    // Pack the child first: pnpm only transforms its own top-level manifest.
    // Keep the workspace configuration inert so both packs use the OSS root catalog.
    for (const [index, directory] of ['apps/sub', '.'].entries()) {
      await packAppManifest(
        path.join(staged, directory),
        workspacePackages,
        path.join(temporary, `app-${index}.tgz`),
      );
    }
    await checkTemplate(staged);
    // Do not replace the last valid output until the next payload has passed its structural audit.
    const output = path.join(root, 'dist');
    await mkdir(path.dirname(output), { recursive: true });
    await rm(output, { recursive: true, force: true });
    await rename(staged, output);
    return output;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(
    'Built root Main application template: ' + (await buildTemplate()),
  );
}
