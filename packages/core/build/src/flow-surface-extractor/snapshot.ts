/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { constants, type Stats } from 'fs';
import { randomUUID } from 'crypto';
import { lstat, mkdir, open, readdir, realpath, rename, unlink, writeFile } from 'fs/promises';
import { basename, parse, resolve, sep } from 'path';
import _ from 'lodash';
import { inferFlowSurfaceAutoSnapshotAuthoring } from './inferred-authoring';
import type {
  FlowSurfaceCapabilityConfidence,
  FlowSurfaceCapabilityDiagnosticWarning,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityWarning,
} from './public-types';
import {
  FLOW_SURFACE_AUTO_SNAPSHOT_VERSION,
  type FlowSurfaceAutoCapabilityCandidate,
  type FlowSurfaceAutoAllowedChild,
  type FlowSurfaceAutoChildSurface,
  type FlowSurfaceAutoFieldBinding,
  type FlowSurfaceAutoFlow,
  type FlowSurfaceAutoInferredAuthoring,
  type FlowSurfaceAutoInferredAuthoringCapability,
  type FlowSurfaceAutoInferredAuthoringConfidence,
  type FlowSurfaceAutoInferredAuthoringEvidence,
  type FlowSurfaceAutoMenuItem,
  type FlowSurfaceAutoModel,
  type FlowSurfaceAutoPopupHost,
  type FlowSurfaceAutoPopupHostDefaultType,
  type FlowSurfaceAutoSnapshot,
  type FlowSurfaceAutoSourceRef,
  type FlowSurfaceExtractionEvent,
  type FlowSurfaceExtractorCreateModelOptionsStatus,
  type FlowSurfaceExtractorEvidenceSource,
  type FlowSurfaceExtractorFlowStaticStatus,
  type FlowSurfaceExtractorLabelFields,
  type FlowSurfaceFieldBindingRole,
} from './types';

type BuildFlowSurfaceAutoSnapshotInput = {
  plugin: string;
  pluginVersion?: string;
  generatedAt?: string;
  resolvedEntry?: string;
  sourceHash: string;
  dependencyHash?: string;
  extractorVersion: string;
  events: FlowSurfaceExtractionEvent[];
  warnings?: FlowSurfaceCapabilityWarning[];
};

type WriteFlowSurfaceAutoSnapshotInput = {
  snapshot: FlowSurfaceAutoSnapshot;
  outDir: string;
  fileName?: string;
};

type LoadFlowSurfaceAutoSnapshotsFromDirectoryInput = {
  dir: string;
  diagnosticWarnings?: FlowSurfaceCapabilityDiagnosticWarning[];
};

type PinnedOutputDirectory = {
  handle: Awaited<ReturnType<typeof open>>;
  realPath: string;
  requestedPath: string;
  stats: Stats;
};

const FLOW_SURFACE_AUTO_SNAPSHOT_STORAGE_DIR = 'flow-surfaces-capabilities';
const CONFIDENCE_RANK: Record<FlowSurfaceCapabilityConfidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function buildFlowSurfaceAutoSnapshot(input: BuildFlowSurfaceAutoSnapshotInput): FlowSurfaceAutoSnapshot {
  const snapshot: FlowSurfaceAutoSnapshot = {
    version: FLOW_SURFACE_AUTO_SNAPSHOT_VERSION,
    plugin: input.plugin,
    ...(input.pluginVersion ? { pluginVersion: input.pluginVersion } : {}),
    generatedAt: input.generatedAt || new Date().toISOString(),
    ...(input.resolvedEntry ? { resolvedEntry: input.resolvedEntry } : {}),
    sourceHash: input.sourceHash,
    ...(input.dependencyHash ? { dependencyHash: input.dependencyHash } : {}),
    extractorVersion: input.extractorVersion,
    models: collectAutoModels(input.events),
    menuItems: collectAutoMenuItems(input.events),
    fieldBindings: collectAutoFieldBindings(input.events),
    flows: collectAutoFlows(input.events),
    warnings: dedupeWarnings([
      ...(input.warnings || []),
      ...input.events.flatMap((event) => (event.type === 'warning' ? [event.warning] : [])),
    ]),
  };
  const inferredAuthoring = inferFlowSurfaceAutoSnapshotAuthoring(
    snapshot,
    deriveFlowSurfaceAutoCapabilityCandidates(snapshot),
  );
  if (inferredAuthoring) {
    snapshot.inferredAuthoring = inferredAuthoring;
  }
  return snapshot;
}

export function refreshFlowSurfaceAutoSnapshotInferredAuthoring(
  snapshot: FlowSurfaceAutoSnapshot,
): FlowSurfaceAutoSnapshot {
  const inferredAuthoring = inferFlowSurfaceAutoSnapshotAuthoring(
    snapshot,
    deriveFlowSurfaceAutoCapabilityCandidates(snapshot),
  );
  if (!inferredAuthoring) {
    return snapshot;
  }
  if (_.isEqual(snapshot.inferredAuthoring, inferredAuthoring)) {
    return snapshot;
  }
  return {
    ...snapshot,
    inferredAuthoring,
  };
}

export function deriveFlowSurfaceAutoCapabilityCandidates(
  snapshot: FlowSurfaceAutoSnapshot,
): FlowSurfaceAutoCapabilityCandidate[] {
  const candidates = new Map<string, FlowSurfaceAutoCapabilityCandidate>();
  const modelByUse = new Map(snapshot.models.map((model) => [model.modelUse, model]));
  const flowsByModelUse = groupByModelUse(snapshot.flows);
  const menuItemsByModelUse = groupByModelUse(snapshot.menuItems);

  snapshot.menuItems.forEach((menuItem) => {
    if (!menuItem.modelUse) {
      return;
    }
    const kind = inferKindFromSlotOrModel(menuItem.slot, menuItem.modelUse);
    if (!kind) {
      return;
    }
    upsertCandidate(candidates, {
      snapshot,
      modelUse: menuItem.modelUse,
      kind,
      label: getDisplayLabel(menuItem) || toReadableLabel(menuItem.modelUse),
      evidence: {
        type: 'menuItem',
        ref: menuItem.menuKey || menuItem.modelUse,
      },
      confidence: resolveCandidateConfidence({
        model: modelByUse.get(menuItem.modelUse),
        menuItems: menuItemsByModelUse.get(menuItem.modelUse) || [],
        flows: flowsByModelUse.get(menuItem.modelUse) || [],
      }),
    });
  });

  snapshot.fieldBindings.forEach((binding) => {
    if (!binding.modelUse) {
      return;
    }
    upsertCandidate(candidates, {
      snapshot,
      modelUse: binding.modelUse,
      kind: 'fieldBinding',
      label: binding.fieldInterface
        ? `${binding.fieldInterface} ${binding.role} binding`
        : `${binding.role} field binding`,
      evidence: {
        type: 'fieldBinding',
        ref: binding.fieldInterface || binding.modelUse,
      },
      confidence: binding.confidence,
    });
  });

  snapshot.flows.forEach((flow) => {
    if (!flow.modelUse) {
      return;
    }
    const kind = inferKindFromModelUse(flow.modelUse);
    if (!kind) {
      return;
    }
    upsertCandidate(candidates, {
      snapshot,
      modelUse: flow.modelUse,
      kind,
      label: flow.title || toReadableLabel(flow.modelUse),
      evidence: {
        type: 'flow',
        ref: flow.flowKey || flow.modelUse,
      },
      confidence: resolveCandidateConfidence({
        model: modelByUse.get(flow.modelUse),
        menuItems: menuItemsByModelUse.get(flow.modelUse) || [],
        flows: flowsByModelUse.get(flow.modelUse) || [],
      }),
    });
  });

  snapshot.models.forEach((model) => {
    const kind = inferKindFromModelUse(model.modelUse);
    if (!kind) {
      return;
    }
    const flows = flowsByModelUse.get(model.modelUse) || [];
    const menuItems = menuItemsByModelUse.get(model.modelUse) || [];
    upsertCandidate(candidates, {
      snapshot,
      modelUse: model.modelUse,
      kind,
      label: toReadableLabel(model.modelUse),
      evidence: {
        type: 'model',
        ref: model.modelUse,
      },
      confidence: resolveCandidateConfidence({
        model,
        menuItems,
        flows,
      }),
    });
  });

  return disambiguateAutoPublicTypeCollisions(Array.from(candidates.values())).sort((left, right) =>
    left.publicType.localeCompare(right.publicType),
  );
}

export async function writeFlowSurfaceAutoSnapshot(input: WriteFlowSurfaceAutoSnapshotInput) {
  const requestedOutDir = resolve(input.outDir);
  const fileName = input.fileName || getFlowSurfaceAutoSnapshotFileName(input.snapshot.plugin);
  if (fileName !== basename(fileName)) {
    throw new Error('Flow surface auto snapshot file name must not include path separators.');
  }
  const content = `${JSON.stringify(input.snapshot, null, 2)}\n`;
  await assertNoSymlinkInExistingPath(requestedOutDir);
  await mkdir(requestedOutDir, { recursive: true });
  await assertNoSymlinkInExistingPath(requestedOutDir);
  const pinnedOutDir = await openPinnedOutputDirectory(requestedOutDir);
  try {
    const snapshotPath = resolve(pinnedOutDir.realPath, fileName);
    await assertPinnedOutputDirectoryStillCurrent(pinnedOutDir);
    await assertSnapshotPathIsWritableFile(snapshotPath);
    await writeSnapshotFileAtomically(pinnedOutDir, snapshotPath, content);
    return snapshotPath;
  } finally {
    await pinnedOutDir.handle.close();
  }
}

async function writeSnapshotFileAtomically(pinnedOutDir: PinnedOutputDirectory, snapshotPath: string, content: string) {
  const tempPath = resolve(
    pinnedOutDir.realPath,
    `.tmp-${basename(snapshotPath)}-${process.pid}-${Date.now()}-${randomUUID()}`,
  );
  try {
    await assertPinnedOutputDirectoryStillCurrent(pinnedOutDir);
    await writeFile(tempPath, content, {
      encoding: 'utf8',
      flag: constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    });
    await assertPinnedOutputDirectoryStillCurrent(pinnedOutDir);
    await assertSnapshotPathIsWritableFile(snapshotPath);
    await assertPinnedOutputDirectoryStillCurrent(pinnedOutDir);
    await rename(tempPath, snapshotPath);
    await assertPinnedOutputDirectoryStillCurrent(pinnedOutDir);
    await assertSnapshotPathIsWritableFile(snapshotPath);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export function getFlowSurfaceAutoSnapshotStorageDir() {
  return resolve(process.cwd(), 'storage', FLOW_SURFACE_AUTO_SNAPSHOT_STORAGE_DIR);
}

export async function loadFlowSurfaceAutoSnapshotsFromDirectory(
  input: LoadFlowSurfaceAutoSnapshotsFromDirectoryInput,
): Promise<FlowSurfaceAutoSnapshot[]> {
  const pinnedDirectory = await openReadableSnapshotDirectory(input.dir);
  if (!pinnedDirectory) {
    return [];
  }

  try {
    const fileNames = await readFlowSurfaceAutoSnapshotFileNames(pinnedDirectory);
    const snapshots: FlowSurfaceAutoSnapshot[] = [];
    for (const fileName of fileNames.sort((left, right) => left.localeCompare(right))) {
      if (!isSnapshotJsonFileName(fileName)) {
        continue;
      }
      const snapshot = await readFlowSurfaceAutoSnapshotFile(pinnedDirectory, fileName, input.diagnosticWarnings);
      if (snapshot) {
        snapshots.push(refreshFlowSurfaceAutoSnapshotInferredAuthoring(snapshot));
      }
    }
    return snapshots;
  } finally {
    await pinnedDirectory.handle.close();
  }
}

export function getFlowSurfaceAutoSnapshotFileName(plugin: string) {
  return `${plugin.replace(/[\\/]/g, '__')}.json`;
}

export function buildAutoNamespacedPublicType(ownerPlugin: string, modelUse: string) {
  const owner = ownerPlugin
    .replace(/^@/, '')
    .replace(/^nocobase\/plugin-/, 'plugin-')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? _.camelCase(part) : _.upperFirst(_.camelCase(part))))
    .join('');
  const capability = _.camelCase(stripModelSuffix(modelUse)) || 'capability';
  return `${owner || 'plugin'}.${capability}`;
}

async function assertSnapshotPathIsWritableFile(snapshotPath: string) {
  try {
    const stats = await lstat(snapshotPath);
    if (stats.isSymbolicLink()) {
      throw new Error('Flow surface auto snapshot path must not be a symlink.');
    }
    if (!stats.isFile()) {
      throw new Error('Flow surface auto snapshot path must be a file.');
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function openPinnedOutputDirectory(requestedPath: string): Promise<PinnedOutputDirectory> {
  const handle = await open(requestedPath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    const stats = await handle.stat();
    if (!stats.isDirectory()) {
      throw new Error('Flow surface auto snapshot output path must be a directory.');
    }
    const pathStats = await lstat(requestedPath);
    if (pathStats.isSymbolicLink() || !pathStats.isDirectory() || !sameFileIdentity(stats, pathStats)) {
      throw new Error('Flow surface auto snapshot output directory changed while opening.');
    }
    const realPath = await realpath(requestedPath);
    return {
      handle,
      realPath,
      requestedPath,
      stats,
    };
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}

async function assertPinnedOutputDirectoryStillCurrent(input: PinnedOutputDirectory) {
  const handleStats = await input.handle.stat();
  if (!sameFileIdentity(input.stats, handleStats)) {
    throw new Error('Flow surface auto snapshot output directory handle changed.');
  }
  const pathStats = await lstat(input.requestedPath);
  if (pathStats.isSymbolicLink() || !pathStats.isDirectory() || !sameFileIdentity(input.stats, pathStats)) {
    throw new Error('Flow surface auto snapshot output directory changed during write.');
  }
}

function sameFileIdentity(left: Stats, right: Stats) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function assertNoSymlinkInExistingPath(filePath: string) {
  const parsed = parse(filePath);
  const parts = filePath.slice(parsed.root.length).split(sep).filter(Boolean);
  let current = parsed.root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw new Error('Flow surface auto snapshot output directory path must not include symlinks.');
      }
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}

async function openReadableSnapshotDirectory(dir: string): Promise<PinnedOutputDirectory | undefined> {
  try {
    const requestedDir = resolve(dir);
    await assertNoSymlinkInExistingPath(requestedDir);
    return await openPinnedOutputDirectory(requestedDir);
  } catch {
    return undefined;
  }
}

function isSnapshotJsonFileName(fileName: string) {
  return fileName === basename(fileName) && fileName.toLowerCase().endsWith('.json');
}

async function readFlowSurfaceAutoSnapshotFileNames(input: PinnedOutputDirectory): Promise<string[]> {
  try {
    await assertPinnedOutputDirectoryStillCurrent(input);
    const fileNames = await readdir(input.realPath);
    await assertPinnedOutputDirectoryStillCurrent(input);
    return fileNames;
  } catch {
    return [];
  }
}

async function readFlowSurfaceAutoSnapshotFile(
  pinnedDirectory: PinnedOutputDirectory,
  fileName: string,
  diagnosticWarnings?: FlowSurfaceCapabilityDiagnosticWarning[],
): Promise<FlowSurfaceAutoSnapshot | undefined> {
  const snapshotPath = resolve(pinnedDirectory.realPath, fileName);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let warned = false;
  const warn = (message: string) => {
    warned = true;
    addFlowSurfaceAutoSnapshotLoadWarning(diagnosticWarnings, fileName, message);
  };
  try {
    await assertPinnedOutputDirectoryStillCurrent(pinnedDirectory);
    const pathStats = await lstat(snapshotPath);
    if (pathStats.isSymbolicLink()) {
      warn('Flow surface auto snapshot file was skipped because it is a symlink.');
      return undefined;
    }
    if (!pathStats.isFile()) {
      warn('Flow surface auto snapshot file was skipped because it is not a regular file.');
      return undefined;
    }
    await assertPinnedOutputDirectoryStillCurrent(pinnedDirectory);
    handle = await open(snapshotPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stats = await handle.stat();
    if (!stats.isFile() || !sameFileIdentity(stats, pathStats)) {
      warn('Flow surface auto snapshot file was skipped because it changed while reading.');
      return undefined;
    }
    await assertPinnedOutputDirectoryStillCurrent(pinnedDirectory);
    const content = await handle.readFile({ encoding: 'utf8' });
    const currentPathStats = await lstat(snapshotPath);
    if (currentPathStats.isSymbolicLink() || !currentPathStats.isFile() || !sameFileIdentity(stats, currentPathStats)) {
      warn('Flow surface auto snapshot file was skipped because it changed while reading.');
      return undefined;
    }
    await assertPinnedOutputDirectoryStillCurrent(pinnedDirectory);
    const parsed: unknown = JSON.parse(content);
    if (!isFlowSurfaceAutoSnapshot(parsed)) {
      warn('Flow surface auto snapshot file was skipped because it is malformed or unsupported.');
      return undefined;
    }
    return parsed;
  } catch {
    if (!warned) {
      warn('Flow surface auto snapshot file was skipped because it could not be read or parsed.');
    }
    return undefined;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

function addFlowSurfaceAutoSnapshotLoadWarning(
  diagnosticWarnings: FlowSurfaceCapabilityDiagnosticWarning[] | undefined,
  fileName: string,
  message: string,
) {
  diagnosticWarnings?.push({
    source: 'snapshot',
    code: 'snapshot-file-skipped',
    fileName,
    message,
  });
}

function isFlowSurfaceAutoSnapshot(value: unknown): value is FlowSurfaceAutoSnapshot {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    value.version === FLOW_SURFACE_AUTO_SNAPSHOT_VERSION &&
    typeof value.plugin === 'string' &&
    hasOptionalStringFields(value, ['pluginVersion', 'resolvedEntry', 'dependencyHash']) &&
    typeof value.generatedAt === 'string' &&
    typeof value.sourceHash === 'string' &&
    typeof value.extractorVersion === 'string' &&
    isArrayOf(value.models, isFlowSurfaceAutoModel) &&
    isArrayOf(value.menuItems, isFlowSurfaceAutoMenuItem) &&
    isArrayOf(value.fieldBindings, isFlowSurfaceAutoFieldBinding) &&
    isArrayOf(value.flows, isFlowSurfaceAutoFlow) &&
    (typeof value.inferredAuthoring === 'undefined' || isFlowSurfaceAutoInferredAuthoring(value.inferredAuthoring)) &&
    isArrayOf(value.warnings, isFlowSurfaceCapabilityWarning)
  );
}

function isFlowSurfaceAutoInferredAuthoring(value: unknown): value is FlowSurfaceAutoInferredAuthoring {
  return (
    isPlainRecord(value) &&
    (typeof value.contractVersion === 'undefined' || typeof value.contractVersion === 'number') &&
    isArrayOf(value.capabilities, isFlowSurfaceAutoInferredAuthoringCapability)
  );
}

function isFlowSurfaceAutoInferredAuthoringCapability(
  value: unknown,
): value is FlowSurfaceAutoInferredAuthoringCapability {
  return (
    isPlainRecord(value) &&
    isFlowSurfaceAutoCapabilityKind(value.kind) &&
    typeof value.publicType === 'string' &&
    (typeof value.acceptedAliases === 'undefined' || isArrayOf(value.acceptedAliases, isString)) &&
    typeof value.ownerPlugin === 'string' &&
    typeof value.modelUse === 'string' &&
    typeof value.label === 'string' &&
    (typeof value.placement === 'undefined' || isJsonSafePlainValue(value.placement)) &&
    isFlowSurfaceAutoInferredAuthoringConfidence(value.confidence) &&
    (typeof value.initParamsSchema === 'undefined' || isJsonSafePlainValue(value.initParamsSchema)) &&
    (typeof value.settingsSchema === 'undefined' || isJsonSafePlainValue(value.settingsSchema)) &&
    (typeof value.configureOptions === 'undefined' || isJsonSafePlainValue(value.configureOptions)) &&
    (typeof value.createRecipe === 'undefined' || isJsonSafePlainValue(value.createRecipe)) &&
    (typeof value.childSurfaces === 'undefined' || isArrayOf(value.childSurfaces, isFlowSurfaceAutoChildSurface)) &&
    (typeof value.allowedChildren === 'undefined' || isArrayOf(value.allowedChildren, isFlowSurfaceAutoAllowedChild)) &&
    (typeof value.popupHosts === 'undefined' || isArrayOf(value.popupHosts, isFlowSurfaceAutoPopupHost)) &&
    isArrayOf(value.evidence, isFlowSurfaceAutoInferredAuthoringEvidence) &&
    (typeof value.warnings === 'undefined' || isArrayOf(value.warnings, isFlowSurfaceCapabilityWarning))
  );
}

function isFlowSurfaceAutoInferredAuthoringConfidence(
  value: unknown,
): value is FlowSurfaceAutoInferredAuthoringConfidence {
  return (
    isPlainRecord(value) &&
    isFlowSurfaceCapabilityConfidence(value.discovery) &&
    isFlowSurfaceCapabilityConfidence(value.placement) &&
    isFlowSurfaceCapabilityConfidence(value.tree) &&
    isFlowSurfaceCapabilityConfidence(value.settings) &&
    isFlowSurfaceCapabilityConfidence(value.write)
  );
}

function isFlowSurfaceAutoInferredAuthoringEvidence(value: unknown): value is FlowSurfaceAutoInferredAuthoringEvidence {
  return (
    isPlainRecord(value) && isFlowSurfaceAutoInferredAuthoringEvidenceType(value.type) && typeof value.ref === 'string'
  );
}

function isFlowSurfaceAutoChildSurface(value: unknown): value is FlowSurfaceAutoChildSurface {
  return (
    isPlainRecord(value) &&
    typeof value.key === 'string' &&
    typeof value.parentModelUse === 'string' &&
    typeof value.subModelKey === 'string' &&
    isFlowSurfaceAutoChildSurfaceKind(value.kind) &&
    (typeof value.emptyWhenMissing === 'undefined' || typeof value.emptyWhenMissing === 'boolean') &&
    (typeof value.allowedChildren === 'undefined' || isArrayOf(value.allowedChildren, isString))
  );
}

function isFlowSurfaceAutoAllowedChild(value: unknown): value is FlowSurfaceAutoAllowedChild {
  return (
    isPlainRecord(value) &&
    isFlowSurfaceAutoChildSurfaceKind(value.kind) &&
    typeof value.modelUse === 'string' &&
    hasOptionalStringFields(value, ['publicType', 'label', 'builderContainerUse']) &&
    (typeof value.conditions === 'undefined' || isArrayOf(value.conditions, isString))
  );
}

function isFlowSurfaceAutoPopupHost(value: unknown): value is FlowSurfaceAutoPopupHost {
  return (
    isPlainRecord(value) &&
    typeof value.key === 'string' &&
    typeof value.modelUse === 'string' &&
    hasOptionalStringFields(value, [
      'publicType',
      'parentModelUse',
      'subModelKey',
      'childSurfaceKey',
      'openViewPath',
    ]) &&
    (typeof value.parentOpenViewMirrorPaths === 'undefined' || isArrayOf(value.parentOpenViewMirrorPaths, isString)) &&
    isFlowSurfaceAutoPopupHostDefaultType(value.defaultType) &&
    (typeof value.hasCurrentRecord === 'undefined' || typeof value.hasCurrentRecord === 'boolean') &&
    (typeof value.templateStrategy === 'undefined' ||
      value.templateStrategy === 'preferTemplateThenFallback' ||
      value.templateStrategy === 'fallbackOnly') &&
    (typeof value.openViewDefaults === 'undefined' || isJsonSafePlainValue(value.openViewDefaults)) &&
    (typeof value.confidence === 'undefined' || isFlowSurfaceCapabilityConfidence(value.confidence)) &&
    (typeof value.evidence === 'undefined' || isArrayOf(value.evidence, isFlowSurfaceAutoInferredAuthoringEvidence))
  );
}

function isFlowSurfaceAutoModel(value: unknown): value is FlowSurfaceAutoModel {
  return (
    isPlainRecord(value) &&
    typeof value.modelUse === 'string' &&
    hasOptionalStringFields(value, ['className', 'loaderName', 'modelBaseClass']) &&
    (typeof value.actionScope === 'undefined' ||
      (typeof value.actionScope === 'string' && ['collection', 'record', 'both'].includes(value.actionScope))) &&
    isArrayOf(value.sourceRefs, isFlowSurfaceAutoSourceRef) &&
    isFlowSurfaceCapabilityConfidence(value.confidence)
  );
}

function isFlowSurfaceAutoMenuItem(value: unknown): value is FlowSurfaceAutoMenuItem {
  return (
    isPlainRecord(value) &&
    hasOptionalStringFields(value, [
      'label',
      'labelText',
      'labelKey',
      'labelFallback',
      'menuKey',
      'modelUse',
      'slot',
      'createModelOptionsUse',
    ]) &&
    isFlowSurfaceExtractorCreateModelOptionsStatus(value.createModelOptionsStatus) &&
    (typeof value.createModelOptionsSubModels === 'undefined' ||
      isFlowSurfaceCreateModelOptionsSubModels(value.createModelOptionsSubModels)) &&
    (typeof value.createModelOptions === 'undefined' ||
      (isJsonSafePlainValue(value.createModelOptions) &&
        isPlainRecord(value.createModelOptions) &&
        typeof value.createModelOptions.use === 'string')) &&
    (typeof value.hidden === 'undefined' || typeof value.hidden === 'boolean') &&
    isArrayOf(value.sourceRefs, isFlowSurfaceAutoSourceRef) &&
    isFlowSurfaceCapabilityConfidence(value.confidence)
  );
}

function isFlowSurfaceAutoFieldBinding(value: unknown): value is FlowSurfaceAutoFieldBinding {
  return (
    isPlainRecord(value) &&
    hasOptionalStringFields(value, ['fieldInterface', 'modelUse']) &&
    isFlowSurfaceFieldBindingRole(value.role) &&
    isArrayOf(value.sourceRefs, isFlowSurfaceAutoSourceRef) &&
    isFlowSurfaceCapabilityConfidence(value.confidence)
  );
}

function isFlowSurfaceAutoFlow(value: unknown): value is FlowSurfaceAutoFlow {
  return (
    isPlainRecord(value) &&
    hasOptionalStringFields(value, ['modelUse', 'flowKey', 'title']) &&
    (typeof value.sort === 'undefined' || (typeof value.sort === 'number' && Number.isFinite(value.sort))) &&
    (typeof value.settings === 'undefined' || isJsonSafePlainValue(value.settings)) &&
    (typeof value.configureOptions === 'undefined' || isJsonSafePlainValue(value.configureOptions)) &&
    isFlowSurfaceExtractorFlowStaticStatus(value.staticStatus) &&
    isArrayOf(value.sourceRefs, isFlowSurfaceAutoSourceRef) &&
    isFlowSurfaceCapabilityConfidence(value.confidence)
  );
}

function isFlowSurfaceAutoSourceRef(value: unknown): value is FlowSurfaceAutoSourceRef {
  return (
    isPlainRecord(value) &&
    typeof value.source === 'string' &&
    hasOptionalStringFields(value, ['ref']) &&
    (typeof value.evidenceSource === 'undefined' || isFlowSurfaceExtractorEvidenceSource(value.evidenceSource))
  );
}

function isFlowSurfaceCapabilityWarning(value: unknown): value is FlowSurfaceCapabilityWarning {
  return isPlainRecord(value) && isFlowSurfaceCapabilityWarningCode(value.code) && typeof value.message === 'string';
}

function isFlowSurfaceCapabilityConfidence(value: unknown): value is FlowSurfaceCapabilityConfidence {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isFlowSurfaceAutoCapabilityKind(value: unknown): value is FlowSurfaceCapabilityKind {
  return (
    value === 'block' ||
    value === 'action' ||
    value === 'fieldComponent' ||
    value === 'fieldBinding' ||
    value === 'fieldInterface'
  );
}

function isFlowSurfaceAutoInferredAuthoringEvidenceType(
  value: unknown,
): value is FlowSurfaceAutoInferredAuthoringEvidence['type'] {
  return (
    value === 'model' ||
    value === 'menuItem' ||
    value === 'flow' ||
    value === 'fieldBinding' ||
    value === 'ast' ||
    value === 'runtimeMock' ||
    value === 'coreTemplate'
  );
}

function isFlowSurfaceAutoChildSurfaceKind(value: unknown): value is FlowSurfaceAutoChildSurface['kind'] {
  return value === 'block' || value === 'action' || value === 'fieldComponent';
}

function isFlowSurfaceAutoPopupHostDefaultType(value: unknown): value is FlowSurfaceAutoPopupHostDefaultType {
  return value === 'addNew' || value === 'view' || value === 'edit';
}

function isFlowSurfaceExtractorEvidenceSource(value: unknown): value is FlowSurfaceExtractorEvidenceSource {
  return value === 'runtime' || value === 'ast';
}

function isFlowSurfaceExtractorCreateModelOptionsStatus(
  value: unknown,
): value is FlowSurfaceExtractorCreateModelOptionsStatus {
  return value === 'static' || value === 'dynamic' || value === 'unresolved';
}

function isFlowSurfaceExtractorFlowStaticStatus(value: unknown): value is FlowSurfaceExtractorFlowStaticStatus {
  return value === 'static' || value === 'dynamic' || value === 'unresolved';
}

function isFlowSurfaceFieldBindingRole(value: unknown): value is FlowSurfaceFieldBindingRole {
  return value === 'display' || value === 'editable' || value === 'filterable' || value === 'wrapper';
}

function isFlowSurfaceCapabilityWarningCode(value: unknown): value is FlowSurfaceCapabilityWarning['code'] {
  return (
    value === 'auto-discovered-readonly' ||
    value === 'manifest-recommended' ||
    value === 'dynamic-create-options' ||
    value === 'partial-settings-schema' ||
    value === 'public-type-conflict' ||
    value === 'unsafe-semantic-text' ||
    value === 'extractor-runtime-error' ||
    value === 'snapshot-stale' ||
    value === 'contract-not-verified' ||
    value === 'readback-parity-missing'
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return _.isPlainObject(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFlowSurfaceCreateModelOptionsSubModels(
  value: unknown,
): value is FlowSurfaceAutoMenuItem['createModelOptionsSubModels'] {
  return isPlainRecord(value) && Object.values(value).every((items) => isArrayOf(items, isString));
}

function hasCreateModelOptionsSubModels(
  value: unknown,
): value is FlowSurfaceAutoMenuItem['createModelOptionsSubModels'] {
  return isFlowSurfaceCreateModelOptionsSubModels(value) && Object.keys(value).length > 0;
}

function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

function hasOptionalStringFields(value: Record<string, unknown>, fields: readonly string[]) {
  return fields.every((field) => typeof value[field] === 'undefined' || typeof value[field] === 'string');
}

function isJsonSafePlainValue(value: unknown, seen: WeakSet<object> = new WeakSet()): boolean {
  if (
    typeof value === 'undefined' ||
    typeof value === 'function' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint'
  ) {
    return false;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonSafePlainValue(item, seen));
  }
  if (!isPlainRecord(value)) {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  return Object.entries(value).every(([key, item]) => key.length > 0 && isJsonSafePlainValue(item, seen));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function collectAutoModels(events: FlowSurfaceExtractionEvent[]): FlowSurfaceAutoModel[] {
  const models = new Map<string, FlowSurfaceAutoModel>();
  events.forEach((event) => {
    if (event.type !== 'model.registered' && event.type !== 'model.loaderRegistered') {
      return;
    }
    const existing = models.get(event.modelUse);
    const sourceRef = buildSourceRef(event.source, event.evidenceSource);
    if (!existing) {
      models.set(event.modelUse, {
        modelUse: event.modelUse,
        ...(event.type === 'model.registered' && event.className ? { className: event.className } : {}),
        ...(event.type === 'model.loaderRegistered' && event.loaderName ? { loaderName: event.loaderName } : {}),
        sourceRefs: [sourceRef],
        confidence: event.confidence,
      });
      return;
    }
    if (event.type === 'model.registered' && event.className && !existing.className) {
      existing.className = event.className;
    }
    if (event.type === 'model.loaderRegistered' && event.loaderName && !existing.loaderName) {
      existing.loaderName = event.loaderName;
    }
    existing.sourceRefs = appendSourceRef(existing.sourceRefs, sourceRef);
    existing.confidence = maxConfidence(existing.confidence, event.confidence);
  });
  events.forEach((event) => {
    if (event.type !== 'model.classDeclared') {
      return;
    }
    const existing = models.get(event.modelUse);
    if (!existing) {
      models.set(event.modelUse, {
        modelUse: event.modelUse,
        modelBaseClass: event.modelBaseClass,
        ...(event.actionScope ? { actionScope: event.actionScope } : {}),
        sourceRefs: [buildSourceRef(event.source, event.evidenceSource)],
        confidence: event.confidence,
      });
      return;
    }
    if (!existing.modelBaseClass) {
      existing.modelBaseClass = event.modelBaseClass;
    }
    if (!existing.actionScope && event.actionScope) {
      existing.actionScope = event.actionScope;
    }
    existing.sourceRefs = appendSourceRef(existing.sourceRefs, buildSourceRef(event.source, event.evidenceSource));
    existing.confidence = maxConfidence(existing.confidence, event.confidence);
  });
  return Array.from(models.values()).sort((left, right) => left.modelUse.localeCompare(right.modelUse));
}

function collectAutoMenuItems(events: FlowSurfaceExtractionEvent[]): FlowSurfaceAutoMenuItem[] {
  const menuItems = new Map<string, FlowSurfaceAutoMenuItem>();
  events.forEach((event) => {
    if (event.type !== 'menu.itemRegistered') {
      return;
    }
    const key = [event.menuKey, event.modelUse, event.slot].filter(Boolean).join('::');
    const existing = menuItems.get(key);
    const sourceRef = buildSourceRef(event.source, event.evidenceSource);
    if (!existing) {
      menuItems.set(key, {
        ...(event.menuKey ? { menuKey: event.menuKey } : {}),
        ...pickLabelFields(event),
        ...(event.modelUse ? { modelUse: event.modelUse } : {}),
        ...(event.slot ? { slot: event.slot } : {}),
        createModelOptionsStatus: event.createModelOptionsStatus,
        ...(event.createModelOptionsUse ? { createModelOptionsUse: event.createModelOptionsUse } : {}),
        ...(hasCreateModelOptionsSubModels(event.createModelOptionsSubModels)
          ? { createModelOptionsSubModels: event.createModelOptionsSubModels }
          : {}),
        ...(event.createModelOptions ? { createModelOptions: event.createModelOptions } : {}),
        ...(typeof event.hidden === 'boolean' ? { hidden: event.hidden } : {}),
        sourceRefs: [sourceRef],
        confidence: event.confidence,
      });
      return;
    }
    existing.sourceRefs = appendSourceRef(existing.sourceRefs, sourceRef);
    existing.confidence = maxConfidence(existing.confidence, event.confidence);
    existing.createModelOptionsStatus = mergeCreateModelOptionsStatus(
      existing.createModelOptionsStatus,
      event.createModelOptionsStatus,
    );
    existing.createModelOptionsUse = mergeCreateModelOptionsUse(
      existing.createModelOptionsUse,
      event.createModelOptionsUse,
    );
    existing.createModelOptionsSubModels = mergeCreateModelOptionsSubModels(
      existing.createModelOptionsSubModels,
      event.createModelOptionsSubModels,
    );
    existing.createModelOptions = mergeCreateModelOptions(existing.createModelOptions, event.createModelOptions);
    existing.hidden = existing.hidden === true || event.hidden === true;
    mergeLabelFields(existing, event);
  });
  return Array.from(menuItems.values()).sort((left, right) =>
    String(left.menuKey || left.modelUse || '').localeCompare(String(right.menuKey || right.modelUse || '')),
  );
}

function collectAutoFieldBindings(events: FlowSurfaceExtractionEvent[]): FlowSurfaceAutoFieldBinding[] {
  const bindings = new Map<string, FlowSurfaceAutoFieldBinding>();
  events.forEach((event) => {
    if (event.type !== 'field.bindingRegistered') {
      return;
    }
    const key = [event.role, event.fieldInterface, event.modelUse].filter(Boolean).join('::');
    const existing = bindings.get(key);
    const sourceRef = buildSourceRef(event.source, event.evidenceSource);
    if (!existing) {
      bindings.set(key, {
        ...(event.fieldInterface ? { fieldInterface: event.fieldInterface } : {}),
        ...(event.modelUse ? { modelUse: event.modelUse } : {}),
        role: event.role,
        sourceRefs: [sourceRef],
        confidence: event.confidence,
      });
      return;
    }
    existing.sourceRefs = appendSourceRef(existing.sourceRefs, sourceRef);
    existing.confidence = maxConfidence(existing.confidence, event.confidence);
  });
  return Array.from(bindings.values()).sort((left, right) =>
    [left.role, left.fieldInterface || '', left.modelUse || '']
      .join('::')
      .localeCompare([right.role, right.fieldInterface || '', right.modelUse || ''].join('::')),
  );
}

function collectAutoFlows(events: FlowSurfaceExtractionEvent[]): FlowSurfaceAutoFlow[] {
  const flows = new Map<string, FlowSurfaceAutoFlow>();
  events.forEach((event) => {
    if (event.type !== 'model.flowRegistered') {
      return;
    }
    const key = [event.modelUse, event.flowKey].filter(Boolean).join('::');
    const existing = flows.get(key);
    const sourceRef = buildSourceRef(event.source, event.evidenceSource);
    if (!existing) {
      flows.set(key, {
        ...(event.modelUse ? { modelUse: event.modelUse } : {}),
        ...(event.flowKey ? { flowKey: event.flowKey } : {}),
        ...(event.title ? { title: event.title } : {}),
        ...(typeof event.sort === 'number' ? { sort: event.sort } : {}),
        ...(event.settings?.length ? { settings: event.settings } : {}),
        ...(event.configureOptions && Object.keys(event.configureOptions).length
          ? { configureOptions: event.configureOptions }
          : {}),
        staticStatus: event.staticStatus,
        sourceRefs: [sourceRef],
        confidence: event.confidence,
      });
      return;
    }
    existing.sourceRefs = appendSourceRef(existing.sourceRefs, sourceRef);
    existing.confidence = maxConfidence(existing.confidence, event.confidence);
    existing.staticStatus = mergeStaticStatus(existing.staticStatus, event.staticStatus);
    if (!existing.title && event.title) {
      existing.title = event.title;
    }
    if (typeof existing.sort !== 'number' && typeof event.sort === 'number') {
      existing.sort = event.sort;
    }
    existing.settings = mergeFlowSettings(existing.settings, event.settings);
    existing.configureOptions = {
      ...(existing.configureOptions || {}),
      ...(event.configureOptions || {}),
    };
  });
  return Array.from(flows.values()).sort((left, right) =>
    [left.modelUse || '', left.flowKey || '']
      .join('::')
      .localeCompare([right.modelUse || '', right.flowKey || ''].join('::')),
  );
}

function mergeFlowSettings(
  left: FlowSurfaceAutoFlow['settings'],
  right: FlowSurfaceAutoFlow['settings'],
): FlowSurfaceAutoFlow['settings'] {
  const settings = new Map((left || []).map((item) => [item.key, item]));
  (right || []).forEach((item) => settings.set(item.key, item));
  return settings.size ? Array.from(settings.values()) : undefined;
}

function upsertCandidate(
  candidates: Map<string, FlowSurfaceAutoCapabilityCandidate>,
  input: {
    snapshot: FlowSurfaceAutoSnapshot;
    modelUse: string;
    kind: FlowSurfaceCapabilityKind;
    label: string;
    evidence: FlowSurfaceAutoCapabilityCandidate['evidence'][number];
    confidence: FlowSurfaceCapabilityConfidence;
  },
) {
  const key = getCandidateKey(input.snapshot.plugin, input.modelUse, input.kind);
  const existing = candidates.get(key);
  const publicType = buildAutoNamespacedPublicType(input.snapshot.plugin, input.modelUse);
  const warning: FlowSurfaceCapabilityWarning = {
    code: 'auto-discovered-readonly',
    message: 'Auto snapshot discovery is read-only until a manifest or provider declares an authoring contract.',
  };
  if (!existing) {
    candidates.set(key, {
      kind: input.kind,
      publicType,
      label: input.label,
      modelUse: input.modelUse,
      ownerPlugin: input.snapshot.plugin,
      origin: 'autoSnapshot',
      confidence: input.confidence,
      evidence: [input.evidence],
      warnings: [warning],
    });
    return;
  }
  existing.confidence = maxConfidence(existing.confidence, input.confidence);
  if (
    !existing.evidence.some((evidence) => evidence.type === input.evidence.type && evidence.ref === input.evidence.ref)
  ) {
    existing.evidence.push(input.evidence);
  }
}

function disambiguateAutoPublicTypeCollisions(candidates: FlowSurfaceAutoCapabilityCandidate[]) {
  const initialGroups = groupCandidatesByPublicType(candidates);
  initialGroups.forEach((group) => {
    if (group.length < 2) {
      return;
    }
    group.forEach((candidate) => {
      candidate.publicType = `${candidate.publicType}${_.upperFirst(_.camelCase(candidate.kind))}`;
      candidate.warnings = appendPublicTypeConflictWarning(candidate.warnings);
    });
  });

  const remainingGroups = groupCandidatesByPublicType(candidates);
  remainingGroups.forEach((group) => {
    if (group.length < 2) {
      return;
    }
    group.forEach((candidate) => {
      candidate.publicType = `${candidate.publicType}${getModelUsePublicTypeSuffix(candidate.modelUse)}`;
      candidate.warnings = appendPublicTypeConflictWarning(candidate.warnings);
    });
  });
  return candidates;
}

function groupCandidatesByPublicType(candidates: FlowSurfaceAutoCapabilityCandidate[]) {
  const groups = new Map<string, FlowSurfaceAutoCapabilityCandidate[]>();
  candidates.forEach((candidate) => {
    const group = groups.get(candidate.publicType) || [];
    group.push(candidate);
    groups.set(candidate.publicType, group);
  });
  return groups;
}

function getModelUsePublicTypeSuffix(modelUse: string) {
  return _.upperFirst(_.camelCase(modelUse.replace(/Model$/, ''))) || 'Capability';
}

function appendPublicTypeConflictWarning(warnings: FlowSurfaceCapabilityWarning[]) {
  return appendWarningOnce(warnings, {
    code: 'public-type-conflict',
    message:
      'Auto snapshot fallback public type was disambiguated because another discovered model normalized to the same token.',
  });
}

function appendWarningOnce(
  warnings: FlowSurfaceCapabilityWarning[],
  warning: FlowSurfaceCapabilityWarning,
): FlowSurfaceCapabilityWarning[] {
  if (warnings.some((item) => item.code === warning.code && item.message === warning.message)) {
    return warnings;
  }
  return [...warnings, warning];
}

function resolveCandidateConfidence(input: {
  model?: FlowSurfaceAutoModel;
  menuItems: FlowSurfaceAutoMenuItem[];
  flows: FlowSurfaceAutoFlow[];
}): FlowSurfaceCapabilityConfidence {
  const sourceTypes = new Set(
    [
      ...(input.model?.sourceRefs || []),
      ...input.menuItems.flatMap((item) => item.sourceRefs),
      ...input.flows.flatMap((flow) => flow.sourceRefs),
    ]
      .map((sourceRef) => sourceRef.evidenceSource)
      .filter(Boolean),
  );
  const hasStaticPlacementEvidence =
    input.menuItems.some((item) => item.createModelOptionsStatus === 'static') ||
    input.flows.some((flow) => flow.staticStatus === 'static');
  if (sourceTypes.has('runtime') && sourceTypes.has('ast') && hasStaticPlacementEvidence) {
    return 'high';
  }
  if (hasStaticPlacementEvidence) {
    return 'medium';
  }
  return 'low';
}

function groupByModelUse<T extends { modelUse?: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    if (!item.modelUse) {
      return;
    }
    const group = groups.get(item.modelUse) || [];
    group.push(item);
    groups.set(item.modelUse, group);
  });
  return groups;
}

function inferKindFromSlotOrModel(slot: string | undefined, modelUse: string): FlowSurfaceCapabilityKind | undefined {
  switch (slot) {
    case 'actions':
    case 'recordActions':
      return 'action';
    case 'fields':
    case 'fieldComponents':
      return 'fieldComponent';
    case 'blocks':
      return 'block';
    default:
      return inferKindFromModelUse(modelUse);
  }
}

function inferKindFromModelUse(modelUse: string): FlowSurfaceCapabilityKind | undefined {
  if (/(?:Action|ActionGroup)Model$/.test(modelUse)) {
    return 'action';
  }
  if (/FieldModel$/.test(modelUse)) {
    return 'fieldComponent';
  }
  if (/(?:Item|Column|FieldGroup)Model$/.test(modelUse)) {
    return 'fieldComponent';
  }
  if (/BlockModel$/.test(modelUse)) {
    return 'block';
  }
  if (/BindingModel$/.test(modelUse)) {
    return 'fieldBinding';
  }
  return undefined;
}

function getCandidateKey(plugin: string, modelUse: string, kind: FlowSurfaceCapabilityKind) {
  return [plugin, kind, modelUse].join('::');
}

function toReadableLabel(modelUse: string) {
  return _.startCase(stripModelSuffix(modelUse));
}

function stripModelSuffix(modelUse: string) {
  if (/ActionGroupModel$/.test(modelUse)) {
    return modelUse.replace(/Model$/, '');
  }
  return modelUse.replace(/(FieldGroup|Block|Action|Field|Binding|Item|Column)?Model$/, '');
}

function pickLabelFields(source: FlowSurfaceExtractorLabelFields): FlowSurfaceExtractorLabelFields {
  return {
    ...(source.label ? { label: source.label } : {}),
    ...(source.labelText ? { labelText: source.labelText } : {}),
    ...(source.labelKey ? { labelKey: source.labelKey } : {}),
    ...(source.labelFallback ? { labelFallback: source.labelFallback } : {}),
  };
}

function mergeLabelFields(target: FlowSurfaceAutoMenuItem, source: FlowSurfaceExtractorLabelFields) {
  if (source.label && (!target.label || target.label === target.labelKey)) {
    target.label = source.label;
  }
  if (!target.labelText && source.labelText) {
    target.labelText = source.labelText;
  }
  if (!target.labelKey && source.labelKey) {
    target.labelKey = source.labelKey;
  }
  if (source.labelFallback && (!target.labelFallback || target.labelFallback === target.labelKey)) {
    target.labelFallback = source.labelFallback;
  }
}

function getDisplayLabel(source: FlowSurfaceExtractorLabelFields) {
  return source.labelText || source.labelFallback || source.label || source.labelKey;
}

function buildSourceRef(
  source: string,
  evidenceSource: FlowSurfaceAutoSourceRef['evidenceSource'],
): FlowSurfaceAutoSourceRef {
  return {
    source,
    ...(evidenceSource ? { evidenceSource } : {}),
  };
}

function appendSourceRef(
  sourceRefs: FlowSurfaceAutoSourceRef[],
  sourceRef: FlowSurfaceAutoSourceRef,
): FlowSurfaceAutoSourceRef[];
function appendSourceRef(sourceRefs: FlowSurfaceAutoSourceRef[], sourceRef: FlowSurfaceAutoSourceRef) {
  if (
    sourceRefs.some(
      (item) =>
        item.source === sourceRef.source &&
        item.ref === sourceRef.ref &&
        item.evidenceSource === sourceRef.evidenceSource,
    )
  ) {
    return sourceRefs;
  }
  return [...sourceRefs, sourceRef];
}

function maxConfidence(left: FlowSurfaceCapabilityConfidence, right: FlowSurfaceCapabilityConfidence) {
  return CONFIDENCE_RANK[left] >= CONFIDENCE_RANK[right] ? left : right;
}

function mergeCreateModelOptionsStatus(
  left: FlowSurfaceAutoMenuItem['createModelOptionsStatus'],
  right: FlowSurfaceAutoMenuItem['createModelOptionsStatus'],
) {
  if (left === 'dynamic' || right === 'dynamic') {
    return 'dynamic';
  }
  if (left === 'static' || right === 'static') {
    return 'static';
  }
  return 'unresolved';
}

function mergeCreateModelOptionsUse(left: string | undefined, right: string | undefined) {
  if (!left) {
    return right;
  }
  if (!right || right === left) {
    return left;
  }
  return undefined;
}

function mergeCreateModelOptionsSubModels(
  left: FlowSurfaceAutoMenuItem['createModelOptionsSubModels'],
  right: FlowSurfaceAutoMenuItem['createModelOptionsSubModels'],
) {
  if (!hasCreateModelOptionsSubModels(left)) {
    return hasCreateModelOptionsSubModels(right) ? right : undefined;
  }
  if (!hasCreateModelOptionsSubModels(right)) {
    return left;
  }
  const merged: NonNullable<FlowSurfaceAutoMenuItem['createModelOptionsSubModels']> = {};
  Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).forEach((key) => {
    const values = Array.from(new Set([...(left[key] || []), ...(right[key] || [])]));
    if (values.length) {
      merged[key] = values;
    }
  });
  return hasCreateModelOptionsSubModels(merged) ? merged : undefined;
}

function mergeCreateModelOptions(
  left: FlowSurfaceAutoMenuItem['createModelOptions'],
  right: FlowSurfaceAutoMenuItem['createModelOptions'],
) {
  if (!left) {
    return right;
  }
  if (!right || _.isEqual(left, right)) {
    return left;
  }
  return undefined;
}

function mergeStaticStatus(left: FlowSurfaceAutoFlow['staticStatus'], right: FlowSurfaceAutoFlow['staticStatus']) {
  if (left === 'dynamic' || right === 'dynamic') {
    return 'dynamic';
  }
  if (left === 'static' || right === 'static') {
    return 'static';
  }
  return 'unresolved';
}

function dedupeWarnings(warnings: FlowSurfaceCapabilityWarning[]) {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = [warning.code, warning.message].join('::');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
