import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
  copyFile,
  realpath,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { parse } from 'yaml';

import { createPlugin } from '../src/lib/scaffold.ts';

const execute = promisify(execFile);
const repository = fileURLToPath(new URL('../../../../', import.meta.url));
const uiRoot = path.join(repository, 'ui-library');
const uiRequire = createRequire(path.join(uiRoot, 'package.json'));
const shadcn = path.join(uiRoot, 'node_modules/shadcn/dist/index.js');
const primitiveNames = ['collapsible', 'select', 'switch'];

interface Manifest {
  name: string;
  imports: Record<string, string | Record<string, string>>;
  publishConfig: { imports: Record<string, string> };
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function json(file: string): Promise<Manifest> {
  return JSON.parse(await readFile(file, 'utf8')) as Manifest;
}

async function run(
  command: string,
  args: string[],
  cwd: string,
  extraEnv: NodeJS.ProcessEnv = {},
): Promise<string> {
  try {
    const result = await execute(command, args, {
      cwd,
      env: { ...process.env, NODE_OPTIONS: '', ...extraEnv },
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return result.stdout;
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    throw new Error(
      `${command} ${args.join(' ')} failed in ${cwd}\n${failure.stdout ?? ''}\n${failure.stderr ?? ''}`,
      { cause: error },
    );
  }
}

async function linkDependencies(directory: string): Promise<void> {
  await mkdir(path.join(directory, 'node_modules'), { recursive: true });
  for (const name of [
    'react',
    'react-dom',
    '@base-ui/react',
    'cn',
    'lucide-react',
    '@types/react',
    '@nocobase/dev-config',
  ]) {
    const source = await realpath(path.join(uiRoot, 'node_modules', name));
    const destination = path.join(directory, 'node_modules', name);
    await mkdir(path.dirname(destination), { recursive: true });
    await symlink(source, destination, 'junction');
  }
  const bin = path.join(directory, 'node_modules/.bin');
  await mkdir(bin);
  await symlink(
    await realpath(path.join(uiRoot, 'node_modules/typescript/bin/tsc')),
    path.join(bin, 'tsc'),
  );
}

async function files(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(path.join(directory, prefix), {
    withFileTypes: true,
  });
  const result: string[] = [];
  for (const entry of entries) {
    const name = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...(await files(directory, name)));
    else result.push(name);
  }
  return result;
}

async function prepareOfflineMetadata(cache: string): Promise<void> {
  const lockfile = parse(
    await readFile(path.join(repository, 'pnpm-lock.yaml'), 'utf8'),
  ) as {
    packages: Record<string, { resolution: { integrity: string } }>;
  };
  // Frozen installs restore package contents, not the registry metadata pnpm add needs.
  // Seed a private pnpm 11 metadata cache from actual installed, locked versions,
  // including the generated plugin's catalog dependencies and their transitives.
  // The real CLI still resolves dependencies and updates its own manifest/lockfile offline.
  const metadataByName = new Map<
    string,
    {
      name: string;
      'dist-tags': { latest: string };
      versions: Record<string, unknown>;
    }
  >();
  async function addInstalled(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      // Only real package directories belong to this store entry; dependency links
      // point at other entries, and must not be followed recursively.
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const target = path.join(directory, entry.name);
      if (entry.name.startsWith('@')) {
        await addInstalled(target);
        continue;
      }
      const manifest = JSON.parse(
        await readFile(path.join(target, 'package.json'), 'utf8'),
      ) as {
        name: string;
        version: string;
      };
      const { name, version } = manifest;
      const resolution = lockfile.packages[`${name}@${version}`]?.resolution;
      if (!resolution?.integrity)
        throw new Error(
          `Installed ${name}@${version} is not in the repository lockfile`,
        );
      const metadata = metadataByName.get(name) ?? {
        name,
        'dist-tags': { latest: version },
        versions: {},
      };
      metadata.versions[version] = {
        ...manifest,
        dist: {
          integrity: resolution.integrity,
          tarball: `https://registry.npmjs.org/${name}/-/${path.basename(name)}-${version}.tgz`,
        },
      };
      metadataByName.set(name, metadata);
    }
  }
  const store = path.join(repository, 'node_modules/.pnpm');
  for (const entry of await readdir(store, { withFileTypes: true })) {
    if (
      !entry.isDirectory() ||
      entry.name === 'node_modules' ||
      entry.name.startsWith('.')
    )
      continue;
    await addInstalled(path.join(store, entry.name, 'node_modules'));
  }
  for (const [name, metadata] of metadataByName) {
    const file = path.join(
      cache,
      'v11/metadata/registry.npmjs.org',
      `${name}.jsonl`,
    );
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `{}\n${JSON.stringify(metadata)}`);
  }
}

async function validatePublished(directory: string): Promise<void> {
  const manifest = await json(path.join(directory, 'package.json'));
  const packedFiles = await files(directory);
  if (packedFiles.some((file) => file.startsWith('client/')))
    throw new Error('Published plugin contains client source files');
  for (const name of ['components', 'hooks', 'lib', 'extensions']) {
    const target = manifest.imports[`#${name}/*`];
    if (target !== `./dist/client/${name}/*.js`)
      throw new Error(
        `Published #${name}/* must target unconditional dist/client files; got ${JSON.stringify(target)}`,
      );
  }
  for (const relative of [
    'components/permission-editor',
    ...primitiveNames.map((name) => `components/ui/${name}`),
  ]) {
    for (const extension of ['js', 'd.ts']) {
      const name = `dist/client/${relative}.${extension}`;
      if (!packedFiles.includes(name))
        throw new Error(`Published plugin is missing ${name}`);
    }
  }
}

it('installs a real registry item, builds and packs a generated plugin, and loads it in isolated hosts', async () => {
  const cache = path.join(repository, 'node_modules/.cache');
  await mkdir(cache, { recursive: true });
  const root = await mkdtemp(path.join(cache, 'create-plugin-publish-'));
  const requested: string[] = [];
  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      requested.push(url.pathname);
      const name = path.basename(url.pathname, '.json');
      let item: unknown;
      if (name === 'permission-editor') {
        item = JSON.parse(
          await readFile(
            path.join(root, 'registry/permission-editor.json'),
            'utf8',
          ),
        ) as unknown;
      } else if (primitiveNames.includes(name)) {
        // Serve the maintained preview primitives byte-for-byte; never rewrite installed sources.
        item = {
          name,
          type: 'registry:ui',
          dependencies: ['@base-ui/react', 'cn', 'lucide-react'],
          files: [
            {
              path: `${name}.tsx`,
              type: 'registry:ui',
              content: await readFile(
                path.join(uiRoot, 'website/components/ui', `${name}.tsx`),
                'utf8',
              ),
            },
          ],
        };
      } else if (name === 'registries') {
        item = [];
      } else if (url.pathname === '/r/colors/neutral.json') {
        // Color transformation metadata is ancillary to this source/build acceptance test.
        item = {
          inlineColors: { light: {}, dark: {} },
          cssVars: { light: {}, dark: {} },
          inlineColorsTemplate: '',
          cssVarsTemplate: '',
        };
      } else {
        console.error(`Unexpected local registry request: ${url.pathname}`);
        response
          .writeHead(404)
          .end(`Unexpected registry request: ${url.pathname}`);
        return;
      }
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(item));
    })().catch((error: unknown) => {
      response.writeHead(500).end(String(error));
    });
  });
  try {
    // Copy workspace metadata so real pnpm can resolve catalog/workspace versions without touching the checkout lockfile.
    for (const name of ['pnpm-workspace.yaml', 'pnpm-lock.yaml'])
      await copyFile(path.join(repository, name), path.join(root, name));
    for (const category of await readdir(path.join(repository, 'packages'))) {
      const source = path.join(repository, 'packages', category);
      const categoryEntry = (
        await readdir(path.join(repository, 'packages'), {
          withFileTypes: true,
        })
      ).find((entry) => entry.name === category);
      if (!categoryEntry?.isDirectory()) continue;
      for (const entry of await readdir(source, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const destination = path.join(root, 'packages', category, entry.name);
        await mkdir(destination, { recursive: true });
        await copyFile(
          path.join(source, entry.name, 'package.json'),
          path.join(destination, 'package.json'),
        );
      }
    }
    await symlink(
      path.join(repository, 'scripts'),
      path.join(root, 'scripts'),
      'junction',
    );
    const plugin = await createPlugin({
      repoRoot: root,
      name: 'published-registry-acceptance',
      capabilities: ['client.components', 'registry'],
      install: false,
    });
    const directory = plugin.targetDirectory;
    const originalManifest = await json(path.join(directory, 'package.json'));
    const originalConfig = await readFile(
      path.join(directory, 'tsconfig.json'),
      'utf8',
    );
    const originalComponents = await readFile(
      path.join(directory, 'components.json'),
      'utf8',
    );
    await linkDependencies(directory);
    await run(
      process.execPath,
      [
        shadcn,
        'build',
        'registry.json',
        '--output',
        path.join(root, 'registry'),
      ],
      uiRoot,
    );
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Local registry did not open a TCP port');
    const registryUrl = `http://127.0.0.1:${address.port}/r`;
    const installation = JSON.parse(
      await readFile(
        path.join(repository, 'node_modules/.modules.yaml'),
        'utf8',
      ),
    ) as { storeDir: string };
    const metadataCache = path.join(root, 'pnpm-cache');
    await prepareOfflineMetadata(metadataCache);
    await run(
      process.execPath,
      [
        shadcn,
        'add',
        `${registryUrl}/permission-editor.json`,
        '--yes',
        '--cwd',
        directory,
      ],
      directory,
      {
        REGISTRY_URL: registryUrl,
        // shadcn's real pnpm add updates metadata; dependencies come from the existing workspace install.
        PNPM_CONFIG_LOCKFILE_ONLY: 'true',
        PNPM_CONFIG_OFFLINE: 'true',
        PNPM_CONFIG_IGNORE_SCRIPTS: 'true',
        PNPM_CONFIG_STORE_DIR: path.dirname(installation.storeDir),
        PNPM_CONFIG_CACHE_DIR: metadataCache,
      },
    ).catch((error: unknown) => {
      throw new Error(
        `shadcn requests: ${requested.join(', ')}\n${String(error)}`,
        { cause: error },
      );
    });
    const manifest = await json(path.join(directory, 'package.json'));
    expect(manifest.imports).toEqual(originalManifest.imports);
    expect(manifest.publishConfig.imports).toEqual(
      originalManifest.publishConfig.imports,
    );
    expect(await readFile(path.join(directory, 'tsconfig.json'), 'utf8')).toBe(
      originalConfig,
    );
    expect(
      await readFile(path.join(directory, 'components.json'), 'utf8'),
    ).toBe(originalComponents);
    for (const name of ['permission-editor', ...primitiveNames])
      expect(requested.some((url) => url.endsWith(`/${name}.json`))).toBe(true);
    const declaredPackages = new Set(
      Object.keys({
        ...manifest.dependencies,
        ...manifest.peerDependencies,
        ...manifest.devDependencies,
      }),
    );
    for (const file of await files(path.join(directory, 'client'))) {
      if (!/\.tsx?$/.test(file)) continue;
      const source = await readFile(
        path.join(directory, 'client', file),
        'utf8',
      );
      expect(source).not.toMatch(
        /['"]@\/|['"]@(?:components|hooks|lib|extensions)\//,
      );
      for (const match of source.matchAll(
        /(?:from\s*|import\s*\(\s*|import\s*)['"](@[^'"]+)['"]/g,
      )) {
        const packageName = match[1]!.split('/').slice(0, 2).join('/');
        expect(
          declaredPackages,
          `${file} imports an undeclared scoped package or alias: ${match[1]}`,
        ).toContain(packageName);
      }
    }
    expect(
      await readFile(
        path.join(directory, 'client/components/permission-editor.tsx'),
        'utf8',
      ),
    ).toContain('#components/ui/');
    await run('pnpm', ['typecheck'], directory);
    await run('pnpm', ['build'], directory);
    const compiledFiles = await files(path.join(directory, 'dist'));
    const archive = path.join(root, 'plugin.tgz');
    await run('pnpm', ['pack', '--out', archive], directory);
    const host = path.join(root, 'host');
    const packageDirectory = path.join(
      host,
      'node_modules',
      plugin.packageName,
    );
    await mkdir(packageDirectory, { recursive: true });
    await run(
      'tar',
      ['-xzf', archive, '--strip-components=1', '-C', packageDirectory],
      host,
    );
    await validatePublished(packageDirectory);
    const packedFiles = await files(packageDirectory);
    for (const file of compiledFiles)
      expect(packedFiles).toContain(`dist/${file}`);
    expect(
      (await json(path.join(packageDirectory, 'package.json'))).imports,
    ).toEqual(originalManifest.publishConfig.imports);
    await linkDependencies(host);
    await writeFile(
      path.join(host, 'package.json'),
      JSON.stringify({
        type: 'module',
        imports: { '#components/*': './host-components/*.js' },
      }),
    );
    await mkdir(path.join(host, 'host-components/ui'), { recursive: true });
    for (const name of primitiveNames)
      await writeFile(
        path.join(host, 'host-components/ui', `${name}.js`),
        'throw new Error("Host imports captured a plugin primitive");\n',
      );
    // Import the real packed component and render its primitives, rather than just comparing resolution strings.
    await writeFile(
      path.join(host, 'entry.js'),
      `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PermissionEditor } from './node_modules/${plugin.packageName}/dist/client/components/permission-editor.js';
const html = renderToStaticMarkup(createElement(PermissionEditor, { sections: [{ id: 'access', title: 'Packed permissions', groups: [{ id: 'records', rows: [{ id: 'read', label: 'Read records', enabled: true, levels: [{ value: 'related', label: 'Related' }, { value: 'all', label: 'All' }], level: 'related' }] }] }], onEnabledChange() {}, onLevelChange() {} }));
if (!html.includes('Read records')) throw new Error('Packed component did not render');
console.log('packed component rendered');
`,
    );
    const vite = path.join(
      path.dirname(uiRequire.resolve('vite/package.json')),
      'bin/vite.js',
    );
    await writeFile(
      path.join(host, 'index.html'),
      '<div id="root"></div><script type="module" src="/browser-entry.js"></script>\n',
    );
    await writeFile(
      path.join(host, 'browser-entry.js'),
      `import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PermissionEditor } from './node_modules/${plugin.packageName}/dist/client/components/permission-editor.js';
createRoot(document.getElementById('root')).render(createElement(PermissionEditor, { sections: [{ id: 'access', title: 'Packed permissions', groups: [{ id: 'records', rows: [{ id: 'read', label: 'Read records', enabled: true }] }] }], onEnabledChange() {}, onLevelChange() {} }));
`,
    );
    for (const condition of ['development', 'production']) {
      expect(
        await run(
          process.execPath,
          [`--conditions=${condition}`, 'entry.js'],
          host,
        ),
      ).toContain('packed component rendered');
      await writeFile(
        path.join(host, 'vite.config.js'),
        `export default { resolve: { conditions: [${JSON.stringify(condition)}] }, build: { outDir: 'browser-${condition}' } };\n`,
      );
      await run(process.execPath, [vite, 'build', '--mode', condition], host);
      expect(await files(path.join(host, `browser-${condition}`))).toContain(
        'index.html',
      );
      await writeFile(
        path.join(host, 'vite.config.js'),
        `export default { resolve: { conditions: [${JSON.stringify(condition)}] }, build: { ssr: 'entry.js', outDir: 'build-${condition}', rollupOptions: { external: ['react', 'react-dom/server'] } }, ssr: { noExternal: true } };\n`,
      );
      await run(process.execPath, [vite, 'build'], host);
      expect(
        await run(
          process.execPath,
          [`--conditions=${condition}`, `build-${condition}/entry.js`],
          host,
        ),
      ).toContain('packed component rendered');
    }
    expect(await run(process.execPath, ['entry.js'], host)).toContain(
      'packed component rendered',
    );
    await expect(
      run(
        process.execPath,
        ['--input-type=module', '-e', 'await import("#components/ui/switch")'],
        host,
      ),
    ).rejects.toThrow('Host imports captured a plugin primitive');
    console.info(
      `Generated plugin publish acceptance: shadcn installed permission-editor and ${primitiveNames.join(', ')}; pnpm pack retained ${compiledFiles.length} compiled files; packed imports=${JSON.stringify((await json(path.join(packageDirectory, 'package.json'))).imports)}; default/development/production component renders and development/production Vite SSR and browser bundles passed.`,
    );
    const packedManifest = await readFile(
      path.join(packageDirectory, 'package.json'),
      'utf8',
    );
    await writeFile(
      path.join(packageDirectory, 'package.json'),
      JSON.stringify({
        ...(await json(path.join(packageDirectory, 'package.json'))),
        imports: originalManifest.imports,
      }),
    );
    await expect(validatePublished(packageDirectory)).rejects.toThrow(
      'Published #components/* must target unconditional dist/client files',
    );
    await expect(
      run(process.execPath, ['--conditions=development', 'entry.js'], host),
    ).rejects.toThrow(/\/client\/components\/ui\//);
    await writeFile(
      path.join(packageDirectory, 'package.json'),
      packedManifest,
    );
    const declaration = path.join(
      packageDirectory,
      'dist/client/components/ui/switch.d.ts',
    );
    const declarationContent = await readFile(declaration, 'utf8');
    await rm(declaration);
    await expect(validatePublished(packageDirectory)).rejects.toThrow(
      'Published plugin is missing dist/client/components/ui/switch.d.ts',
    );
    await writeFile(declaration, declarationContent);
    await rm(
      path.join(packageDirectory, 'dist/client/components/ui/switch.js'),
    );
    await expect(validatePublished(packageDirectory)).rejects.toThrow(
      'Published plugin is missing dist/client/components/ui/switch.js',
    );
    await expect(
      run(process.execPath, ['--conditions=development', 'entry.js'], host),
    ).rejects.toThrow('switch.js');
    console.info(
      'Generated plugin publish acceptance rejects development source targets, missing declarations and missing JavaScript with explicit diagnostics.',
    );
  } finally {
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    await rm(root, { recursive: true, force: true });
  }
}, 180_000);
