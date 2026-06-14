/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile, realpath, stat } from 'fs/promises';
import { isAbsolute, relative, resolve, sep } from 'path';
import type { FlowSurfaceCapabilityWarning } from '../types';
import type { FlowSurfacePluginEntryResolution } from './types';

export type ResolveFlowSurfacePluginEntryInput = {
  plugin?: string;
  packageRoot: string;
  preferMode?: 'source' | 'dist';
};

type FlowSurfacePluginPackageJson = Record<string, unknown>;

type FlowSurfacePluginEntryCandidate = {
  entry: string;
  mode: 'source' | 'dist';
};

const SOURCE_ENTRY_CANDIDATES = [
  'src/client-v2/plugin.ts',
  'src/client-v2/plugin.tsx',
  'src/client-v2/index.ts',
  'src/client-v2/index.tsx',
];
const DIST_ENTRY_CANDIDATES = ['dist/client-v2/index.js'];
const PACKAGE_JSON_CLIENT_V2_FIELDS = ['client-v2', 'clientV2', 'client-v2-entry', 'clientV2Entry'];

export async function resolveFlowSurfacePluginEntry(
  input: ResolveFlowSurfacePluginEntryInput,
): Promise<FlowSurfacePluginEntryResolution> {
  const packageRoot = resolve(input.packageRoot);
  const packageJsonPath = resolve(packageRoot, 'package.json');
  const warnings: FlowSurfaceCapabilityWarning[] = [];
  const packageJson = await readFlowSurfacePluginPackageJson(packageJsonPath, warnings);
  const plugin = normalizeString(input.plugin) || normalizeString(packageJson?.name) || '';
  const candidates = [
    ...getPackageJsonClientV2EntryCandidates(packageJson),
    ...SOURCE_ENTRY_CANDIDATES.map((entry) => ({ entry, mode: 'source' as const })),
    ...DIST_ENTRY_CANDIDATES.map((entry) => ({ entry, mode: 'dist' as const })),
  ];
  const existingCandidates = await collectExistingEntryCandidates(packageRoot, candidates, warnings);
  const sourceEntry = existingCandidates.find((candidate) => candidate.mode === 'source')?.entry;
  const distEntry = existingCandidates.find((candidate) => candidate.mode === 'dist')?.entry;
  const preferredMode = input.preferMode || 'source';
  const selectedEntry = preferredMode === 'dist' ? distEntry || sourceEntry : sourceEntry || distEntry;
  const mode = selectedEntry ? (selectedEntry === distEntry ? 'dist' : 'source') : undefined;

  if (!selectedEntry) {
    warnings.push({
      code: 'extractor-runtime-error',
      message: 'Plugin client-v2 entry could not be resolved; extractor should fall back to package-wide AST scan.',
    });
  }

  return {
    plugin,
    packageRoot,
    packageJsonPath,
    ...(sourceEntry ? { sourceEntry } : {}),
    ...(distEntry ? { distEntry } : {}),
    ...(selectedEntry ? { selectedEntry } : {}),
    ...(mode ? { mode } : {}),
    warnings,
  };
}

async function readFlowSurfacePluginPackageJson(
  packageJsonPath: string,
  warnings: FlowSurfaceCapabilityWarning[],
): Promise<FlowSurfacePluginPackageJson | undefined> {
  try {
    const content = await readFile(packageJsonPath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    return isPlainRecord(parsed) ? parsed : undefined;
  } catch {
    warnings.push({
      code: 'extractor-runtime-error',
      message: 'Plugin package.json could not be read; entry resolver will use conventional client-v2 paths.',
    });
    return undefined;
  }
}

function getPackageJsonClientV2EntryCandidates(
  packageJson: FlowSurfacePluginPackageJson | undefined,
): FlowSurfacePluginEntryCandidate[] {
  if (!packageJson) {
    return [];
  }
  const entries = [
    ...PACKAGE_JSON_CLIENT_V2_FIELDS.flatMap((field) => getEntryStrings(packageJson[field])),
    ...getNestedNocobaseEntryStrings(packageJson.nocobase),
    ...getExportEntryStrings(packageJson.exports),
  ];
  return dedupeStrings(entries).map((entry) => ({
    entry,
    mode: inferEntryMode(entry),
  }));
}

function getNestedNocobaseEntryStrings(value: unknown) {
  if (!isPlainRecord(value)) {
    return [];
  }
  return PACKAGE_JSON_CLIENT_V2_FIELDS.flatMap((field) => getEntryStrings(value[field]));
}

function getExportEntryStrings(value: unknown) {
  if (!isPlainRecord(value)) {
    return [];
  }
  return [
    ...getEntryStrings(value['./client-v2']),
    ...getEntryStrings(value['./client-v2.js']),
    ...getEntryStrings(value['./dist/client-v2/index.js']),
  ];
}

function getEntryStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (!isPlainRecord(value)) {
    return [];
  }
  return [
    ...getEntryStrings(value.import),
    ...getEntryStrings(value.require),
    ...getEntryStrings(value.default),
    ...getEntryStrings(value.source),
  ];
}

async function collectExistingEntryCandidates(
  packageRoot: string,
  candidates: FlowSurfacePluginEntryCandidate[],
  warnings: FlowSurfaceCapabilityWarning[],
): Promise<FlowSurfacePluginEntryCandidate[]> {
  const existingCandidates: FlowSurfacePluginEntryCandidate[] = [];
  const realPackageRoot = await getRealPath(packageRoot);
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const entry = resolvePackageEntryPath(packageRoot, candidate.entry, warnings);
    if (!entry || !realPackageRoot) {
      continue;
    }
    const realEntry = await getExistingFileRealPath(entry);
    if (!realEntry) {
      continue;
    }
    if (!isPathInside(realPackageRoot, realEntry)) {
      appendOutsidePackageWarning(warnings);
      continue;
    }
    if (seen.has(realEntry)) {
      continue;
    }
    seen.add(realEntry);
    existingCandidates.push({
      ...candidate,
      entry,
    });
  }
  return existingCandidates;
}

function resolvePackageEntryPath(
  packageRoot: string,
  entry: string,
  warnings: FlowSurfaceCapabilityWarning[],
): string | undefined {
  const normalizedEntry = normalizeString(entry);
  if (!normalizedEntry || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalizedEntry)) {
    return undefined;
  }
  const resolvedEntry = resolve(packageRoot, normalizedEntry);
  if (!isPathInside(packageRoot, resolvedEntry)) {
    appendOutsidePackageWarning(warnings);
    return undefined;
  }
  return resolvedEntry;
}

function isPathInside(parent: string, child: string) {
  const relativePath = relative(parent, child);
  return (
    relativePath === '' ||
    (!!relativePath && relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}

async function getRealPath(filePath: string) {
  try {
    return await realpath(filePath);
  } catch {
    return undefined;
  }
}

async function getExistingFileRealPath(filePath: string) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return undefined;
    }
    return await realpath(filePath);
  } catch {
    return undefined;
  }
}

function appendOutsidePackageWarning(warnings: FlowSurfaceCapabilityWarning[]) {
  warnings.push({
    code: 'extractor-runtime-error',
    message: 'Plugin client-v2 package.json entry was outside package root and was ignored.',
  });
}

function inferEntryMode(entry: string): 'source' | 'dist' {
  const normalized = entry.replace(/\\/g, '/').replace(/^\.\//, '');
  if (
    normalized === 'client-v2.js' ||
    normalized.startsWith('dist/client-v2/') ||
    normalized.includes('/dist/client-v2/')
  ) {
    return 'dist';
  }
  return 'source';
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
  );
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
