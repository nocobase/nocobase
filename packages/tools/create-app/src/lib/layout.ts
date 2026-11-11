import { readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isMap, parseDocument } from 'yaml';

export interface TemplateApplication {
  /** POSIX path relative to the project root; `.` identifies a root application. */
  directory: string;
  /** An empty suffix keeps the project name for the root App. */
  suffix: string;
}

export interface TemplateLayout {
  workspace: boolean;
  applications: TemplateApplication[];
}

/**
 * An App may include child Apps; an orchestration workspace contains only nested Apps. Explicit roots, not package
 * globs or template aliases, decide which directories own runtime identity, configuration and Skills.
 */
export async function readTemplateLayout(
  directory: string,
): Promise<TemplateLayout> {
  const manifest = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8'),
  ) as {
    name?: unknown;
    nocobase?: { templateKind?: string; appDirectories?: unknown };
  };
  const metadata = manifest.nocobase;
  if (
    metadata?.appDirectories === undefined &&
    metadata?.templateKind !== 'workspace'
  ) {
    return { workspace: false, applications: [{ directory: '.', suffix: '' }] };
  }
  if (
    metadata?.templateKind !== 'workspace' &&
    metadata?.templateKind !== 'app'
  ) {
    throw new Error(
      'nocobase.appDirectories requires templateKind "app" or "workspace".',
    );
  }
  const directories = metadata.appDirectories;
  if (!Array.isArray(directories) || directories.length === 0) {
    throw new Error(
      'A multi-App template must declare a nonempty nocobase.appDirectories array.',
    );
  }
  const rootApp = metadata.templateKind === 'app';
  if (rootApp && directories[0] !== '.') {
    throw new Error(
      'An App with child Apps must list "." first in nocobase.appDirectories.',
    );
  }
  const applications: TemplateApplication[] = [];
  const root = await realpath(directory);
  for (const relative of directories as unknown[]) {
    const isRoot = relative === '.' && rootApp;
    if (
      typeof relative !== 'string' ||
      (!isRoot &&
        (!/^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/u.test(relative) ||
          relative
            .split('/')
            .some((segment) => segment === '.' || segment === '..')))
    ) {
      throw new Error(
        'Application directories must be safe relative POSIX paths; only a root App may declare ".".',
      );
    }
    const suffix = isRoot ? '' : path.posix.basename(relative);
    if (
      applications.some(
        (app) =>
          app.suffix === suffix ||
          (app.directory !== '.' &&
            !isRoot &&
            (app.directory.startsWith(`${relative}/`) ||
              relative.startsWith(`${app.directory}/`))),
      )
    ) {
      throw new Error(
        `Application directories overlap or have duplicate package suffixes: ${relative}.`,
      );
    }
    const applicationDirectory = path.join(directory, relative);
    if (
      path
        .relative(root, await realpath(applicationDirectory))
        .split(path.sep)
        .join('/') !== (isRoot ? '' : relative)
    ) {
      throw new Error(
        `Application directories must not contain symbolic links: ${relative}.`,
      );
    }
    const application = isRoot
      ? manifest
      : (JSON.parse(
          await readFile(
            path.join(applicationDirectory, 'package.json'),
            'utf8',
          ),
        ) as { name?: unknown; nocobase?: { templateKind?: string } });
    if (
      typeof application.name !== 'string' ||
      application.nocobase?.templateKind !== 'app'
    ) {
      throw new Error(
        `Workspace application ${relative} must have a name and nocobase.templateKind "app".`,
      );
    }
    applications.push({ directory: relative, suffix });
  }
  return { workspace: true, applications };
}

/** Adds nested App roots without replacing existing workspace policy. */
export async function ensureWorkspaceApplications(
  directory: string,
  layout: TemplateLayout,
): Promise<void> {
  if (!layout.workspace) return;
  const filename = path.join(directory, 'pnpm-workspace.yaml');
  const templateFilename = path.join(directory, 'pnpm-workspace.template.yaml');
  let contents = '';
  let restoreTemplate = false;
  try {
    contents = await readFile(filename, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    try {
      contents = await readFile(templateFilename, 'utf8');
      restoreTemplate = true;
    } catch (templateError) {
      if ((templateError as NodeJS.ErrnoException).code !== 'ENOENT')
        throw templateError;
    }
  }
  const document = parseDocument(contents);
  if (document.errors.length)
    throw new Error('The template pnpm-workspace.yaml is invalid.');
  if (document.contents !== null && !isMap(document.contents))
    throw new Error('The template pnpm-workspace.yaml must be a mapping.');
  const packages: unknown = (document.toJS() as { packages?: unknown } | null)
    ?.packages;
  if (
    packages !== undefined &&
    (!Array.isArray(packages) ||
      packages.some(
        (entry: unknown) => typeof entry !== 'string' || entry.startsWith('!'),
      ))
  ) {
    throw new Error(
      'Workspace templates require a packages array without exclusion globs so every declared App is installed.',
    );
  }
  const entries = (packages ?? []) as string[];
  document.set('packages', [
    ...new Set([
      ...entries,
      ...layout.applications
        .filter((app) => app.directory !== '.')
        .map((app) => app.directory),
    ]),
  ]);
  await writeFile(filename, document.toString(), 'utf8');
  if (restoreTemplate) await rm(templateFilename);
}
