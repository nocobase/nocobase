/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { readdir, readFile, realpath, stat } from 'fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'path';
import {
  buildFlowSurfaceAutoSnapshot,
  deriveFlowSurfaceAutoCapabilityCandidates,
  getFlowSurfaceAutoSnapshotStorageDir,
  writeFlowSurfaceAutoSnapshot,
} from './snapshot';
import { collectFlowSurfaceExtractorAstEvents, collectFlowSurfaceExtractorModuleSpecifiers } from './ast';
import { resolveFlowSurfacePluginEntry } from './entry-resolver';
import type { FlowSurfaceAutoSnapshot, FlowSurfaceExtractorCliResult, FlowSurfaceExtractionEvent } from './types';

export type FlowSurfaceExtractorCliTarget = {
  plugin: string;
  packageRoot?: string;
  sourceEntry?: string;
  sourceRoot?: string;
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

type FlowSurfaceCliError = {
  code: string;
  message: string;
};

const FLOW_SURFACE_EXTRACTOR_CLI_VERSION = 'flow-surfaces-extractor@1';
const FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS = ['.js', '.jsx', '.mjs', '.ts', '.tsx'];
const FLOW_SURFACE_EXTRACTOR_EXCLUDED_DIRS = new Set([
  '__benchmarks__',
  '__e2e__',
  '__test__',
  '__tests__',
  'demos',
  'fixtures',
  'node_modules',
]);
const FLOW_SURFACE_EXTRACTOR_TEST_FILE_PATTERN = /\.(?:e2e|spec|test)\.(?:js|jsx|mjs|ts|tsx)$/i;
const DEFAULT_FLOW_SURFACE_SOURCE_ROOT = 'src/client-v2';

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
  const packageRoot = target.packageRoot;
  if (!packageRoot) {
    throw new Error(`packageRoot is required for ${target.plugin}`);
  }
  const resolution = await resolveFlowSurfacePluginEntry({
    plugin: target.plugin,
    packageRoot,
    preferMode: options.preferMode,
    sourceEntry: target.sourceEntry,
    sourceRoot: target.sourceRoot,
  });
  const packageJsonSource = await readOptionalTextFile(resolution.packageJsonPath);
  const packageJson = parsePackageJson(packageJsonSource);
  const sourceFiles = await collectFlowSurfaceExtractorSourceFiles({
    packageRoot: resolution.packageRoot,
    selectedEntry: resolution.selectedEntry,
    selectedMode: resolution.mode,
    sourceRoot: target.sourceRoot,
  });
  const events = sourceFiles.flatMap((sourceFile) =>
    collectFlowSurfaceExtractorAstEvents({
      source: sourceFile.source,
      sourceFile: sourceFile.sourceRef,
      sourcePath: sourceFile.filePath,
    }),
  );
  const snapshot = buildFlowSurfaceAutoSnapshot({
    plugin: resolution.plugin || target.plugin,
    pluginVersion: getPackageVersion(packageJson),
    generatedAt: options.generatedAt,
    resolvedEntry: resolution.selectedEntry
      ? toFlowSurfaceExtractorSourceRef(resolution.packageRoot, resolution.selectedEntry)
      : undefined,
    sourceHash: hashExtractorSources([
      packageJsonSource || '',
      ...sourceFiles.flatMap((sourceFile) => [sourceFile.sourceRef, sourceFile.source]),
    ]),
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
  sourceRoot?: string;
}) {
  const sources = input.selectedEntry
    ? await collectReachableFlowSurfaceSources(input.packageRoot, input.selectedEntry)
    : new Map(
        await Promise.all(
          (input.selectedMode === 'dist'
            ? []
            : await collectFlowSurfaceClientV2SourceFilePaths(
                resolve(input.packageRoot, input.sourceRoot || DEFAULT_FLOW_SURFACE_SOURCE_ROOT),
              )
          ).map(async (filePath) => [filePath, await readFile(filePath, 'utf8')] as const),
        ),
      );
  return Array.from(sources, ([filePath, source]) => ({
    filePath,
    sourceRef: toFlowSurfaceExtractorSourceRef(input.packageRoot, filePath),
    source,
  })).sort((left, right) => left.filePath.localeCompare(right.filePath));
}

async function collectReachableFlowSurfaceSources(packageRoot: string, selectedEntry: string) {
  const sources = new Map<string, string>();
  const pending = [selectedEntry];
  const seen = new Set<string>();
  const realPackageRoot = await realpath(packageRoot);

  while (pending.length) {
    const filePath = pending.shift();
    if (!filePath) {
      continue;
    }
    if (seen.has(filePath) || !isFlowSurfaceExtractorProductionSourceFile(filePath, packageRoot)) {
      continue;
    }
    seen.add(filePath);
    const source = await readFile(filePath, 'utf8');
    sources.set(filePath, source);
    for (const specifier of collectFlowSurfaceExtractorModuleSpecifiers({ source, sourceFile: filePath })) {
      const dependency = await resolveFlowSurfaceExtractorModulePath(packageRoot, realPackageRoot, filePath, specifier);
      if (dependency && !seen.has(dependency)) {
        pending.push(dependency);
      }
    }
  }

  return sources;
}

async function resolveFlowSurfaceExtractorModulePath(
  packageRoot: string,
  realPackageRoot: string,
  importer: string,
  specifier: string,
) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  if (!cleanSpecifier.startsWith('.')) {
    return undefined;
  }
  const basePath = resolve(dirname(importer), cleanSpecifier);
  if (!isPathInside(packageRoot, basePath)) {
    return undefined;
  }
  const candidates = FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS.includes(extname(basePath).toLowerCase())
    ? [basePath]
    : [
        ...FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
        ...FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS.map((extension) => join(basePath, `index${extension}`)),
      ];
  for (const candidate of candidates) {
    if (!isFlowSurfaceExtractorProductionSourceFile(candidate, packageRoot) || !(await isFile(candidate))) {
      continue;
    }
    if (!isPathInside(realPackageRoot, await realpath(candidate))) {
      continue;
    }
    return candidate;
  }
  return undefined;
}

async function collectFlowSurfaceClientV2SourceFilePaths(rootDir: string, sourceRoot = rootDir): Promise<string[]> {
  const entries = await readFlowSurfaceClientV2SourceDir(rootDir);
  if (!entries.length) {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (FLOW_SURFACE_EXTRACTOR_EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...(await collectFlowSurfaceClientV2SourceFilePaths(entryPath, sourceRoot)));
      continue;
    }
    if (entry.isFile() && isFlowSurfaceExtractorProductionSourceFile(entryPath, sourceRoot)) {
      files.push(entryPath);
    }
  }
  return files;
}

export function isFlowSurfaceExtractorProductionSourceFile(filePath: string, sourceRoot?: string) {
  const normalizedPath = (sourceRoot ? relative(sourceRoot, filePath) : filePath).replace(/\\/g, '/');
  const segments = normalizedPath.split('/');
  const fileName = segments[segments.length - 1] || '';
  return (
    !segments.some((segment) => FLOW_SURFACE_EXTRACTOR_EXCLUDED_DIRS.has(segment)) &&
    !fileName.endsWith('.d.ts') &&
    !FLOW_SURFACE_EXTRACTOR_TEST_FILE_PATTERN.test(fileName) &&
    FLOW_SURFACE_EXTRACTOR_SOURCE_EXTENSIONS.includes(extname(fileName).toLowerCase())
  );
}

function toFlowSurfaceExtractorSourceRef(packageRoot: string, filePath: string) {
  return relative(packageRoot, filePath).split(sep).join('/');
}

function isPathInside(parent: string, child: string) {
  const relativePath = relative(parent, child);
  return (
    relativePath === '' ||
    (!!relativePath && relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}

async function isFile(filePath: string) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
