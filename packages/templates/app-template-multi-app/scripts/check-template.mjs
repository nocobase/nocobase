import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const commercial = ['multi-app', 'identity-provider', 'platform-sso'].map(
  (name) => '@nocobase/app-plugin-' + name,
);
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return (
    relative !== '..' &&
    !relative.startsWith('..' + path.sep) &&
    !path.isAbsolute(relative)
  );
};

/** Structural checks need no commercial credentials and do not establish runtime acceptance. */
export async function checkTemplate(
  root,
  { allowRuntimeData = false, allowWorkspaceProtocols = false } = {},
) {
  const read = (relative) => readFile(path.join(root, relative), 'utf8');
  const manifest = JSON.parse(await read('package.json'));
  if (
    manifest.nocobase?.templateKind !== 'app' ||
    JSON.stringify(manifest.nocobase.appDirectories) !==
      JSON.stringify(['.', 'apps/sub'])
  ) {
    throw new Error(
      'The template must declare the root Main App and apps/sub.',
    );
  }
  const roots = manifest.nocobase.appDirectories.map((directory) =>
    path.resolve(root, directory),
  );
  const names = new Set();
  for (const directory of manifest.nocobase.appDirectories) {
    const app = JSON.parse(await read(directory + '/package.json'));
    if (
      app.nocobase?.templateKind !== 'app' ||
      app.scripts?.postinstall !== 'nocobase skills sync' ||
      app.scripts?.dev !== 'nocobase dev' ||
      app.scripts?.build !== 'nocobase build'
    ) {
      throw new Error(
        `${directory} must be an App with standard runtime and package Skills commands.`,
      );
    }
    if (typeof app.name !== 'string' || names.has(app.name))
      throw new Error('App package names must be unique.');
    names.add(app.name);
    if (!app.devDependencies?.['@nocobase/app-skills'])
      throw new Error(`${directory} needs the shared App Skills package.`);
    for (const group of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      for (const [name, range] of Object.entries(app[group] ?? {})) {
        if (
          typeof range !== 'string' ||
          /^(?:file:|link:|\/|\.{1,2}\/)/u.test(range) ||
          (/^(?:workspace:|catalog:)/u.test(range) &&
            (!allowWorkspaceProtocols || commercial.includes(name)))
        ) {
          throw new Error(
            `${directory}: ${name} must use an independently installable registry range.`,
          );
        }
      }
    }
    for (const file of [
      'client/runtime.ts',
      'server/standalone.ts',
      'server/embedded.ts',
      'server/plugins.ts',
      'config.example.yml',
      'AGENTS.md',
      'README.MD',
      'Dockerfile',
      'Dockerfile.dockerignore',
      'database/main/migrations/202610060001_create_device_code.ts',
      'public/assets/logo.png',
    ]) {
      await lstat(path.join(root, directory, file));
    }
    try {
      await lstat(path.join(root, directory, 'gitignore'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await lstat(path.join(root, directory, '.gitignore'));
    }
    if (
      !(await read(directory + '/client/runtime.ts')).includes(
        `packageName: '${app.name}'`,
      )
    ) {
      throw new Error(`${directory}: client/server package identity differs.`);
    }
    await auditTree(
      path.resolve(root, directory),
      path.resolve(root, directory),
      roots,
      { allowRuntimeData },
    );
  }
  const sub = JSON.parse(await read('apps/sub/package.json'));
  for (const name of commercial)
    if (!manifest.dependencies[name])
      throw new Error(`Main needs the licensed package ${name}.`);
  if (!sub.dependencies[commercial[2]])
    throw new Error('Sub needs the licensed platform-sso package.');
  if (manifest.dependencies[sub.name] || sub.dependencies[manifest.name]) {
    throw new Error(
      "Apps consume deployment archives, not each other's source packages.",
    );
  }
  return {
    applications: manifest.nocobase.appDirectories,
    commercialPackages: commercial,
  };
}

async function auditTree(directory, appRoot, roots, { allowRuntimeData }) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
    const relative = path.relative(appRoot, file).split(path.sep).join('/');
    // Installed guidance is generated content, not the application's own source.
    if (
      allowRuntimeData &&
      ['.agents/skills', '.claude/skills'].includes(relative)
    )
      continue;
    if (entry.isSymbolicLink())
      throw new Error(
        `Template source must not contain symbolic links: ${file}.`,
      );
    // The root Main owns its own source, not the source of any nested child App.
    if (roots.some((root) => root !== appRoot && root === file)) continue;
    if (
      ['config.yml', 'config.toml', 'storage', '.npmrc'].includes(entry.name) ||
      /^\.env(?:\.|$)/u.test(entry.name) ||
      /^database\.sqlite/u.test(entry.name)
    ) {
      if (allowRuntimeData) continue;
      throw new Error(
        `Do not ship local configuration or runtime data: ${file}.`,
      );
    }
    if (entry.isDirectory())
      await auditTree(file, appRoot, roots, { allowRuntimeData });
    else if (!/\.(?:png|ico)$/u.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      if (/\.(?:[cm]?[jt]sx?)$/u.test(file)) {
        for (const match of source.matchAll(
          /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.[^'"]+)['"]/gu,
        )) {
          const target = path.resolve(path.dirname(file), match[1]);
          const owner = roots
            .filter((root) => inside(root, target))
            .sort((a, b) => b.length - a.length)[0];
          if (owner !== appRoot)
            throw new Error(
              `App imports must not depend on another repository or App: ${file}: ${match[1]}.`,
            );
        }
      }
      if (
        /\/Users\/|nocobase3[-]pro|vendor\/nocobase3|NOCOBASE_OIDC_HTTP[_]ORIGIN|build-templates\.mjs/u.test(
          source,
        )
      ) {
        throw new Error(
          `Remove repository-only references or unsupported patches from ${file}.`,
        );
      }
      if (/nbr_[A-Za-z0-9]{10}|sk-[A-Za-z0-9]{20}/u.test(source))
        throw new Error(`Potential credential in ${file}.`);
    }
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const current = JSON.parse(
    await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  const root =
    process.argv.find(
      (argument, index) => index > 1 && !argument.startsWith('--'),
    ) ??
    (current.nocobase?.templateKind === 'app'
      ? packageRoot
      : path.join(packageRoot, 'template'));
  const result = await checkTemplate(path.resolve(root), {
    allowRuntimeData: process.argv.includes('--allow-runtime-data'),
    allowWorkspaceProtocols:
      current.nocobase?.templateKind !== 'app' &&
      path.resolve(root) === path.join(packageRoot, 'template'),
  });
  console.log(
    `Template structure checked: ${result.applications.join(', ')}. Commercial installation and runtime acceptance are separate.`,
  );
}
