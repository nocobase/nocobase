import { format } from 'prettier';
import prettierConfig from '@nocobase/dev-config/prettier';
import { existsSync } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
// Pinned upstream adapter: reuse create-plugin's workspace/dependency resolution and runtime-aware foundation.
import { resolvePluginProject } from '@nocobase/create-plugin/dist/lib/project.js';
import { applyProjectEdits } from '@nocobase/create-plugin/dist/lib/project-edits.js';
import { createPluginNames } from '@nocobase/create-plugin/dist/lib/names.js';
import { normalizePluginCapabilities } from '@nocobase/create-plugin/dist/lib/capabilities.js';
import {
  listTemplateFiles,
  DEFAULT_TEMPLATE_DIRECTORY,
  renderManifest,
  renderTemplate,
} from '@nocobase/create-plugin/dist/lib/template.js';
import { moduleFiles } from './templates.mjs';

const center = '@nocobase/app-plugin-modules';
const capabilities = normalizePluginCapabilities([
  'client.routes',
  'client.locales',
  'server.service-providers',
  'database',
]);

export function moduleName(input) {
  if (typeof input !== 'string') throw new Error('A module name is required.');
  const scoped = /^(@[a-z0-9][a-z0-9._-]*)\/app-module-(.+)$/.exec(input);
  const scope = scoped?.[1] ?? '@nocobase';
  const id = scoped?.[2] ?? input.replace(/^app-module-/, '');
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 40)
    throw new Error(
      'Use a lowercase module name of up to 40 characters, e.g. samples or quality-checks.',
    );
  return {
    id,
    packageName: `${scope}/app-module-${id}`,
    directoryName: `app-module-${id}`,
  };
}

function command(root, executable, args) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${executable} ${args.join(' ')} failed.\n${result.stderr}\n${result.stdout}`,
    );
  return result.stdout;
}

export async function planModule(options) {
  const names = moduleName(options.name);
  const template = options.template ?? 'minimal';
  if (!['minimal', 'records'].includes(template))
    throw new Error('Template must be minimal or records.');
  const project = await resolvePluginProject({
    directory: options.directory,
    packageName: names.packageName,
    directoryName: names.directoryName,
  });
  if (project.kind !== 'application')
    throw new Error('Select an installed App with --dir.');
  const target = path.join(project.packagesDirectory, names.directoryName);
  if (existsSync(target)) throw new Error(`Target already exists: ${target}`);
  if (
    existsSync(project.packagesDirectory) &&
    !((await realpath(project.packagesDirectory)) + path.sep).startsWith(
      (await realpath(project.root)) + path.sep,
    )
  )
    throw new Error('The packages directory must be inside the App.');
  const manifest = JSON.parse(
    await readFile(path.join(project.root, 'package.json'), 'utf8'),
  );
  if (!manifest.dependencies?.[center])
    throw new Error(`Install and register ${center} in this App first.`);
  const cliRoot = path.join(project.root, 'node_modules/@nocobase/app-cli');
  const cli = await import(
    pathToFileURL(path.join(cliRoot, 'dist/lib/plugin-registration.js')).href
  );
  try {
    cli.pluginPackageName(names.packageName);
    const editor = await import(
      pathToFileURL(path.join(cliRoot, 'dist/lib/client-plugins.js')).href
    );
    editor.localNameFor(names.packageName);
  } catch {
    throw new Error(
      'This App CLI does not support app-module-* yet. Upgrade the App CLI to a module-compatible release before creating a module.',
    );
  }
  const serverSource = await readFile(
    path.join(project.root, 'server/plugins.ts'),
    'utf8',
  );
  if (!serverSource.includes(center + '/'))
    throw new Error('Register the open-source modules Server plugin first.');
  // An existing business module may use a differently named package but the same stable module id.
  for (const entry of await readdir(project.packagesDirectory, {
    withFileTypes: true,
  }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  })) {
    if (!entry.isDirectory()) continue;
    const descriptor = path.join(
      project.packagesDirectory,
      entry.name,
      'module.ts',
    );
    if (existsSync(descriptor)) {
      const text = await readFile(descriptor, 'utf8');
      if (new RegExp(`\\bid\\s*:\\s*['"]${names.id}['"]`).test(text))
        throw new Error(`Module id already exists: ${names.id}`);
    }
  }
  const title =
    options.title ??
    names.id
      .split('-')
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ');
  for (const value of [title, options.titleZh].filter((v) => v !== undefined))
    if (!value.trim() || /[\r\n]/.test(value))
      throw new Error('Module titles must be nonempty single-line text.');
  const context = {
    ...createPluginNames(names.id),
    ...names,
    resolveDependency: project.resolveDependency,
    privatePackage: true,
    displayName: title,
    description: `${title} business module.`,
    datePrefix: 'module',
    migrationName: `${names.id}_unused`,
    seedName: `${names.id}_unused`,
  };
  const packageJson = JSON.parse(await renderManifest(context, capabilities));
  packageJson.peerDependencies[center] = await project.resolveDependency(
    center,
    'workspace:*',
  );
  for (const name of ['@nocobase/app-client', '@nocobase/i18n'])
    packageJson.peerDependencies[name] = await project.resolveDependency(
      name,
      'workspace:^',
    );
  for (const name of ['react-router', 'lucide-react'])
    packageJson.peerDependencies[name] = await project.resolveDependency(
      name,
      'catalog:',
    );
  if (template === 'records') {
    packageJson.dependencies ??= {};
    for (const name of [
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-authorization',
    ])
      packageJson.peerDependencies[name] = await project.resolveDependency(
        name,
        'workspace:^',
      );
    for (const name of [
      '@tanstack/react-query',
      '@base-ui/react',
      'class-variance-authority',
      'cn',
    ])
      packageJson.peerDependencies[name] = await project.resolveDependency(
        name,
        'catalog:',
      );
    for (const name of ['hono', 'zod'])
      packageJson.dependencies[name] = await project.resolveDependency(
        name,
        'catalog:',
      );
  }
  packageJson.exports['./module'] = {
    types: './module.ts',
    import: './module.ts',
  };
  packageJson.publishConfig.exports['./module'] = {
    types: './dist/module.d.ts',
    import: './dist/module.js',
  };
  const files = moduleFiles({
    ...names,
    title,
    titleZh: options.titleZh,
    template,
  });
  const foundation = await listTemplateFiles(
    DEFAULT_TEMPLATE_DIRECTORY,
    context,
    capabilities,
  );
  const removed = foundation.filter(
    (file) =>
      file.startsWith('tests/') ||
      file.startsWith('database/') ||
      file.startsWith('server/services/') ||
      file === 'server/tokens.ts' ||
      file === `server/providers/${names.id}.ts` ||
      file.endsWith('.example'),
  );
  const nextCommands = [
    ['pnpm', 'install'],
    [
      'pnpm',
      'nocobase',
      'plugin',
      'register',
      names.packageName,
      '--no-install',
      '--json',
    ],
    ['pnpm', '--filter', names.packageName, 'check'],
  ];
  const result = {
    packageName: names.packageName,
    moduleId: names.id,
    template,
    targetDirectory: target,
    files: [
      ...new Set([
        ...foundation.filter((file) => !removed.includes(file)),
        ...Object.keys(files),
      ]),
    ].sort(),
    projectEdits: project.edits,
    dependencies: packageJson.peerDependencies,
    registration: {
      client: `${names.packageName}/client`,
      server: `${names.packageName}/server`,
    },
    nextCommands,
  };
  return {
    project,
    target,
    context,
    files,
    removed,
    packageJson,
    result,
    cliRoot,
  };
}

export async function createModule(options) {
  const plan = await planModule(options);
  if (options.dryRun) return { ...plan.result, written: false };
  const { project, target, files } = plan;
  // Re-check source snapshots before any writes; never replace an existing destination.
  for (const edit of project.edits) {
    const current = existsSync(edit.path)
      ? await readFile(edit.path, 'utf8')
      : undefined;
    if (current !== edit.before)
      throw new Error(`File changed during planning: ${edit.path}`);
  }
  await mkdir(project.packagesDirectory, { recursive: true });
  await mkdir(target);
  try {
    await renderTemplate({
      context: plan.context,
      capabilities,
      targetDirectory: target,
    });
    for (const file of plan.removed) await rm(path.join(target, file));
    for (const [file, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(target, file)), { recursive: true });
      await writeFile(
        path.join(target, file),
        file.endsWith('.gitkeep')
          ? content
          : await format(content, { ...prettierConfig, filepath: file }),
      );
    }
    await writeFile(
      path.join(target, 'package.json'),
      JSON.stringify(plan.packageJson, null, 2) + '\n',
    );
    const tsconfigFile = path.join(target, 'tsconfig.json');
    const tsconfig = JSON.parse(await readFile(tsconfigFile, 'utf8'));
    tsconfig.include.push('module.ts');
    await writeFile(
      tsconfigFile,
      await format(JSON.stringify(tsconfig), {
        ...prettierConfig,
        parser: 'json',
      }),
    );
    await applyProjectEdits(project.edits);
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }
  if (options.install === false)
    return { ...plan.result, written: true, registered: false };
  // Keep generated sources if installation fails. The error provides recovery, not an unsafe rerun.
  try {
    command(project.root, 'pnpm', ['install']);
    command(project.root, process.execPath, [
      path.join(plan.cliRoot, 'bin/run.js'),
      'plugin',
      'register',
      plan.result.packageName,
      '--no-install',
      '--json',
    ]);
    command(project.root, 'pnpm', [
      '--filter',
      plan.result.packageName,
      'format',
    ]);
  } catch (error) {
    throw new Error(
      `Module sources were created at ${target}. Fix the error, then run the install/register commands; do not recreate the module.\n${error.message}`,
    );
  }
  return { ...plan.result, written: true, registered: true };
}
