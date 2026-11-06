import { constants } from 'node:fs';
import { access, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { resolvePluginProject, type ProjectEdit } from './project.ts';
import { applyProjectEdits } from './project-edits.ts';

import type { WorkspaceSynchronizer } from './install.ts';
import {
  normalizePluginCapabilities,
  type PluginCapability,
  type PluginCapabilities,
} from './capabilities.ts';
import { synchronizeWorkspace } from './install.ts';
import { createPluginNames, toTitleCase } from './names.ts';
import {
  DEFAULT_TEMPLATE_DIRECTORY,
  listTemplateFiles,
  renderTemplate,
  renderManifest,
  type PluginTemplateContext,
} from './template.ts';

export interface CreatePluginOptions {
  readonly capabilities?: readonly PluginCapability[];
  readonly description?: string;
  readonly displayName?: string;
  readonly dryRun?: boolean;
  readonly install?: boolean;
  readonly name: string;
  readonly now?: Date;
  readonly repoRoot?: string;
  readonly directory?: string;
  readonly synchronize?: WorkspaceSynchronizer;
  readonly templateDirectory?: string;
  readonly empty?: boolean;
}

export interface CreatePluginResult {
  readonly project: { kind: 'application' | 'repository'; root: string };
  readonly projectEdits: readonly ProjectEdit[];
  readonly dependencies: Record<string, Record<string, string>>;
  readonly capabilities: PluginCapabilities;
  readonly directoryName: string;
  readonly files: readonly string[];
  readonly packageName: string;
  readonly shortName: string;
  readonly targetDirectory: string;
}

function validateTextOption(value: string, option: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${option} cannot be empty.`);
  }
  if (/\r|\n/u.test(normalized)) {
    throw new Error(`${option} must be a single line.`);
  }
  return normalized;
}

export function formatDatePrefix(value: Date): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('The scaffold date must be a valid Date.');
  }

  return [value.getFullYear(), value.getMonth() + 1, value.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('');
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function createPlugin(
  options: CreatePluginOptions,
): Promise<CreatePluginResult> {
  const requestedCapabilities = options.capabilities ?? [];
  if (!options.empty && requestedCapabilities.length === 0) {
    throw new Error(
      'No plugin capabilities were selected. Add --with <capability> or use --empty.',
    );
  }
  if (options.empty && requestedCapabilities.length > 0) {
    throw new Error('--empty cannot be combined with --with.');
  }
  const capabilities = normalizePluginCapabilities(requestedCapabilities);
  const names = createPluginNames(options.name);
  const project = await resolvePluginProject({
    directory: options.directory,
    repoRoot: options.repoRoot,
    packageName: names.packageName,
    directoryName: names.directoryName,
  });
  const packagesDirectory = project.packagesDirectory;
  const targetDirectory = path.join(packagesDirectory, names.directoryName);
  const displayName = validateTextOption(
    options.displayName ?? `${toTitleCase(names.shortName)} App Plugin`,
    '--display-name',
  );
  const description = validateTextOption(
    options.description ?? `${displayName}.`,
    '--description',
  );
  const datePrefix = formatDatePrefix(options.now ?? new Date());
  const snakeName = names.shortName.replaceAll('-', '_');
  const context: PluginTemplateContext = {
    ...names,
    resolveDependency: project.resolveDependency,
    privatePackage: project.kind === 'application',
    datePrefix,
    description,
    displayName,
    migrationName: `${datePrefix}0001_${snakeName}_create_records`,
    seedName: `${datePrefix}0002_${snakeName}_create_welcome_record`,
  };
  const templateDirectory =
    options.templateDirectory ?? DEFAULT_TEMPLATE_DIRECTORY;

  await access(project.root, constants.W_OK);
  if (await pathExists(targetDirectory)) {
    throw new Error(`Target already exists: ${targetDirectory}`);
  }

  const files = await listTemplateFiles(
    templateDirectory,
    context,
    capabilities,
  );
  const manifest = JSON.parse(
    await renderManifest(context, capabilities),
  ) as Record<string, Record<string, string>>;
  const result: CreatePluginResult = {
    project: { kind: project.kind, root: project.root },
    projectEdits: project.edits,
    dependencies: Object.fromEntries(
      ['dependencies', 'peerDependencies', 'devDependencies']
        .filter((field) => manifest[field])
        .map((field) => [field, manifest[field]]),
    ),
    capabilities,
    directoryName: names.directoryName,
    files,
    packageName: names.packageName,
    shortName: names.shortName,
    targetDirectory,
  };
  if (options.dryRun) {
    return result;
  }

  let targetCreated = false;
  try {
    await mkdir(packagesDirectory, { recursive: true });
    await mkdir(targetDirectory);
    targetCreated = true;
    await renderTemplate({
      capabilities,
      context,
      targetDirectory,
      templateDirectory,
    });
    await applyProjectEdits(project.edits);
  } catch (error) {
    if (targetCreated) {
      await rm(targetDirectory, { force: true, recursive: true });
    }
    throw error;
  }

  if (options.install ?? true) {
    (options.synchronize ?? synchronizeWorkspace)(
      project.root,
      targetDirectory,
    );
  }

  return result;
}
