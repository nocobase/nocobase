/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { extname, join } from 'path';
import type { Application } from '@nocobase/server';
import { getPackageDir, PluginManager } from '@nocobase/server';
import {
  buildFlowSurfaceAutoSnapshot,
  deriveFlowSurfaceAutoCapabilityCandidates,
  getFlowSurfaceAutoSnapshotStorageDir,
  writeFlowSurfaceAutoSnapshot,
} from './snapshot';
import { collectFlowSurfaceExtractorAstEvents } from './ast';
import { resolveFlowSurfacePluginEntry } from './entry-resolver';
import type { FlowSurfaceAutoSnapshot, FlowSurfaceExtractorCliResult, FlowSurfaceExtractionEvent } from './types';

export type FlowSurfaceExtractorCliTarget = {
  plugin: string;
  packageRoot?: string;
};

export type FlowSurfaceExtractorCliOptions = {
  dryRun?: boolean;
  failOnWarning?: boolean;
  outDir?: string;
  preferMode?: 'source' | 'dist';
  generatedAt?: string;
  extractorVersion?: string;
  extractPlugin?: FlowSurfaceExtractorCliExtractPlugin;
};

export type FlowSurfaceExtractorCliSummary = {
  ok: boolean;
  dryRun: boolean;
  results: FlowSurfaceExtractorCliResult[];
  exitCode: 0 | 1;
};

export type FlowSurfaceExtractorCliExtractPlugin = (
  target: FlowSurfaceExtractorCliTarget,
  options: Pick<FlowSurfaceExtractorCliOptions, 'preferMode' | 'generatedAt' | 'extractorVersion'>,
) => Promise<FlowSurfaceExtractorPluginExtraction>;

export type FlowSurfaceExtractorPluginExtraction = {
  snapshot: FlowSurfaceAutoSnapshot;
  eventCount: number;
  candidateCount: number;
  warningCount: number;
};

type FlowSurfaceExtractorCliCommandOptions = {
  plugin?: string;
  allEnabled?: boolean;
  dryRun?: boolean;
  failOnWarning?: boolean;
  json?: boolean;
  out?: string;
  preferMode?: string;
};

type FlowSurfaceCliError = {
  code: string;
  message: string;
};

const FLOW_SURFACE_EXTRACTOR_CLI_VERSION = 'flow-surfaces-extractor@1';
const FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

export async function runFlowSurfaceExtractorCli(
  targets: FlowSurfaceExtractorCliTarget[],
  options: FlowSurfaceExtractorCliOptions = {},
): Promise<FlowSurfaceExtractorCliSummary> {
  const extractPlugin = options.extractPlugin || extractFlowSurfacePluginCapabilities;
  const results: FlowSurfaceExtractorCliResult[] = [];

  for (const target of targets) {
    let extraction: FlowSurfaceExtractorPluginExtraction;
    try {
      extraction = await extractPlugin(target, {
        preferMode: options.preferMode,
        generatedAt: options.generatedAt,
        extractorVersion: options.extractorVersion,
      });
    } catch (error) {
      results.push({
        ok: false,
        plugin: target.plugin,
        eventCount: 0,
        candidateCount: 0,
        warningCount: 0,
        errors: [toFlowSurfaceCliError(error)],
      });
      continue;
    }

    const errors: FlowSurfaceCliError[] = [];
    let snapshotPath: string | undefined;
    if (!options.dryRun) {
      try {
        snapshotPath = await writeFlowSurfaceAutoSnapshot({
          snapshot: extraction.snapshot,
          outDir: options.outDir || getFlowSurfaceAutoSnapshotStorageDir(),
        });
      } catch (error) {
        errors.push(toFlowSurfaceCliError(error));
      }
    }
    const warningFailure = getWarningFailure(options.failOnWarning, extraction.warningCount);
    if (warningFailure) {
      errors.push(warningFailure);
    }
    results.push({
      ok: errors.length === 0,
      plugin: extraction.snapshot.plugin || target.plugin,
      ...(snapshotPath ? { snapshotPath } : {}),
      eventCount: extraction.eventCount,
      candidateCount: extraction.candidateCount,
      warningCount: extraction.warningCount,
      ...(errors.length ? { errors } : {}),
    });
  }

  const ok = results.every((result) => result.ok);
  return {
    ok,
    dryRun: !!options.dryRun,
    results,
    exitCode: ok ? 0 : 1,
  };
}

export async function extractFlowSurfacePluginCapabilities(
  target: FlowSurfaceExtractorCliTarget,
  options: Pick<FlowSurfaceExtractorCliOptions, 'preferMode' | 'generatedAt' | 'extractorVersion'> = {},
): Promise<FlowSurfaceExtractorPluginExtraction> {
  const packageRoot = target.packageRoot || getPackageDir(target.plugin);
  const resolution = await resolveFlowSurfacePluginEntry({
    plugin: target.plugin,
    packageRoot,
    preferMode: options.preferMode,
  });
  const packageJsonSource = await readOptionalTextFile(resolution.packageJsonPath);
  const packageJson = parsePackageJson(packageJsonSource);
  const sourceFiles = await collectFlowSurfaceExtractorSourceFiles({
    packageRoot: resolution.packageRoot,
    selectedEntry: resolution.selectedEntry,
    selectedMode: resolution.mode,
  });
  const events = sourceFiles.flatMap((sourceFile) =>
    collectFlowSurfaceExtractorAstEvents({
      source: sourceFile.source,
      sourceFile: sourceFile.filePath,
    }),
  );
  const snapshot = buildFlowSurfaceAutoSnapshot({
    plugin: resolution.plugin || target.plugin,
    pluginVersion: getPackageVersion(packageJson),
    generatedAt: options.generatedAt,
    resolvedEntry: resolution.selectedEntry,
    sourceHash: hashExtractorSources([packageJsonSource || '', ...sourceFiles.map((sourceFile) => sourceFile.source)]),
    extractorVersion: options.extractorVersion || FLOW_SURFACE_EXTRACTOR_CLI_VERSION,
    events,
    warnings: resolution.warnings,
  });
  return {
    snapshot,
    eventCount: countNonWarningEvents(events),
    candidateCount: deriveFlowSurfaceAutoCapabilityCandidates(snapshot).length,
    warningCount: snapshot.warnings.length,
  };
}

async function collectFlowSurfaceExtractorSourceFiles(input: {
  packageRoot: string;
  selectedEntry?: string;
  selectedMode?: 'source' | 'dist';
}) {
  const filePaths =
    input.selectedMode === 'dist'
      ? []
      : await collectFlowSurfaceClientV2SourceFilePaths(join(input.packageRoot, 'src/client-v2'));
  if (input.selectedEntry) {
    filePaths.push(input.selectedEntry);
  }
  const sourceFiles = await Promise.all(
    Array.from(new Set(filePaths))
      .sort((left, right) => left.localeCompare(right))
      .map(async (filePath) => ({
        filePath,
        source: await readFile(filePath, 'utf8'),
      })),
  );
  return sourceFiles;
}

async function collectFlowSurfaceClientV2SourceFilePaths(rootDir: string): Promise<string[]> {
  const entries = await readFlowSurfaceClientV2SourceDir(rootDir);
  if (!entries.length) {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFlowSurfaceClientV2SourceFilePaths(entryPath)));
      continue;
    }
    if (!entry.isFile() || entry.name.endsWith('.d.ts')) {
      continue;
    }
    if (FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(entryPath);
    }
  }
  return files;
}

async function readFlowSurfaceClientV2SourceDir(rootDir: string) {
  try {
    return await readdir(rootDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

export function formatFlowSurfaceExtractorCliSummary(
  summary: FlowSurfaceExtractorCliSummary,
  options = { json: false },
) {
  if (options.json) {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }

  const lines = ['Flow surface capability extraction'];
  for (const result of summary.results) {
    const status = result.ok ? 'ok' : 'failed';
    const snapshot = result.snapshotPath ? ` snapshot=${result.snapshotPath}` : '';
    const errors = result.errors?.length ? ` errors=${result.errors.map(formatCliError).join('; ')}` : '';
    lines.push(
      `- ${result.plugin}: ${status} events=${result.eventCount} candidates=${result.candidateCount} warnings=${result.warningCount}${snapshot}${errors}`,
    );
  }
  lines.push(`status=${summary.ok ? 'ok' : 'failed'} dryRun=${summary.dryRun ? 'true' : 'false'}`);
  return `${lines.join('\n')}\n`;
}

export function registerFlowSurfaceExtractorCommand(app: Application) {
  const command = (app.findCommand('flow-surfaces') || app.command('flow-surfaces')) as ReturnType<
    Application['command']
  >;
  command
    .command('extract-capabilities')
    .option('--plugin <packageName>', 'extract one plugin package')
    .option('--all-enabled', 'extract every enabled plugin package')
    .option('--out <dir>', 'snapshot output directory')
    .option('--json', 'print a machine-readable summary')
    .option('--dry-run', 'do not write snapshot files')
    .option('--fail-on-warning', 'return a failing exit code when warnings are produced')
    .option('--prefer-mode <mode>', 'prefer source or dist client-v2 entries')
    .action(async (options: FlowSurfaceExtractorCliCommandOptions) => {
      const summary = await runFlowSurfaceExtractorCommand(app, options);
      process.stdout.write(formatFlowSurfaceExtractorCliSummary(summary, { json: !!options.json }));
      process.exitCode = summary.exitCode;
    });
}

export async function runFlowSurfaceExtractorCommand(
  app: Application,
  options: FlowSurfaceExtractorCliCommandOptions,
  runtimeOptions: Pick<FlowSurfaceExtractorCliOptions, 'extractPlugin' | 'generatedAt' | 'extractorVersion'> = {},
): Promise<FlowSurfaceExtractorCliSummary> {
  try {
    const preferMode = parsePreferMode(options.preferMode);
    const targets = await resolveFlowSurfaceExtractorCliTargets(app, options);
    return await runFlowSurfaceExtractorCli(targets, {
      dryRun: !!options.dryRun,
      extractPlugin: runtimeOptions.extractPlugin,
      failOnWarning: !!options.failOnWarning,
      generatedAt: runtimeOptions.generatedAt,
      extractorVersion: runtimeOptions.extractorVersion,
      outDir: options.out,
      preferMode,
    });
  } catch (error) {
    const result: FlowSurfaceExtractorCliResult = {
      ok: false,
      plugin: options.plugin || (options.allEnabled ? '--all-enabled' : 'unknown'),
      eventCount: 0,
      candidateCount: 0,
      warningCount: 0,
      errors: [toFlowSurfaceCliError(error)],
    };
    return {
      ok: false,
      dryRun: !!options.dryRun,
      results: [result],
      exitCode: 1,
    };
  }
}

async function resolveFlowSurfaceExtractorCliTargets(
  app: Application,
  options: FlowSurfaceExtractorCliCommandOptions,
): Promise<FlowSurfaceExtractorCliTarget[]> {
  if (options.allEnabled) {
    await ensureFlowSurfaceExtractorAppLoaded(app, { suppressStdout: !!options.json });
    const records = await app.pm.repository.find({
      fields: ['packageName'],
      filter: {
        enabled: true,
      },
    });
    return dedupeStrings(records.map(getPackageNameFromEnabledRecord).filter(isNonEmptyString)).map((plugin) => ({
      plugin,
    }));
  }

  if (!options.plugin) {
    throw new Error('Either --plugin or --all-enabled is required.');
  }

  const parsed = await PluginManager.parseName(options.plugin);
  return [
    {
      plugin: parsed.packageName,
    },
  ];
}

async function ensureFlowSurfaceExtractorAppLoaded(app: Application, options: { suppressStdout?: boolean } = {}) {
  if (app.loaded) {
    return;
  }
  if (options.suppressStdout) {
    await runWithSuppressedStdout(() => app.load());
    return;
  }
  await app.load();
}

async function runWithSuppressedStdout<T>(task: () => Promise<T>) {
  const originalWrite = process.stdout.write;
  process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
    const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
    maybeCallback?.();
    return true;
  }) as typeof process.stdout.write;
  try {
    return await task();
  } finally {
    process.stdout.write = originalWrite;
  }
}

function parsePreferMode(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  if (value === 'source' || value === 'dist') {
    return value;
  }
  throw new Error('--prefer-mode must be source or dist.');
}

function getWarningFailure(failOnWarning: boolean | undefined, warningCount: number): FlowSurfaceCliError | undefined {
  if (!failOnWarning || warningCount === 0) {
    return undefined;
  }
  return {
    code: 'extractor-warning',
    message: `Extractor produced ${warningCount} warning(s).`,
  };
}

function countNonWarningEvents(events: FlowSurfaceExtractionEvent[]) {
  return events.filter((event) => event.type !== 'warning').length;
}

function hashExtractorSources(parts: string[]) {
  const hash = createHash('sha256');
  parts.forEach((part) => {
    hash.update(part);
    hash.update('\0');
  });
  return hash.digest('hex');
}

async function readOptionalTextFile(filePath: string) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

function parsePackageJson(source: string | undefined) {
  if (!source) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(source);
    return isPlainRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getPackageVersion(packageJson: Record<string, unknown> | undefined) {
  return typeof packageJson?.version === 'string' ? packageJson.version : undefined;
}

function getPackageNameFromEnabledRecord(record: unknown) {
  if (!isPlainRecord(record)) {
    return undefined;
  }
  if (typeof record.packageName === 'string') {
    return normalizePluginPackageName(record.packageName);
  }
  const getValue = record.get;
  if (typeof getValue === 'function') {
    const packageName = getValue.call(record, 'packageName');
    return normalizePluginPackageName(packageName);
  }
  return undefined;
}

function normalizePluginPackageName(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toFlowSurfaceCliError(error: unknown): FlowSurfaceCliError {
  if (isPlainRecord(error)) {
    const code = typeof error.code === 'string' ? error.code : 'extractor-runtime-error';
    const message = typeof error.message === 'string' ? error.message : 'Flow surface extractor failed.';
    return {
      code,
      message,
    };
  }
  return {
    code: 'extractor-runtime-error',
    message: 'Flow surface extractor failed.',
  };
}

function formatCliError(error: FlowSurfaceCliError) {
  return `${error.code}: ${error.message.replace(/\s+/g, ' ').trim()}`;
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
