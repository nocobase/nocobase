import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
  symlink,
} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const appRoot = path.resolve(
  import.meta.dirname,
  '../../../templates/app-template-default',
);
export async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'create-module-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = JSON.parse(
    await readFile(path.join(appRoot, 'package.json'), 'utf8'),
  );
  manifest.name = 'module-generator-fixture';
  manifest.dependencies['@nocobase/app-plugin-modules'] = 'workspace:*';
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(manifest, null, 2),
  );
  await writeFile(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages: [packages/*]\n',
  );
  await mkdir(path.join(root, 'node_modules'));
  for (const entry of await readdir(path.join(appRoot, 'node_modules'))) {
    if (entry.startsWith('@')) {
      await mkdir(path.join(root, 'node_modules', entry));
      for (const name of await readdir(
        path.join(appRoot, 'node_modules', entry),
      ))
        await symlink(
          path.join(appRoot, 'node_modules', entry, name),
          path.join(root, 'node_modules', entry, name),
        );
    } else
      await symlink(
        path.join(appRoot, 'node_modules', entry),
        path.join(root, 'node_modules', entry),
      );
  }
  await symlink(
    path.resolve(import.meta.dirname, '../../../plugins/app-plugin-modules'),
    path.join(root, 'node_modules/@nocobase/app-plugin-modules'),
  );
  await mkdir(path.join(root, 'packages'));
  for (const side of ['client', 'server']) {
    await mkdir(path.join(root, side));
    const factory =
      side === 'client' ? 'defineClientPlugins' : 'defineServerPlugins';
    await writeFile(
      path.join(root, side, 'plugins.ts'),
      `import { ${factory} } from '@nocobase/app-${side}/plugins';\n${side === 'server' ? "import modules from '@nocobase/app-plugin-modules/server';" : ''}\nexport default ${factory}([${side === 'server' ? 'modules' : ''}]);\n`,
    );
  }
  return root;
}
