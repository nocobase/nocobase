/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Transaction } from '@nocobase/database';
import {
  VscError,
  buildRunJSOwnerFingerprint,
  type RunJSLanguage,
  type RunJSLegacySource,
  type RunJSPublishedWriteResult,
  type RunJSRuntimeArtifact,
  type RunJSSourceAdapter,
  type RunJSSourceAdapterContext,
  type RunJSSourceLocator,
  type RunJSSourcePermissionResult,
  type RunJSSurfaceStyle,
} from '@nocobase/plugin-vsc-file';

import FlowModelRepository from '../repository';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type FlowModelNestedLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.nestedRunJS' }>;
type ChartLocator = Extract<RunJSSourceLocator, { kind: 'chart.option' | 'chart.events' }>;
type JsonRecord = Record<string, unknown>;
type JsonPath = Array<string | number>;

const RENDER_MODEL_USES = new Set([
  'JSBlockModel',
  'JSFieldModel',
  'JSEditableFieldModel',
  'JSItemModel',
  'JSColumnModel',
  'JSItemActionModel',
]);

const ACTION_MODEL_USES = new Set([
  'JSActionModel',
  'JSRecordActionModel',
  'JSCollectionActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
]);

const CHART_OPTION_RAW_PATH = ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'];
const CHART_EVENTS_RAW_PATH = ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'];

export function createFlowModelRunJSSourceAdapters(db: Database): RunJSSourceAdapter[] {
  return [
    createFlowModelStepAdapter(db),
    createFlowModelNestedRunJSAdapter(db),
    createChartAdapter(db, 'chart.option'),
    createChartAdapter(db, 'chart.events'),
  ];
}

function createFlowModelStepAdapter(db: Database): RunJSSourceAdapter<FlowModelStepLocator> {
  return {
    kind: 'flowModel.step',
    async assertCanRead({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'findOne', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const stepPath = ['stepParams', locator.flowKey, locator.stepKey];
      const step = getAtPath(model, stepPath);
      const codeValue = getAtPath(step, locator.paramPath);
      const versionPath = resolveVersionPath(locator.paramPath, locator.versionPath);
      const versionValue = getAtPath(step, versionPath);
      const code = typeof codeValue === 'string' ? codeValue : '';
      const version = typeof versionValue === 'string' && versionValue ? versionValue : 'v2';

      return {
        code,
        version,
        label: buildFlowModelLabel(model, `${locator.flowKey}.${locator.stepKey}`),
        surfaceStyle: inferStepSurfaceStyle(model),
        language: inferLanguage(version),
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        ownerFingerprint: buildStepFingerprint(locator, model),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildStepFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writePublished({ locator, artifact, commitId, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertOwnerFingerprintMatches(buildStepFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextStepParams = cloneJsonRecord(getAtPath(model, ['stepParams']));
      const versionPath = resolveVersionPath(locator.paramPath, locator.versionPath);

      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...locator.paramPath], artifact.code);
      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...versionPath], artifact.version);
      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...resolveSourceRefPath(locator.paramPath)], {
        type: 'vsc-file',
        repoId: readMetadataString(artifact, 'repoId'),
        publishedCommitId: commitId,
        entry: artifact.entryPath || 'src/main.tsx',
      });

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

function createFlowModelNestedRunJSAdapter(db: Database): RunJSSourceAdapter<FlowModelNestedLocator> {
  return {
    kind: 'flowModel.nestedRunJS',
    async assertCanRead({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'findOne', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const source = readNestedSource(model, locator);

      return {
        code: source.code,
        version: source.version,
        label: buildFlowModelLabel(model, locator.scene || formatPath(locator.valuePath)),
        surfaceStyle: inferNestedSurfaceStyle(locator, source.originalValue),
        language: inferLanguage(source.version),
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        ownerFingerprint: buildNestedFingerprint(locator, model),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildNestedFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writePublished({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertOwnerFingerprintMatches(buildNestedFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextStepParams = cloneJsonRecord(getAtPath(model, ['stepParams']));
      const containerPath = [locator.containerFlowKey, locator.containerStepKey];
      const targetPath = [...containerPath, ...locator.valuePath];
      const originalValue = getAtPath(nextStepParams, targetPath);

      setAtPath(nextStepParams, targetPath, replaceNestedRunJSValue(originalValue, artifact));

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

function createChartAdapter(db: Database, kind: ChartLocator['kind']): RunJSSourceAdapter<ChartLocator> {
  return {
    kind,
    async assertCanRead({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'findOne', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const raw = getAtPath(model, getChartRawPath(locator.kind));
      const code = typeof raw === 'string' ? raw : '';

      return {
        code,
        version: 'v2',
        label: buildFlowModelLabel(model, locator.kind === 'chart.option' ? 'Chart option' : 'Chart events'),
        surfaceStyle: locator.kind === 'chart.option' ? 'value' : 'action',
        language: 'javascript',
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        ownerFingerprint: buildChartFingerprint(locator, model),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildChartFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writePublished({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertOwnerFingerprintMatches(buildChartFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextStepParams = cloneJsonRecord(getAtPath(model, ['stepParams']));
      const rawPathInStepParams = getChartRawPath(locator.kind).slice(1);

      setAtPath(nextStepParams, rawPathInStepParams, artifact.code);

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

async function loadFlowModel(db: Database, modelUid: string, ctx: RunJSSourceAdapterContext): Promise<JsonRecord> {
  const model = await getFlowModelRepository(db).findModelById(modelUid, {
    includeAsyncNode: true,
    transaction: ctx.transaction as Transaction | undefined,
  });

  if (!isRecord(model)) {
    throw new VscError('RUNJS_SOURCE_NOT_FOUND', `FlowModel "${modelUid}" was not found`, {
      details: {
        modelUid,
      },
    });
  }

  return model;
}

function getFlowModelRepository(db: Database): FlowModelRepository {
  return db.getCollection('flowModels').repository as FlowModelRepository;
}

async function lockFlowModelForUpdate(db: Database, modelUid: string, transaction: Transaction): Promise<void> {
  await db.getCollection('flowModels').model.findByPk(modelUid, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

async function assertFlowModelPermission(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  modelUid: string,
  action: 'findOne' | 'save',
  fields: string[],
): Promise<void> {
  const permission = requireSourcePermission(ctx, 'flowModels', action);
  assertPermissionAllowsFields(permission, fields, 'flowModels', action);
  await assertRecordMatchesPermissionFilter(db, ctx, 'flowModels', modelUid, permission);
}

function requireSourcePermission(
  ctx: RunJSSourceAdapterContext,
  resource: string,
  action: string,
): RunJSSourcePermissionResult {
  const permission = ctx.can?.({ resource, action });
  if (permission) {
    return permission;
  }

  throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} permission`, {
    details: {
      resource,
      action,
    },
  });
}

async function assertRecordMatchesPermissionFilter(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  resource: string,
  filterByTk: string,
  permission: RunJSSourcePermissionResult,
): Promise<void> {
  const filter = await parsePermissionFilter(db, ctx, resource, permission.params?.filter);
  if (!filter) {
    return;
  }

  const record = await db.getRepository(resource).findOne({
    filterByTk,
    filter,
    transaction: ctx.transaction as Transaction | undefined,
  });
  if (record) {
    return;
  }

  throw new VscError('PERMISSION_DENIED', `RunJS source owner is outside ${resource} permission scope`, {
    details: {
      resource,
      filterByTk,
    },
  });
}

async function parsePermissionFilter(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  resource: string,
  filter: unknown,
): Promise<unknown> {
  if (!filter) {
    return undefined;
  }

  try {
    checkFilterParams(db.getCollection(resource), filter);
    return (
      (await parseJsonTemplate(filter, {
        state: ctx.state || {},
        timezone: ctx.timezone,
        userProvider: createUserProvider({
          db,
          currentUser: ctx.currentUser,
        }),
      })) ?? filter
    );
  } catch (error) {
    if (error instanceof NoPermissionError) {
      throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource} permission scope`, {
        details: {
          resource,
        },
      });
    }
    throw error;
  }
}

function assertPermissionAllowsFields(
  permission: RunJSSourcePermissionResult,
  fields: string[],
  resource: string,
  action: string,
): void {
  const whitelist = toStringList(permission.params?.whitelist || permission.params?.fields);
  if (whitelist && fields.some((field) => !whitelist.includes(field))) {
    throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} field permission`, {
      details: {
        resource,
        action,
        fields,
      },
    });
  }

  const blacklist = toStringList(permission.params?.blacklist);
  if (blacklist && fields.some((field) => blacklist.includes(field))) {
    throw new VscError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} field permission`, {
      details: {
        resource,
        action,
        fields,
      },
    });
  }
}

function toStringList(value: unknown): string[] | null {
  if (typeof value === 'string' && value) {
    return [value];
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  return null;
}

function buildStepFingerprint(locator: FlowModelStepLocator, model: JsonRecord): string {
  const step = getAtPath(model, ['stepParams', locator.flowKey, locator.stepKey]);
  const versionPath = resolveVersionPath(locator.paramPath, locator.versionPath);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      flowKey: locator.flowKey,
      stepKey: locator.stepKey,
      paramPath: locator.paramPath,
      versionPath,
      ownerState: step,
    },
    selectedLegacyValue: getAtPath(step, locator.paramPath),
    selectedVersion: getAtPath(step, versionPath),
  });
}

function buildNestedFingerprint(locator: FlowModelNestedLocator, model: JsonRecord): string {
  const source = readNestedSource(model, locator);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      containerFlowKey: locator.containerFlowKey,
      containerStepKey: locator.containerStepKey,
      valuePath: locator.valuePath,
      scene: locator.scene,
      ownerState: getAtPath(model, ['stepParams', locator.containerFlowKey, locator.containerStepKey]),
    },
    selectedLegacyValue: source.originalValue,
    selectedVersion: source.version,
  });
}

function buildChartFingerprint(locator: ChartLocator, model: JsonRecord): string {
  const raw = getAtPath(model, getChartRawPath(locator.kind));

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      kind: locator.kind,
      rawPath: getChartRawPath(locator.kind),
      ownerState: getAtPath(model, getChartRawPath(locator.kind).slice(0, -1)),
    },
    selectedLegacyValue: raw,
    selectedVersion: 'v2',
  });
}

function assertOwnerFingerprintMatches(current: string, expected: string, kind: string): void {
  if (current === expected) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source owner was changed by another writer', {
    details: {
      expected: current,
      received: expected,
      kind,
    },
  });
}

function getFlowModelFingerprintOwner(model: JsonRecord): JsonRecord {
  return {
    modelUid: typeof model.uid === 'string' ? model.uid : null,
    use: typeof model.use === 'string' ? model.use : null,
  };
}

function readNestedSource(model: JsonRecord, locator: FlowModelNestedLocator) {
  const value = getAtPath(model, [
    'stepParams',
    locator.containerFlowKey,
    locator.containerStepKey,
    ...locator.valuePath,
  ]);

  if (isRecord(value)) {
    if (typeof value.code === 'string') {
      return {
        code: value.code,
        version: typeof value.version === 'string' && value.version ? value.version : 'v2',
        originalValue: value,
      };
    }
    if (typeof value.script === 'string') {
      return {
        code: value.script,
        version: typeof value.version === 'string' && value.version ? value.version : 'v2',
        originalValue: value,
      };
    }
  }

  return {
    code: typeof value === 'string' ? value : '',
    version: 'v2',
    originalValue: value,
  };
}

function replaceNestedRunJSValue(value: unknown, artifact: RunJSRuntimeArtifact): unknown {
  if (isRecord(value)) {
    if (typeof value.code === 'string' || Object.prototype.hasOwnProperty.call(value, 'version')) {
      return {
        ...value,
        code: artifact.code,
        version: artifact.version,
      };
    }
    if (typeof value.script === 'string') {
      return {
        ...value,
        script: artifact.code,
      };
    }
  }

  return artifact.code;
}

function resolveVersionPath(paramPath: string[], versionPath?: string[]): string[] {
  if (versionPath?.length) {
    return versionPath;
  }
  if (paramPath.length > 1) {
    return [...paramPath.slice(0, -1), 'version'];
  }

  return ['version'];
}

function resolveSourceRefPath(paramPath: string[]): string[] {
  if (paramPath.length > 1) {
    return [...paramPath.slice(0, -1), 'sourceRef'];
  }

  return ['sourceRef'];
}

function inferStepSurfaceStyle(model: JsonRecord): RunJSSurfaceStyle {
  const use = typeof model.use === 'string' ? model.use : '';
  if (RENDER_MODEL_USES.has(use)) {
    return 'render';
  }
  if (ACTION_MODEL_USES.has(use)) {
    return 'action';
  }

  return 'value';
}

function inferNestedSurfaceStyle(locator: FlowModelNestedLocator, value: unknown): RunJSSurfaceStyle {
  const scene = locator.scene.toLowerCase();
  if (scene.includes('event') || scene.includes('linkage') || (isRecord(value) && typeof value.script === 'string')) {
    return 'action';
  }

  return 'value';
}

function inferLanguage(version: string): RunJSLanguage {
  return version === 'jsx'
    ? 'jsx'
    : version === 'javascript' || version === 'workflow-js'
      ? 'javascript'
      : 'typescript';
}

function buildFlowModelLabel(model: JsonRecord, fallback: string): string {
  const title = typeof model.title === 'string' && model.title.trim() ? model.title.trim() : null;
  const use = typeof model.use === 'string' && model.use.trim() ? model.use.trim() : 'FlowModel';

  return title ? `${title} / ${fallback}` : `${use} / ${fallback}`;
}

function getChartRawPath(kind: ChartLocator['kind']): string[] {
  return kind === 'chart.option' ? CHART_OPTION_RAW_PATH : CHART_EVENTS_RAW_PATH;
}

function readMetadataString(artifact: RunJSRuntimeArtifact, key: string): string | null {
  const value = artifact.metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function buildWriteResult(ownerFingerprint: string): RunJSPublishedWriteResult {
  return {
    ownerFingerprint,
  };
}

function requireTransaction(ctx: RunJSSourceAdapterContext): Transaction {
  if (!ctx.transaction) {
    throw new VscError('INTERNAL_ERROR', 'RunJS source adapter writes require a transaction');
  }

  return ctx.transaction as Transaction;
}

function getAtPath(root: unknown, path: JsonPath): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
      continue;
    }
    if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function setAtPath(root: JsonRecord, path: JsonPath, value: unknown): void {
  let current: unknown = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const nextSegment = path[index + 1];
    const nextValue = getChild(current, segment);
    const replacement =
      Array.isArray(nextValue) || isRecord(nextValue) ? nextValue : typeof nextSegment === 'number' ? [] : {};

    setChild(current, segment, replacement);
    current = replacement;
  }

  setChild(current, path[path.length - 1], value);
}

function getChild(parent: unknown, segment: string | number): unknown {
  if (Array.isArray(parent) && typeof segment === 'number') {
    return parent[segment];
  }
  if (isRecord(parent) && typeof segment === 'string') {
    return parent[segment];
  }

  return undefined;
}

function setChild(parent: unknown, segment: string | number, value: unknown): void {
  if (Array.isArray(parent) && typeof segment === 'number') {
    parent[segment] = value;
    return;
  }
  if (isRecord(parent) && typeof segment === 'string') {
    parent[segment] = value;
  }
}

function cloneJsonRecord(value: unknown): JsonRecord {
  if (!isRecord(value)) {
    return {};
  }

  return JSON.parse(JSON.stringify(value)) as JsonRecord;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatPath(path: JsonPath): string {
  return path.map((segment) => String(segment)).join('.');
}
