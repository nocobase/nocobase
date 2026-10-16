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
// PM-450 removes annotations only from Default; Examples keeps this development tool.
// Normalize only these exact fragments so all remaining build configuration stays compared.
const examplesAnnotationViteFragments = [
  "import agentAnnotations from '@gchust/agent-annotations/vite';\n",
  `const AGENT_ANNOTATIONS_DISABLED_VALUES = new Set(['false', '0', 'no', 'off']);

function isAgentAnnotationsEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return !normalized || !AGENT_ANNOTATIONS_DISABLED_VALUES.has(normalized);
}

`,
  `  const annotationsEnabled = isAgentAnnotationsEnabled(
    env.AGENT_ANNOTATIONS_ENABLED,
  );
`,
  `      ...(annotationsEnabled
        ? [
            agentAnnotations({
              root: __dirname,
              clientExtensions: [
                path.resolve(__dirname, 'client/agent-annotations-host.ts'),
              ],
            }),
          ]
        : []),
`,
  "          '**/.agent-annotations/**',\n",
];
const annotationDockerIgnore = '**/.agent-annotations\n';
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

// Examples installs Agents; Default deliberately does not. Apply only the documented chat
// composition slots to Default's expected source, keeping every shared line under comparison.
function withExamplesChat(source, file) {
  const replaceOnce = (before, after) => {
    assert.equal(source.split(before).length - 1, 1, `${file}: chat slot`);
    source = source.replace(before, after);
  };
  if (file === 'client/layouts/app-layout.tsx') {
    replaceOnce(
      'import { RouteTreeProvider }',
      "import { OnlineAgentProvider } from '#components/online-agent/provider';\n" +
        "import { OnlineAgentPanelHost } from '#components/online-agent/panel-host';\n" +
        'import { RouteTreeProvider }',
    );
    replaceOnce(
      'export function AppLayout({ routes }: AppLayoutProps): ReactElement {',
      `export function AppLayout({ routes }: AppLayoutProps): ReactElement {
  return (
    <OnlineAgentProvider>
      <AuthenticatedLayout routes={routes} />
    </OnlineAgentProvider>
  );
}

function AuthenticatedLayout({ routes }: AppLayoutProps): ReactElement {`,
    );
    // Retain the route outlet, watermark, scrolling and surrounding shell verbatim.
    const main = source.match(
      /^            <main[\s\S]*?^            <\/main>/mu,
    )?.[0];
    assert.ok(main, 'shared route outlet');
    replaceOnce(
      main,
      '            {/* Examples-only integration: the temporary chat docks beside any demo without replacing the route. */}\n' +
        "            <div className='relative flex min-h-0 flex-1'>\n" +
        main
          .replace(/^( +)(?=[<{])/gmu, '  $1')
          .replace(
            'relative isolate min-w-0',
            'relative isolate min-h-0 min-w-0',
          ) +
        '\n              <OnlineAgentPanelHost />\n            </div>',
    );
  }
  if (file === 'client/layouts/components/header-actions.tsx') {
    replaceOnce(
      "import { UserMenu } from './user-menu.js';",
      "import { UserMenu } from './user-menu.js';\n" +
        "import { ChatHeaderButton } from '#extensions/nocobase-agent-chat/launchers';",
    );
    replaceOnce(
      '        <ThemeSettings />',
      '        <ChatHeaderButton />\n        <ThemeSettings />',
    );
  }
  if (file === 'vitest.config.ts') {
    replaceOnce(
      '          /@nocobase\\/app-plugin-notification-in-app\\/(?:dist\\/)?client\\//u,',
      '          /@nocobase\\/app-plugin-notification-in-app\\/(?:dist\\/)?client\\//u,\n' +
        '          /@nocobase\\/app-plugin-agents\\/(?:dist\\/)?client\\//u,',
    );
  }
  return source;
}

function sharedFrameworkSource(template, file) {
  let source = readFileSync(path.join(template.directory, file), 'utf8');

  if (template.kind === 'examples') {
    const fragments =
      file === 'vite.config.ts'
        ? examplesAnnotationViteFragments
        : file === 'Dockerfile.dockerignore'
          ? [annotationDockerIgnore]
          : [];
    for (const fragment of fragments) {
      assert.equal(
        source.split(fragment).length - 1,
        1,
        `${template.kind}: ${file} must retain exactly one annotation fragment: ${fragment}`,
      );
      source = source.replace(fragment, '');
    }
  }

  // The image recipe is shared. Only the template's own directory, named in the usage comment, differs; it is
  // normalized to Default's before comparing.
  if (file === 'Dockerfile') {
    source = source.replaceAll(
      `packages/templates/app-template-${template.kind}`,
      'packages/templates/app-template-default',
    );
  }

  // Keep product identity local while comparing the shared layout.
  if (file === 'client/layouts/components/sidebar-footer.tsx') {
    source = source.replace("'Examples Template'", "'Default Template'");
  }
  return source;
}

// These are shared framework mechanisms, not product pages or plugin composition.
// Compare both directions so adding a build helper in only one template also fails.
for (const template of templates) {
  test(`${template.kind} keeps its intended development annotation integration`, () => {
    for (const file of ['vite.config.ts', 'Dockerfile.dockerignore']) {
      const source = readFileSync(path.join(template.directory, file), 'utf8');
      if (template.kind === 'default') {
        assert.doesNotMatch(
          source,
          /agent[-_]?annotations|annotationsEnabled/iu,
        );
      }
      // The exact Examples integration is asserted while normalizing; nothing else may differ.
      assert.equal(
        sharedFrameworkSource(template, file),
        sharedFrameworkSource(baseline, file),
        `${template.kind}: ${file}`,
      );
    }
    const annotationPackage = '@gchust/agent-annotations';
    if (template.kind === 'default') {
      for (const field of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ]) {
        assert.equal(template.manifest[field]?.[annotationPackage], undefined);
      }
    } else {
      assert.ok(template.manifest.devDependencies?.[annotationPackage]);
    }
    assert.equal(
      existsSync(
        path.join(template.directory, 'client/agent-annotations-host.ts'),
      ),
      template.kind === 'examples',
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
          template.kind === 'examples'
            ? withExamplesChat(
                sharedFrameworkSource(baseline, relative),
                relative,
              )
            : sharedFrameworkSource(baseline, relative),
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
      baseline.manifest.scripts,
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

  test(`${template.kind} declares server runtime packages in dependencies only`, () => {
    const { dependencies, devDependencies } = template.manifest;
    const duplicates = Object.keys(dependencies).filter(
      (name) => name in devDependencies,
    );
    assert.deepEqual(duplicates, []);
    assert.ok(dependencies['@nocobase/db']);
    // The dialect `server/config/database.ts` defaults to. Creation no longer chooses a database, so a template that
    // did not depend on its own default would scaffold an application unable to start until a driver was installed
    // by hand. Switching databases means adding another driver and, if nothing else uses SQLite, removing this one.
    assert.ok(
      dependencies['@nocobase/db-sqlite'],
      `${template.kind}: the driver for the default dialect must be a dependency`,
    );
    assert.equal(
      devDependencies['@nocobase/db-sqlite'],
      undefined,
      `${template.kind}: the SQLite driver is a runtime dependency, not a development one`,
    );
    // And no other. `config init` picks the dialect from the installed drivers when it is not told one, and with
    // several it refuses rather than guess — which is right for an application that added a driver, and wrong for
    // one that has just been created. A template shipping extra drivers makes the documented `pnpm nocobase config init`
    // fail in every non-interactive run, and puts drivers nothing uses into every deployment.
    const drivers = Object.keys(dependencies).filter(
      (name) =>
        /^@nocobase\/db-/u.test(name) && name !== '@nocobase/db-testkit',
    );
    assert.deepEqual(
      drivers,
      ['@nocobase/db-sqlite'],
      `${template.kind}: declare only the driver for the default dialect`,
    );
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
