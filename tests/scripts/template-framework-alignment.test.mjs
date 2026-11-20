import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import test from 'node:test';

import { collectRuntimeSpecifiers } from '../../scripts/check-runtime-deps.mjs';

const root = path.resolve(import.meta.dirname, '../../packages/templates');
const templates = ['default', 'examples'].map((kind) => {
  const directory = path.join(root, `app-template-${kind}`);
  return {
    kind,
    directory,
    manifest: JSON.parse(
      readFileSync(path.join(directory, 'package.json'), 'utf8'),
    ),
  };
});
const [baseline] = templates;
const runtimeExtensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs'];
const builtins = new Set(
  builtinModules.flatMap((name) => [name, name.replace(/^node:/u, '')]),
);

function filesIn(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      return entry.isDirectory()
        ? filesIn(path.join(directory, entry.name), relative)
        : [relative];
    })
    .sort();
}

function runtimeFilesIn(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      ['dev-commands', 'dist', 'node_modules', 'tests'].includes(entry.name)
    ) {
      return [];
    }
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return runtimeFilesIn(target);
    return runtimeExtensions.includes(path.extname(entry.name)) ? [target] : [];
  });
}

function resolveRuntimeRelative(from, specifier) {
  const unresolved = path.resolve(path.dirname(from), specifier);
  const base = unresolved.replace(/\.(?:c|m)?js$/u, '');
  const candidates = [
    unresolved,
    ...runtimeExtensions.map((extension) => `${base}${extension}`),
    ...runtimeExtensions.map((extension) =>
      path.join(base, `index${extension}`),
    ),
  ];
  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

function runtimePackageName(specifier) {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    specifier.startsWith('@/') ||
    specifier.startsWith('node:')
  ) {
    return undefined;
  }
  const segments = specifier.split('/');
  return specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];
}

function runtimeDependencies(template) {
  const pending = ['server', 'database', 'cli'].flatMap((directory) =>
    runtimeFilesIn(path.join(template.directory, directory)),
  );
  const visited = new Set();
  const imported = new Map();
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    for (const specifier of collectRuntimeSpecifiers(
      readFileSync(file, 'utf8'),
      file,
    )) {
      if (specifier.startsWith('.')) {
        const resolved = resolveRuntimeRelative(file, specifier);
        assert.ok(
          resolved,
          `${template.kind}: unresolved ${specifier} from ${file}`,
        );
        if (
          !resolved.includes(`${path.sep}cli${path.sep}dev-commands${path.sep}`)
        ) {
          pending.push(resolved);
        }
        continue;
      }
      const dependency = runtimePackageName(specifier);
      if (
        dependency &&
        dependency !== template.manifest.name &&
        !builtins.has(dependency)
      ) {
        imported.set(dependency, path.relative(template.directory, file));
      }
    }
  }
  return imported;
}

function sharedFrameworkSource(template, file) {
  let source = readFileSync(path.join(template.directory, file), 'utf8');

  // The image recipe is shared. Only the template's own directory, named in the usage comment, differs; it is
  // normalized to Default's before comparing.
  if (file === 'Dockerfile') {
    source = source.replaceAll(
      `packages/templates/app-template-${template.kind}`,
      'packages/templates/app-template-default',
    );
  }

  // Default omits the template name; Examples retains it in the footer, tooltip and accessible name.
  // Normalize only the exact name-related fragments so the rest of the shared layout stays compared.
  if (file === 'client/layouts/components/sidebar-footer.tsx') {
    if (template.kind === 'default') {
      assert.doesNotMatch(
        source,
        /templateName|app\.displayName|Default Template/u,
      );
    } else {
      const nameFragments = [
        [
          " * The application's sidebar footer: the NocoBase slogan's two lines, then the template's name and its version, each\n" +
            ' * on its own line. In icon mode only the shield remains, and a tooltip carries the same text.',
          " * The application's sidebar footer: the NocoBase slogan's two lines, then the application's version.\n" +
            ' * In icon mode only the shield remains, and a tooltip carries the same text.',
        ],
        [
          "  const templateName = publicConfig.get('app.displayName', 'Examples Template');\n",
          '',
        ],
        [
          '${brandPartnership} ${buildReliableSystems} ${templateName} ${versionLabel}',
          '${brandPartnership} ${buildReliableSystems} ${versionLabel}',
        ],
        [
          "            <span className='mt-1 opacity-70'>\n" +
            '              {templateName} {versionLabel}\n' +
            '            </span>',
          "            <span className='mt-1 opacity-70'>{versionLabel}</span>",
        ],
        [
          '          {/* Name and version stay on one line each; a long name is cut off, with the whole name as its title. */}\n' +
            '          <p\n' +
            "            className='mt-1 truncate text-muted-foreground'\n" +
            '            title={templateName}\n' +
            '          >\n' +
            '            {templateName}\n' +
            '          </p>\n' +
            "          <p className='truncate text-muted-foreground' title={versionLabel}>",
          '          <p\n' +
            "            className='mt-1 truncate text-muted-foreground'\n" +
            '            title={versionLabel}\n' +
            '          >',
        ],
      ];
      for (const [before, after] of nameFragments) {
        assert.equal(
          source.split(before).length - 1,
          1,
          `${template.kind}: ${file} must retain exactly one name fragment: ${before}`,
        );
        source = source.replace(before, after);
      }
    }
  }
  return source;
}

// These are shared framework mechanisms, not product pages or plugin composition.
// Compare both directions so adding a build helper in only one template also fails.
for (const template of templates) {
  test(`${template.kind} does not integrate development annotations`, () => {
    for (const file of ['vite.config.ts', 'Dockerfile.dockerignore']) {
      const source = readFileSync(path.join(template.directory, file), 'utf8');
      assert.doesNotMatch(source, /agent[-_]?annotations|annotationsEnabled/iu);
      assert.equal(
        sharedFrameworkSource(template, file),
        sharedFrameworkSource(baseline, file),
        `${template.kind}: ${file}`,
      );
    }
    for (const field of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      assert.equal(
        template.manifest[field]?.['@gchust/agent-annotations'],
        undefined,
      );
    }
    assert.equal(
      existsSync(
        path.join(template.directory, 'client/agent-annotations-host.ts'),
      ),
      false,
    );
  });

  test(`${template.kind} keeps the shared build and CLI framework aligned with Default`, () => {
    for (const directory of [
      'client/routing',
      'client/layouts',
      'client/theme',
    ]) {
      const expected = filesIn(path.join(baseline.directory, directory));
      assert.deepEqual(
        filesIn(path.join(template.directory, directory)),
        expected,
      );
      for (const file of expected) {
        const relative = path.join(directory, file);
        assert.equal(
          sharedFrameworkSource(template, relative),
          sharedFrameworkSource(baseline, relative),
          `${template.kind}: ${relative}`,
        );
      }
    }
    for (const file of [
      'tsconfig.json',
      'tsconfig.server.json',
      'eslint.config.js',
      'vitest.config.ts',
      'vite.config.ts',
      'ecosystem.config.js',
      'Dockerfile',
      'Dockerfile.dockerignore',
      'server/app.ts',
      'server/embedded.ts',
      'server/standalone.ts',
      // What every plugin's toasts pass through; a template that drifts here presents them differently.
      'client/lib/toaster.ts',
    ]) {
      assert.equal(
        sharedFrameworkSource(template, file),
        template.kind === 'examples'
          ? withExamplesChat(sharedFrameworkSource(baseline, file), file)
          : sharedFrameworkSource(baseline, file),
        `${template.kind}: ${file}`,
      );
    }
    // The scripts are the shared command contract; compare them in both directions.
    assert.deepEqual(
      template.manifest.scripts,
      {
        ...baseline.manifest.scripts,
        build:
          template.kind === 'default'
            ? 'node scripts/build.mjs'
            : 'nocobase build',
      },
      `${template.kind}: shared scripts`,
    );
  });

  test(`${template.kind} carries no Hub publishing`, () => {
    // NocoBase Hub is discontinued: neither @nocobase/hub-cli nor the publishing flag it replaced may come back.
    assert.equal(
      template.manifest.devDependencies?.['@nocobase/hub-cli'],
      undefined,
    );
    assert.equal(
      template.manifest.dependencies?.['@nocobase/hub-cli'],
      undefined,
    );
    assert.equal(template.manifest.nocobase?.cli?.publishing, undefined);
  });

  test(`${template.kind} publishes its Dockerfile to generated applications`, () => {
    // BuildKit reads `Dockerfile.dockerignore` only beside the Dockerfile it belongs to. Shipping one without the
    // other builds an image from a context that includes config.yml, .env, and storage/.
    for (const entry of ['Dockerfile', 'Dockerfile.dockerignore']) {
      assert.ok(
        template.manifest.files.includes(entry),
        `${template.kind}: files must list ${entry}`,
      );
    }
  });

  test(`${template.kind} publishes the shadcn MCP configuration for each editor`, () => {
    // Claude Code, Cursor and VS Code read these from the project; each runs the application's own shadcn CLI.
    for (const entry of ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json']) {
      assert.ok(
        template.manifest.files.includes(entry),
        `${template.kind}: files must list ${entry}`,
      );
      const config = readFileSync(path.join(template.directory, entry), 'utf8');
      assert.equal(
        config,
        readFileSync(path.join(baseline.directory, entry), 'utf8'),
      );
      const servers =
        JSON.parse(config)[
          entry === '.vscode/mcp.json' ? 'servers' : 'mcpServers'
        ];
      assert.deepEqual(servers.shadcn, {
        command: 'pnpm',
        args: ['exec', 'shadcn', 'mcp'],
      });
    }
  });

  test(`${template.kind} publishes the database directory by part, not whole`, () => {
    // `files` is a whitelist npm applies ahead of every ignore file, so a bare `database` entry publishes
    // whatever `collections generate` happens to have written locally: a snapshot of one developer's database,
    // in whatever dialect they run it against, shipped to every application scaffolded from the template.
    // Neither .gitignore nor .npmignore can take it back out. Name the parts that are source instead.
    const { files } = template.manifest;
    assert.equal(files.includes('database'), false);
    for (const entry of [
      'database/tsconfig.json',
      'database/*/migrations/**',
      'database/*/seeds/**',
    ]) {
      assert.ok(
        files.includes(entry),
        `${template.kind}: files must list ${entry}`,
      );
    }
  });

  test(`${template.kind} pins direct NocoBase dependencies at pack time`, () => {
    for (const section of ['dependencies', 'devDependencies']) {
      for (const [name, range] of Object.entries(template.manifest[section])) {
        if (name.startsWith('@nocobase/')) {
          assert.equal(range, 'workspace:*', `${section}.${name}`);
        }
      }
    }
  });

  test(`${template.kind} declares server runtime packages in dependencies only`, () => {
    const { dependencies, devDependencies } = template.manifest;
    const duplicates = Object.keys(dependencies).filter(
      (name) => name in devDependencies,
    );
    assert.deepEqual(duplicates, []);
    assert.ok(dependencies['@nocobase/db']);
    const drivers = Object.keys(dependencies).filter(
      (name) =>
        /^@nocobase\/db-/u.test(name) && name !== '@nocobase/db-testkit',
    );
    assert.deepEqual(
      drivers,
      template.kind === 'default' ? [] : ['@nocobase/db-sqlite'],
      `${template.kind}: production dialect drivers before configuration`,
    );
    if (template.kind === 'default') {
      for (const dialect of [
        'mssql',
        'mysql',
        'oracle',
        'postgres',
        'sqlite',
      ]) {
        assert.ok(devDependencies[`@nocobase/db-${dialect}`]);
      }
    }
    assert.equal(dependencies.hono, 'catalog:');
    assert.equal(devDependencies.hono, undefined);
    for (const [name, file] of runtimeDependencies(template)) {
      assert.ok(
        dependencies[name],
        `${template.kind}: ${name} is imported at runtime by ${file} but is not in dependencies`,
      );
    }
    for (const field of [
      'engines',
      'packageManager',
      'type',
      'prettier',
      'browserslist',
    ]) {
      assert.deepEqual(
        template.manifest[field],
        baseline.manifest[field],
        field,
      );
    }
    for (const [name, range] of Object.entries(devDependencies)) {
      const baselineRange = baseline.manifest.devDependencies[name];
      if (baselineRange) assert.equal(range, baselineRange, name);
    }
  });
}
