import { glob, readFile, realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { satisfies, valid } from 'semver';
import { parseDocument } from 'yaml';

export interface PackageManifest {
  name?: string;
  version?: string;
  packageManager?: string;
  nocobase?: { templateKind?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface ProjectEdit {
  readonly path: string;
  readonly before?: string;
  readonly after: string;
}

export interface PluginProject {
  readonly kind: 'application' | 'repository';
  readonly root: string;
  readonly packagesDirectory: string;
  readonly edits: readonly ProjectEdit[];
  readonly resolveDependency?: (name: string, range: string) => Promise<string>;
}

export class ProjectError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function readOptional(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function manifestAt(
  directory: string,
): Promise<PackageManifest | undefined> {
  const text = await readOptional(path.join(directory, 'package.json'));
  return text === undefined ? undefined : (JSON.parse(text) as PackageManifest);
}

async function findProject(
  start: string,
): Promise<{ root: string; kind: PluginProject['kind'] }> {
  let root = path.resolve(start);
  while (true) {
    const manifest = await manifestAt(root);
    if (manifest?.nocobase?.templateKind === 'app')
      return { root, kind: 'application' };
    if (
      manifest?.name === 'nocobase-v3' &&
      (await manifestAt(path.join(root, 'packages/tools/create-plugin')))
        ?.name === '@nocobase/create-plugin'
    )
      return { root, kind: 'repository' };
    const parent = path.dirname(root);
    if (parent === root) break;
    root = parent;
  }
  throw new ProjectError(
    'APP_NOT_FOUND',
    'Run create-plugin inside an application created with @nocobase/app, or use --dir to select it.',
  );
}

function matchesDirectory(directory: string, pattern: string): boolean {
  return path.matchesGlob(
    directory.replace(/\/+$/u, ''),
    pattern.replace(/^\.\//u, '').replace(/\/+$/u, ''),
  );
}

function includesDirectory(
  directory: string,
  patterns: readonly string[],
): boolean {
  return (
    patterns.some(
      (pattern) =>
        !pattern.startsWith('!') && matchesDirectory(directory, pattern),
    ) &&
    !patterns.some(
      (pattern) =>
        pattern.startsWith('!') &&
        matchesDirectory(directory, pattern.slice(1)),
    )
  );
}

async function installedManifest(
  root: string,
  name: string,
): Promise<PackageManifest | undefined> {
  try {
    root = await realpath(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  const direct = await manifestAt(path.join(root, 'node_modules', name));
  if (direct?.name === name) return direct;
  const require = createRequire(path.join(root, 'package.json'));
  let entry: string;
  try {
    entry = require.resolve(`${name}/package.json`);
  } catch {
    try {
      entry = require.resolve(name);
    } catch {
      return undefined;
    }
  }
  let directory = path.dirname(await realpath(entry));
  while (true) {
    const manifest = await manifestAt(directory);
    if (manifest?.name === name) return manifest;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

async function applicationProject(
  root: string,
  packageName: string,
  directoryName: string,
): Promise<PluginProject> {
  const manifestPath = path.join(root, 'package.json');
  const before = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(before) as PackageManifest;
  if (manifest.packageManager && !manifest.packageManager.startsWith('pnpm@')) {
    throw new ProjectError(
      'UNSUPPORTED_PACKAGE_MANAGER',
      'Application plugin workspaces require pnpm.',
    );
  }
  if (
    manifest.dependencies?.[packageName] ||
    manifest.devDependencies?.[packageName] ||
    manifest.optionalDependencies?.[packageName]
  ) {
    throw new ProjectError(
      'PACKAGE_ALREADY_DECLARED',
      `${packageName} is already declared by the application. Choose another name or inspect that dependency.`,
    );
  }
  const workspacePath = path.join(root, 'pnpm-workspace.yaml');
  const workspaceBefore = await readOptional(workspacePath);
  const document = parseDocument(workspaceBefore ?? '');
  if (document.errors.length)
    throw new ProjectError(
      'INVALID_WORKSPACE',
      document.errors.map((error) => error.message).join('\n'),
    );
  const settings = document.toJS() as { packages?: unknown } | null;
  const configured = settings?.packages;
  if (
    configured !== undefined &&
    (!Array.isArray(configured) ||
      configured.some((value) => typeof value !== 'string'))
  ) {
    throw new ProjectError(
      'INVALID_WORKSPACE',
      'pnpm-workspace.yaml packages must be a list of patterns.',
    );
  }
  const patterns: string[] = [...((configured as string[] | undefined) ?? [])];
  const directory = `packages/${directoryName}`;
  if (
    patterns.some(
      (pattern) =>
        pattern.startsWith('!') &&
        matchesDirectory(directory, pattern.slice(1)),
    )
  ) {
    throw new ProjectError(
      'WORKSPACE_EXCLUDES_PLUGIN',
      `${directory} is excluded by pnpm-workspace.yaml. Adjust the exclusion before creating this plugin.`,
    );
  }
  if (!includesDirectory(directory, patterns)) {
    patterns.push('packages/*');
    document.set('packages', patterns);
  }
  const workspaceAfter = document.toString();
  const localPackages = new Map<string, PackageManifest>();
  for await (const directory of glob(
    patterns.filter((pattern) => !pattern.startsWith('!')),
    {
      cwd: root,
      exclude: ['**/node_modules/**', '**/.git/**'],
    },
  )) {
    if (!includesDirectory(directory.split(path.sep).join('/'), patterns))
      continue;
    if (!(await stat(path.join(root, directory))).isDirectory()) continue;
    const candidate = await manifestAt(path.join(root, directory));
    if (!candidate?.name) continue;
    if (localPackages.has(candidate.name))
      throw new ProjectError(
        'DUPLICATE_WORKSPACE_PACKAGE',
        `Multiple workspace packages are named ${candidate.name}.`,
      );
    localPackages.set(candidate.name, candidate);
  }
  if (manifest.name === packageName || localPackages.has(packageName)) {
    throw new ProjectError(
      'DUPLICATE_WORKSPACE_PACKAGE',
      `The workspace already contains ${packageName}.`,
    );
  }
  manifest.dependencies = {
    ...manifest.dependencies,
    [packageName]: 'workspace:*',
  };
  const edits: ProjectEdit[] = [
    {
      path: manifestPath,
      before,
      after: `${JSON.stringify(manifest, null, 2)}\n`,
    },
  ];
  if (
    workspaceBefore === undefined ||
    patterns.length !== (configured as string[] | undefined)?.length
  ) {
    edits.push({
      path: workspacePath,
      before: workspaceBefore,
      after: workspaceAfter,
    });
  }
  return {
    kind: 'application',
    root,
    packagesDirectory: path.join(root, 'packages'),
    edits,
    async resolveDependency(name, range) {
      const local = localPackages.get(name);
      if (local) {
        if (!valid(local.version))
          throw new ProjectError(
            'INVALID_DEPENDENCY_VERSION',
            `${name} needs a valid workspace package version.`,
          );
        if (
          !range.startsWith('workspace:') &&
          !range.startsWith('catalog:') &&
          !satisfies(local.version!, range, { includePrerelease: true })
        ) {
          throw new ProjectError(
            'INCOMPATIBLE_DEPENDENCY',
            `${name}@${local.version} does not satisfy ${range}.`,
          );
        }
        return range === 'workspace:^' ? 'workspace:^' : 'workspace:*';
      }
      let installed = await installedManifest(root, name);
      // Runtime peers may be supplied through the application's installed runtime packages.
      if (!installed) {
        for (const runtime of [
          '@nocobase/app-cli',
          '@nocobase/app-server',
          '@nocobase/app-client',
        ]) {
          const candidate = await installedManifest(
            path.join(root, 'node_modules', runtime),
            name,
          );
          if (candidate) {
            if (installed && installed.version !== candidate.version)
              throw new ProjectError(
                'AMBIGUOUS_DEPENDENCY',
                `The application runtimes resolve different versions of ${name}. Add a compatible direct dependency to the application.`,
              );
            installed = candidate;
          }
        }
      }
      if (!installed || !valid(installed.version)) {
        throw new ProjectError(
          'DEPENDENCY_NOT_INSTALLED',
          `Cannot resolve ${name} from the application. Install a compatible version in the application before creating this plugin.`,
        );
      }
      if (range.startsWith('workspace:') || range.startsWith('catalog:'))
        return installed.version!;
      if (!satisfies(installed.version!, range, { includePrerelease: true })) {
        throw new ProjectError(
          'INCOMPATIBLE_DEPENDENCY',
          `${name}@${installed.version} does not satisfy the scaffold requirement ${range}.`,
        );
      }
      return installed.version!;
    },
  };
}

export async function resolvePluginProject(options: {
  readonly directory?: string;
  readonly repoRoot?: string;
  readonly packageName: string;
  readonly directoryName: string;
}): Promise<PluginProject> {
  // Preserve the programmatic source-workspace API; the CLI discovers the actual project.
  const project =
    options.repoRoot === undefined
      ? await findProject(options.directory ?? process.cwd())
      : { root: path.resolve(options.repoRoot), kind: 'repository' as const };
  if (project.kind === 'application')
    return applicationProject(
      project.root,
      options.packageName,
      options.directoryName,
    );
  return {
    ...project,
    packagesDirectory: path.join(project.root, 'packages/plugins'),
    edits: [],
  };
}
