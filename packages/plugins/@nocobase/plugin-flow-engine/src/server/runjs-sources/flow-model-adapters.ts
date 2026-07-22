/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Filter, Transaction } from '@nocobase/database';
import {
  buildRunJSOwnerFingerprint,
  RunJSSourceError,
  type RunJSLanguage,
  type RunJSLegacySource,
  type RunJSExternalSourceBinding,
  type RunJSRuntimeArtifact,
  type RunJSRuntimeWriteResult,
  type RunJSSourceAdapter,
  type RunJSSourceAdapterContext,
  type RunJSSourceLocator,
  type RunJSSourcePermissionResult,
  type RunJSSurfaceStyle,
} from '@nocobase/server';

import FlowModelRepository from '../repository';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type FlowModelNestedLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.nestedRunJS' }>;
type FlowRegistryRunJSLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.flowRegistry.runjs' }>;
type ChartLocator = Extract<RunJSSourceLocator, { kind: 'chart.option' | 'chart.events' }>;
type JsonRecord = Record<string, unknown>;
type JsonPath = Array<string | number>;
type FlowModelNestedStorage = {
  rootKey: 'stepParams' | 'flowRegistry';
  targetPath: JsonPath;
};

const RENDER_MODEL_USES = new Set([
  'JSBlockModel',
  'JSPageModel',
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

const INITIALIZABLE_FLOW_MODEL_RUNJS_PATHS = new Map<string, string>([
  ...Array.from(RENDER_MODEL_USES, (modelUse) => [modelUse, 'jsSettings'] as const),
  ...Array.from(ACTION_MODEL_USES, (modelUse) => [modelUse, 'clickSettings'] as const),
]);

const CHART_OPTION_RAW_PATH = ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'];
const CHART_EVENTS_RAW_PATH = ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'];
const LEGACY_CHART_OPTION_RAW_PATH = ['settings', 'visual', 'raw'];
const LEGACY_CHART_EVENTS_RAW_PATH = ['settings', 'events', 'raw'];
const CHART_ENTRY_PATH = 'src/main.ts';
const CHART_OPTION_DEFAULT_CODE = `return {
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [],
};`;
const CHART_EVENTS_DEFAULT_CODE = `// The chart variable is the ECharts instance for this block.
// chart.on('click', (params) => {
//   ctx.message.info(params.name);
// });`;
const UNSAFE_JSON_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function createFlowModelRunJSSourceAdapters(db: Database): RunJSSourceAdapter[] {
  return [
    createFlowModelStepAdapter(db),
    createFlowModelNestedRunJSAdapter(db),
    createFlowRegistryRunJSAdapter(db),
    createChartAdapter(db, 'chart.option'),
    createChartAdapter(db, 'chart.events'),
  ];
}

function createFlowModelStepAdapter(db: Database): RunJSSourceAdapter<FlowModelStepLocator> {
  return {
    kind: 'flowModel.step',
    async assertCanRead({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'findOne', ['stepParams']);
      assertFlowModelStepSourceIsInline(await loadFlowModel(db, locator.modelUid, ctx), locator);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      assertFlowModelStepSourceIsInline(await loadFlowModel(db, locator.modelUid, ctx), locator, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertFlowModelStepSourceIsInline(model, locator, ctx);
      const { codeValue, versionValue, sourceMissing } = readFlowModelStepSource(model, locator);
      const code = typeof codeValue === 'string' ? codeValue : '';
      const version = resolveLegacyVersion(code, versionValue, sourceMissing);

      return {
        code,
        version,
        label: buildFlowModelLabel(model, `${locator.flowKey}.${locator.stepKey}`),
        surfaceStyle: inferStepSurfaceStyle(model),
        language: inferLanguage(version),
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        ownerFingerprint: buildStepFingerprint(locator, model),
        uninitialized: sourceMissing || undefined,
        metadata: modelUseMetadata(readModelUse(model)),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildStepFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writeRuntime({ locator, artifact, commitId, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertFlowModelStepSourceIsInline(model, locator, ctx);
      assertOwnerFingerprintMatches(buildStepFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextStepParams = cloneJsonRecord(getAtPath(model, ['stepParams']));
      const versionPath = resolveVersionPath(locator.paramPath, locator.versionPath);

      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...locator.paramPath], artifact.code);
      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...versionPath], artifact.version);
      setAtPath(nextStepParams, [locator.flowKey, locator.stepKey, ...resolveSourceRefPath(locator.paramPath)], {
        type: 'vsc-file',
        repoId: readMetadataString(artifact, 'repoId'),
        commitId,
        entry: artifact.entryPath || 'src/main.tsx',
      });

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
    async writeExternalBinding({ locator, binding, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['stepParams']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertOwnerFingerprintMatches(buildStepFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextStepParams = cloneJsonRecord(getAtPath(model, ['stepParams']));
      const bindingRootPath = [locator.flowKey, locator.stepKey, ...locator.paramPath.slice(0, -1)];
      assertSourceCanMoveToExternalBinding(getAtPath(nextStepParams, bindingRootPath), locator.kind);

      setAtPath(nextStepParams, [...bindingRootPath, 'sourceMode'], binding.sourceMode);
      setAtPath(nextStepParams, [...bindingRootPath, 'sourceBinding'], cloneJsonRecord(binding.sourceBinding));

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

function createFlowModelNestedRunJSAdapter(db: Database): RunJSSourceAdapter<FlowModelNestedLocator> {
  return {
    kind: 'flowModel.nestedRunJS',
    async assertCanRead({ locator, ctx }) {
      const permission = requireFlowModelPermission(ctx, 'findOne');
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const model = await loadFlowModelForNestedSource(db, locator.modelUid, ctx, permission, 'findOne');
      assertFlowModelPermissionFields(permission, 'findOne', [resolveNestedStorage(model, locator).rootKey]);
      assertFlowModelNestedSourceIsInline(model, locator);
    },
    async assertCanWrite({ locator, ctx }) {
      const permission = requireFlowModelPermission(ctx, 'save');
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const model = await loadFlowModelForNestedSource(db, locator.modelUid, ctx, permission, 'save');
      assertFlowModelPermissionFields(permission, 'save', [resolveNestedStorage(model, locator).rootKey]);
      assertFlowModelNestedSourceIsInline(model, locator);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertFlowModelNestedSourceIsInline(model, locator);
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
    async writeRuntime({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      const permission = requireFlowModelPermission(ctx, 'save');
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const initialModel = await loadFlowModelForNestedSource(db, locator.modelUid, ctx, permission, 'save');
      assertFlowModelPermissionFields(permission, 'save', [resolveNestedStorage(initialModel, locator).rootKey]);
      assertFlowModelNestedSourceIsInline(initialModel, locator);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const storage = resolveNestedStorage(model, locator);
      assertFlowModelPermissionFields(permission, 'save', [storage.rootKey]);
      assertFlowModelNestedSourceIsInline(model, locator);
      assertOwnerFingerprintMatches(buildNestedFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextRoot = cloneJsonRecord(getAtPath(model, [storage.rootKey]));
      const targetPath = storage.targetPath.slice(1);
      const originalValue = getAtPath(nextRoot, targetPath);

      setAtPath(nextRoot, targetPath, replaceNestedRunJSValue(originalValue, artifact, locator));

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, [storage.rootKey]: nextRoot }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
    async writeExternalBinding({ locator, binding, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      const permission = requireFlowModelPermission(ctx, 'save');
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const initialModel = await loadFlowModelForNestedSource(db, locator.modelUid, ctx, permission, 'save');
      assertFlowModelPermissionFields(permission, 'save', [resolveNestedStorage(initialModel, locator).rootKey]);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const storage = resolveNestedStorage(model, locator);
      assertFlowModelPermissionFields(permission, 'save', [storage.rootKey]);
      assertOwnerFingerprintMatches(buildNestedFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const nextRoot = cloneJsonRecord(getAtPath(model, [storage.rootKey]));
      const targetPath = storage.targetPath.slice(1);

      writeNestedRunJSBinding(nextRoot, targetPath, locator, binding);

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, [storage.rootKey]: nextRoot }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

function createFlowRegistryRunJSAdapter(db: Database): RunJSSourceAdapter<FlowRegistryRunJSLocator> {
  return {
    kind: 'flowModel.flowRegistry.runjs',
    async assertCanRead({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'findOne', ['flowRegistry']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async assertCanWrite({ locator, ctx }) {
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['flowRegistry']);
      await loadFlowModel(db, locator.modelUid, ctx);
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const source = readFlowRegistryRunJSSource(model, locator);

      return {
        code: source.code,
        version: 'v2',
        label: buildFlowModelLabel(model, `${locator.flowKey}.${locator.stepKey}`),
        surfaceStyle: 'action',
        language: 'typescript',
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        ownerFingerprint: buildFlowRegistryRunJSFingerprint(locator, model),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildFlowRegistryRunJSFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writeRuntime({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['flowRegistry']);
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertFlowModelPermission(db, ctx, locator.modelUid, 'save', ['flowRegistry']);
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      assertOwnerFingerprintMatches(
        buildFlowRegistryRunJSFingerprint(locator, model),
        baseOwnerFingerprint,
        locator.kind,
      );
      const nextFlowRegistry = cloneJsonRecord(getAtPath(model, ['flowRegistry']));
      const step = getAtPath(nextFlowRegistry, [locator.flowKey, 'steps', locator.stepKey]);
      if (!isRecord(step)) {
        throwNestedPathNotFound(['flowRegistry', locator.flowKey, 'steps', locator.stepKey]);
      }
      const sourcePath = resolveFlowRegistryRunJSSourcePath(step, locator.sourcePath, [
        'flowRegistry',
        locator.flowKey,
        'steps',
        locator.stepKey,
      ]);

      setAtPath(nextFlowRegistry, [locator.flowKey, 'steps', locator.stepKey, ...sourcePath], artifact.code);

      await getFlowModelRepository(db).patch(
        { uid: locator.modelUid, flowRegistry: nextFlowRegistry },
        { transaction },
      );

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

function createChartAdapter(db: Database, kind: ChartLocator['kind']): RunJSSourceAdapter<ChartLocator> {
  return {
    kind,
    async assertCanRead({ locator, ctx }) {
      await assertChartFlowModelPermission(db, ctx, locator, 'findOne');
    },
    async assertCanWrite({ locator, ctx }) {
      await assertChartFlowModelPermission(db, ctx, locator, 'save');
    },
    async readLegacy({ locator, ctx }) {
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const rawPath = resolveChartRawPath(model, locator.kind);
      const raw = getAtPath(model, rawPath);
      const code = typeof raw === 'string' ? raw : getChartDefaultCode(locator.kind);

      return {
        code,
        version: 'v2',
        label: buildFlowModelLabel(model, locator.kind === 'chart.option' ? 'Chart option' : 'Chart events'),
        surfaceStyle: locator.kind === 'chart.option' ? 'value' : 'action',
        language: 'javascript',
        entryPath: CHART_ENTRY_PATH,
        entry: CHART_ENTRY_PATH,
        ownerFingerprint: buildChartFingerprint(locator, model),
        metadata: modelUseMetadata(getChartAuthoringModelUse(locator.kind)),
      };
    },
    async getFingerprint({ locator, ctx }) {
      return buildChartFingerprint(locator, await loadFlowModel(db, locator.modelUid, ctx));
    },
    async writeRuntime({ locator, artifact, baseOwnerFingerprint, ctx }) {
      const transaction = requireTransaction(ctx);
      await assertChartFlowModelPermission(db, ctx, locator, 'save');
      await lockFlowModelForUpdate(db, locator.modelUid, transaction);
      await assertChartFlowModelPermission(db, ctx, locator, 'save');
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      const rawPath = resolveChartRawPath(model, locator.kind);
      assertOwnerFingerprintMatches(buildChartFingerprint(locator, model), baseOwnerFingerprint, locator.kind);
      const rootKey = rawPath[0] as string;
      const nextRoot = cloneJsonRecord(getAtPath(model, [rootKey]));

      setAtPath(nextRoot, rawPath.slice(1), artifact.code);

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, [rootKey]: nextRoot }, { transaction });

      return buildWriteResult(await this.getFingerprint({ locator, ctx }));
    },
  };
}

async function assertChartFlowModelPermission(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  locator: ChartLocator,
  action: 'findOne' | 'save',
): Promise<void> {
  const permission = requireFlowModelPermission(ctx, action);
  await assertFlowModelRecordPermission(db, ctx, locator.modelUid, permission);
  const model = await loadFlowModel(db, locator.modelUid, ctx);
  assertFlowModelPermissionFields(permission, action, [resolveChartRawPath(model, locator.kind)[0] as string]);
}

async function loadFlowModel(db: Database, modelUid: string, ctx: RunJSSourceAdapterContext): Promise<JsonRecord> {
  const model = await getFlowModelRepository(db).findModelById(modelUid, {
    includeAsyncNode: true,
    transaction: ctx.transaction as Transaction | undefined,
  });

  if (!isRecord(model)) {
    throw new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', `FlowModel "${modelUid}" was not found`, {
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
  const permission = requireFlowModelPermission(ctx, action);
  await assertFlowModelPermissionWithGrant(db, ctx, modelUid, action, fields, permission);
}

function requireFlowModelPermission(
  ctx: RunJSSourceAdapterContext,
  action: 'findOne' | 'save',
): RunJSSourcePermissionResult {
  return requireSourcePermission(ctx, 'flowModels', action);
}

async function assertFlowModelPermissionWithGrant(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  modelUid: string,
  action: 'findOne' | 'save',
  fields: string[],
  permission: RunJSSourcePermissionResult,
): Promise<void> {
  assertFlowModelPermissionFields(permission, action, fields);
  await assertFlowModelRecordPermission(db, ctx, modelUid, permission);
}

function assertFlowModelPermissionFields(
  permission: RunJSSourcePermissionResult,
  action: 'findOne' | 'save',
  fields: string[],
): void {
  if (permissionAllowsFields(permission, fields)) {
    return;
  }

  throwFlowModelFieldPermissionDenied(action, fields);
}

async function assertFlowModelRecordPermission(
  db: Database,
  ctx: RunJSSourceAdapterContext,
  modelUid: string,
  permission: RunJSSourcePermissionResult,
): Promise<void> {
  await assertRecordMatchesPermissionFilter(db, ctx, 'flowModels', modelUid, permission);
}

async function loadFlowModelForNestedSource(
  db: Database,
  modelUid: string,
  ctx: RunJSSourceAdapterContext,
  permission: RunJSSourcePermissionResult,
  action: 'findOne' | 'save',
): Promise<JsonRecord> {
  try {
    return await loadFlowModel(db, modelUid, ctx);
  } catch (error) {
    if (
      error instanceof RunJSSourceError &&
      error.code === 'RUNJS_SOURCE_NOT_FOUND' &&
      !permissionAllowsAllNestedRoots(permission)
    ) {
      throwFlowModelFieldPermissionDenied(action, ['stepParams', 'flowRegistry']);
    }
    throw error;
  }
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

  throw new RunJSSourceError('PERMISSION_DENIED', `RunJS source requires ${resource}:${action} permission`, {
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

  throw new RunJSSourceError('PERMISSION_DENIED', `RunJS source owner is outside ${resource} permission scope`, {
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
): Promise<Filter | undefined> {
  if (!filter) {
    return undefined;
  }

  try {
    checkFilterParams(db.getCollection(resource), filter);
    return ((await parseJsonTemplate(filter, {
      state: ctx.state || {},
      timezone: ctx.timezone,
      userProvider: createUserProvider({
        db,
        currentUser: ctx.currentUser,
      }),
    })) ?? filter) as Filter;
  } catch (error) {
    if (error instanceof NoPermissionError) {
      throw new RunJSSourceError('PERMISSION_DENIED', `RunJS source requires ${resource} permission scope`, {
        details: {
          resource,
        },
      });
    }
    throw error;
  }
}

function permissionAllowsFields(permission: RunJSSourcePermissionResult, fields: string[]): boolean {
  const whitelist = toStringList(permission.params?.whitelist || permission.params?.fields);
  if (whitelist && fields.some((field) => !whitelist.includes(field))) {
    return false;
  }

  const blacklist = toStringList(permission.params?.blacklist);
  if (blacklist && fields.some((field) => blacklist.includes(field))) {
    return false;
  }

  return true;
}

function permissionAllowsAllNestedRoots(permission: RunJSSourcePermissionResult): boolean {
  return permissionAllowsFields(permission, ['stepParams']) && permissionAllowsFields(permission, ['flowRegistry']);
}

function throwFlowModelFieldPermissionDenied(action: string, fields: string[]): never {
  throw new RunJSSourceError('PERMISSION_DENIED', `RunJS source requires flowModels:${action} field permission`, {
    details: {
      resource: 'flowModels',
      action,
      fields,
    },
  });
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
  const { codeValue, versionPath, versionValue } = readFlowModelStepSource(model, locator);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      flowKey: locator.flowKey,
      stepKey: locator.stepKey,
      paramPath: locator.paramPath,
      versionPath,
    },
    selectedLegacyValue: codeValue,
    selectedVersion: versionValue,
  });
}

function readFlowModelStepSource(model: JsonRecord, locator: FlowModelStepLocator) {
  const stepPath: JsonPath = ['stepParams', locator.flowKey, locator.stepKey];
  const step = getAtPath(model, stepPath);
  if (!isRecord(step)) {
    if (isInitializableFlowModelRunJSSource(model, locator)) {
      return buildMissingFlowModelStepSource(locator);
    }
    throwNestedPathNotFound(stepPath);
  }

  const codeValue = getAtPath(step, locator.paramPath);
  if (typeof codeValue === 'undefined') {
    if (isInitializableFlowModelRunJSSource(model, locator)) {
      return buildMissingFlowModelStepSource(locator);
    }
    throwNestedPathNotFound([...stepPath, ...locator.paramPath]);
  }

  const versionPath = resolveVersionPath(locator.paramPath, locator.versionPath);
  return {
    codeValue,
    versionPath,
    versionValue: getAtPath(step, versionPath),
    sourceMissing: false,
  };
}

function assertFlowModelStepSourceIsInline(
  model: JsonRecord,
  locator: FlowModelStepLocator,
  ctx?: RunJSSourceAdapterContext,
): void {
  const sourceRootPath: JsonPath = ['stepParams', locator.flowKey, locator.stepKey, ...locator.paramPath.slice(0, -1)];
  const sourceMode = getAtPath(model, [...sourceRootPath, 'sourceMode']);
  if (typeof sourceMode === 'undefined' || sourceMode === 'inline') {
    return;
  }
  if (sourceMode === 'light-extension' && ctx?.sourceTransition === 'external-to-inline') {
    return;
  }

  throw new RunJSSourceError('RUNJS_SOURCE_READONLY', 'RunJS workspace authoring is disabled for external source', {
    details: {
      kind: locator.kind,
      sourceMode,
    },
  });
}

function assertFlowModelNestedSourceIsInline(model: JsonRecord, locator: FlowModelNestedLocator): void {
  const storage = resolveNestedStorage(model, locator);
  const value = getExistingNestedValue(model, storage.targetPath);
  const sourceRoot = isRecord(value)
    ? value
    : !isNestedRunJSValuePath(locator)
      ? getAtPath(model, storage.targetPath.slice(0, -1))
      : undefined;
  const sourceMode = isRecord(sourceRoot) ? sourceRoot.sourceMode : undefined;
  if (typeof sourceMode === 'undefined' || sourceMode === 'inline') {
    return;
  }

  throw new RunJSSourceError('RUNJS_SOURCE_READONLY', 'RunJS workspace authoring is disabled for external source', {
    details: {
      kind: locator.kind,
      sourceMode,
    },
  });
}

function isInitializableFlowModelRunJSSource(model: JsonRecord, locator: FlowModelStepLocator): boolean {
  return (
    locator.stepKey === 'runJs' &&
    locator.paramPath.length === 1 &&
    locator.paramPath[0] === 'code' &&
    INITIALIZABLE_FLOW_MODEL_RUNJS_PATHS.get(readModelUse(model)) === locator.flowKey
  );
}

function buildMissingFlowModelStepSource(locator: FlowModelStepLocator) {
  return {
    codeValue: undefined,
    versionPath: resolveVersionPath(locator.paramPath, locator.versionPath),
    versionValue: undefined,
    sourceMissing: true,
  };
}

function buildNestedFingerprint(locator: FlowModelNestedLocator, model: JsonRecord): string {
  const source = readNestedSource(model, locator);
  const storage = resolveNestedStorage(model, locator);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      rootKey: storage.rootKey,
    },
    selectedLegacyValue: source.code,
    selectedVersion: source.version,
  });
}

function buildFlowRegistryRunJSFingerprint(locator: FlowRegistryRunJSLocator, model: JsonRecord): string {
  const source = readFlowRegistryRunJSSource(model, locator);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      sourcePath: source.sourcePath,
    },
    selectedLegacyValue: source.code,
    selectedVersion: 'v2',
  });
}

function buildChartFingerprint(locator: ChartLocator, model: JsonRecord): string {
  const rawPath = resolveChartRawPath(model, locator.kind);
  const raw = getAtPath(model, rawPath);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      rawPath,
    },
    selectedLegacyValue: raw,
    selectedVersion: 'v2',
  });
}

function assertOwnerFingerprintMatches(current: string, expected: string, kind: string): void {
  if (current === expected) {
    return;
  }

  throw new RunJSSourceError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS host code differs from the versioned source', {
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

function readModelUse(model: JsonRecord): string {
  return typeof model.use === 'string' ? model.use : '';
}

function modelUseMetadata(modelUse: string): JsonRecord | undefined {
  return modelUse ? { modelUse } : undefined;
}

function readFlowRegistryRunJSSource(model: JsonRecord, locator: FlowRegistryRunJSLocator) {
  const stepPath: JsonPath = ['flowRegistry', locator.flowKey, 'steps', locator.stepKey];
  const step = getAtPath(model, stepPath);
  if (!isRecord(step)) {
    throwNestedPathNotFound(stepPath);
  }
  if (step.use !== 'runjs') {
    throwNestedPathNotFound(stepPath);
  }
  const sourcePath = resolveFlowRegistryRunJSSourcePath(step, locator.sourcePath, stepPath);
  const value = getAtPath(step, sourcePath);
  if (typeof value !== 'string') {
    throwNestedPathNotFound([...stepPath, ...sourcePath]);
  }

  return {
    code: value,
    sourcePath,
  };
}

function resolveFlowRegistryRunJSSourcePath(step: JsonRecord, preferredPath: string[], stepPath: JsonPath): string[] {
  if (!isFlowRegistryRunJSCodePath(preferredPath)) {
    throwNestedPathNotFound([...stepPath, ...preferredPath]);
  }
  if (typeof getAtPath(step, ['params', 'code']) === 'string') {
    return ['params', 'code'];
  }
  if (typeof getAtPath(step, ['defaultParams', 'code']) === 'string') {
    return ['defaultParams', 'code'];
  }

  return ['defaultParams', 'code'];
}

function isFlowRegistryRunJSCodePath(path: string[]): boolean {
  return path.length === 2 && (path[0] === 'params' || path[0] === 'defaultParams') && path[1] === 'code';
}

function readNestedSource(model: JsonRecord, locator: FlowModelNestedLocator) {
  const storage = resolveNestedStorage(model, locator);
  assertNestedKeyedContainersExist(model, storage, locator);
  assertNestedParentPathExists(model, storage, locator);
  const value = getExistingNestedValue(model, storage.targetPath);
  assertNestedTargetExists(value, locator);

  if (isRecord(value)) {
    if (typeof value.code === 'string') {
      return {
        code: value.code,
        version: resolveLegacyVersion(value.code, value.version),
        originalValue: value,
      };
    }
    if (typeof value.script === 'string') {
      return {
        code: value.script,
        version: resolveLegacyVersion(value.script, value.version),
        originalValue: value,
      };
    }
  }

  return {
    code: typeof value === 'string' ? value : '',
    version: resolveLegacyVersion(value, undefined),
    originalValue: value,
  };
}

function resolveNestedStorage(model: JsonRecord, locator: FlowModelNestedLocator): FlowModelNestedStorage {
  const flowRegistryStepPath: JsonPath = ['flowRegistry', locator.containerFlowKey, 'steps', locator.containerStepKey];
  const flowRegistryStep = getAtPath(model, flowRegistryStepPath);

  if (typeof flowRegistryStep !== 'undefined') {
    if (!isRecord(flowRegistryStep)) {
      throwNestedPathNotFound(flowRegistryStepPath);
    }
    const paramsKey = hasNestedPathOwner(getAtPath(flowRegistryStep, ['params']), locator.valuePath)
      ? 'params'
      : 'defaultParams';
    return {
      rootKey: 'flowRegistry',
      targetPath: [...flowRegistryStepPath, paramsKey, ...locator.valuePath],
    };
  }

  const stepParamsOwnerPath: JsonPath = ['stepParams', locator.containerFlowKey, locator.containerStepKey];
  const stepParamsOwner = getAtPath(model, stepParamsOwnerPath);
  if (!isRecord(stepParamsOwner)) {
    throwNestedPathNotFound(stepParamsOwnerPath);
  }

  return {
    rootKey: 'stepParams',
    targetPath: [...stepParamsOwnerPath, ...locator.valuePath],
  };
}

function assertNestedKeyedContainersExist(
  model: JsonRecord,
  storage: FlowModelNestedStorage,
  locator: FlowModelNestedLocator,
): void {
  const prefixPath = storage.targetPath.slice(0, storage.targetPath.length - locator.valuePath.length);
  const containers = getNestedKeyedArrayContainers(locator.valuePath);

  for (const { path, key } of containers) {
    const container = getAtPath(model, [...prefixPath, ...path]);
    if (!Array.isArray(container) || typeof getChild(container, key) === 'undefined') {
      throwKeyedArrayItemNotFound(String(key));
    }
  }
}

function getNestedKeyedArrayContainers(valuePath: JsonPath): Array<{ path: JsonPath; key: string | number }> {
  const containers: Array<{ path: JsonPath; key: string | number }> = [];
  const addContainer = (containerEndIndex: number, key: string | number) => {
    containers.push({ path: valuePath.slice(0, containerEndIndex + 1), key });
  };

  if (valuePath[0] === 'variables' && isPathKey(valuePath[1])) {
    addContainer(0, valuePath[1]);
  }
  if (valuePath[0] === 'value' && isPathKey(valuePath[1])) {
    addContainer(0, valuePath[1]);
  }

  for (let index = 0; index < valuePath.length - 1; index += 1) {
    const key = valuePath[index + 1];
    if (valuePath[index] === 'actions' && isPathKey(key)) {
      addContainer(index, key);
    }
    if (
      valuePath[index] === 'value' &&
      valuePath[index - 1] === 'params' &&
      valuePath[index + 2] === 'value' &&
      isPathKey(key)
    ) {
      addContainer(index, key);
    }
  }

  return containers;
}

function isPathKey(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

function assertNestedParentPathExists(
  model: JsonRecord,
  storage: FlowModelNestedStorage,
  locator: FlowModelNestedLocator,
): void {
  const parentValuePath = locator.valuePath.slice(0, -1);
  if (parentValuePath.length === 0) {
    return;
  }

  const parent = getAtPath(model, storage.targetPath.slice(0, -1));
  if (Array.isArray(parent) || isRecord(parent)) {
    return;
  }

  const hasKeyedContainers = getNestedKeyedArrayContainers(locator.valuePath).length > 0;
  throwNestedPathNotFound(hasKeyedContainers ? locator.valuePath : parentValuePath);
}

function assertNestedTargetExists(value: unknown, locator: FlowModelNestedLocator): void {
  if (typeof value !== 'undefined' || isNestedRunJSValuePath(locator)) {
    return;
  }

  throwNestedPathNotFound(locator.valuePath);
}

function throwNestedPathNotFound(path: JsonPath): never {
  throw new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', `RunJS source path "${formatPath(path)}" was not found`, {
    details: {
      path: formatPath(path),
    },
  });
}

function hasNestedPathOwner(root: unknown, valuePath: JsonPath): boolean {
  const containers = getNestedKeyedArrayContainers(valuePath);
  if (containers.length) {
    return containers.every(({ path, key }) => {
      const container = getAtPath(root, path);
      return Array.isArray(container) && typeof getChild(container, key) !== 'undefined';
    });
  }

  return typeof getAtPath(root, valuePath) !== 'undefined';
}

function replaceNestedRunJSValue(
  value: unknown,
  artifact: RunJSRuntimeArtifact,
  locator: FlowModelNestedLocator,
): unknown {
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

  if (isNestedRunJSValuePath(locator)) {
    return {
      code: artifact.code,
      version: artifact.version,
    };
  }

  return artifact.code;
}

function writeNestedRunJSBinding(
  root: JsonRecord,
  targetPath: JsonPath,
  locator: FlowModelNestedLocator,
  binding: RunJSExternalSourceBinding,
): void {
  const currentValue = getAtPath(root, targetPath);
  if (isRecord(currentValue)) {
    assertSourceCanMoveToExternalBinding(currentValue, locator.kind);
    setAtPath(root, targetPath, {
      ...currentValue,
      sourceMode: binding.sourceMode,
      sourceBinding: cloneJsonRecord(binding.sourceBinding),
    });
    return;
  }

  if (!isNestedRunJSValuePath(locator)) {
    const parentPath = targetPath.slice(0, -1);
    const parentValue = getAtPath(root, parentPath);
    if (!isRecord(parentValue)) {
      throwNestedPathNotFound(parentPath);
    }
    assertSourceCanMoveToExternalBinding(parentValue, locator.kind);
    setAtPath(root, parentPath, {
      ...parentValue,
      sourceMode: binding.sourceMode,
      sourceBinding: cloneJsonRecord(binding.sourceBinding),
    });
    return;
  }

  setAtPath(root, targetPath, {
    code: typeof currentValue === 'string' ? currentValue : '',
    version: resolveLegacyVersion(currentValue, undefined),
    sourceMode: binding.sourceMode,
    sourceBinding: cloneJsonRecord(binding.sourceBinding),
  });
}

function assertSourceCanMoveToExternalBinding(value: unknown, kind: string): void {
  if (!isRecord(value)) {
    return;
  }
  const sourceMode = typeof value.sourceMode === 'string' ? value.sourceMode : '';
  if (!sourceMode || sourceMode === 'inline') {
    return;
  }
  throw new RunJSSourceError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source binding changed before the move completed', {
    details: { kind, sourceMode },
  });
}

function isNestedRunJSValuePath(locator: FlowModelNestedLocator): boolean {
  const leaf = locator.valuePath[locator.valuePath.length - 1];
  return leaf !== 'code' && leaf !== 'script';
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
  const isCustomVariableRunJS =
    locator.valuePath.length >= 3 &&
    locator.valuePath[0] === 'variables' &&
    locator.valuePath[locator.valuePath.length - 1] === 'runjs';
  if (isCustomVariableRunJS) {
    return 'value';
  }

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

function getLegacyChartRawPath(kind: ChartLocator['kind']): string[] {
  return kind === 'chart.option' ? LEGACY_CHART_OPTION_RAW_PATH : LEGACY_CHART_EVENTS_RAW_PATH;
}

function getChartDefaultCode(kind: ChartLocator['kind']): string {
  return kind === 'chart.option' ? CHART_OPTION_DEFAULT_CODE : CHART_EVENTS_DEFAULT_CODE;
}

function resolveChartRawPath(model: JsonRecord, kind: ChartLocator['kind']): string[] {
  const standardPath = getChartRawPath(kind);
  const legacyPath = getLegacyChartRawPath(kind);

  if (typeof getAtPath(model, standardPath) !== 'undefined') {
    return standardPath;
  }
  if (typeof getAtPath(model, legacyPath) !== 'undefined') {
    return legacyPath;
  }

  return standardPath;
}

function getChartAuthoringModelUse(kind: ChartLocator['kind']): string {
  return kind === 'chart.option' ? 'ChartOptionModel' : 'ChartEventsModel';
}

function readMetadataString(artifact: RunJSRuntimeArtifact, key: string): string | null {
  const value = artifact.metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function buildWriteResult(ownerFingerprint: string): RunJSRuntimeWriteResult {
  return {
    ownerFingerprint,
  };
}

function requireTransaction(ctx: RunJSSourceAdapterContext): Transaction {
  if (!ctx.transaction) {
    throw new RunJSSourceError('INTERNAL_ERROR', 'RunJS source adapter writes require a transaction');
  }

  return ctx.transaction as Transaction;
}

function getAtPath(root: unknown, path: JsonPath): unknown {
  let current = root;
  for (const segment of path) {
    current = getChild(current, segment);
    if (typeof current === 'undefined') return undefined;
  }

  return current;
}

function setAtPath(root: JsonRecord, path: JsonPath, value: unknown): void {
  let current: unknown = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const nextSegment = path[index + 1];
    const nextValue = getChild(current, segment);
    if (Array.isArray(current) && typeof segment === 'string' && typeof nextValue === 'undefined') {
      throwKeyedArrayItemNotFound(segment);
    }
    const rawReplacement =
      Array.isArray(nextValue) || isRecord(nextValue) ? nextValue : typeof nextSegment === 'number' ? [] : {};
    const replacement =
      Array.isArray(current) && typeof segment === 'string' && isRecord(rawReplacement)
        ? { key: segment, ...rawReplacement }
        : rawReplacement;

    setChild(current, segment, replacement);
    current = replacement;
  }

  setChild(current, path[path.length - 1], value);
}

function getChild(parent: unknown, segment: string | number): unknown {
  if (Array.isArray(parent) && typeof segment === 'number') {
    return parent[segment];
  }
  if (Array.isArray(parent) && typeof segment === 'string') {
    return parent.find((item) => isRecord(item) && item.key === segment);
  }
  if (isRecord(parent) && typeof segment === 'string') {
    assertSafeJsonPathSegment(segment);
    return Object.prototype.hasOwnProperty.call(parent, segment) ? parent[segment] : undefined;
  }

  return undefined;
}

function setChild(parent: unknown, segment: string | number, value: unknown): void {
  if (Array.isArray(parent) && typeof segment === 'number') {
    parent[segment] = value;
    return;
  }
  if (Array.isArray(parent) && typeof segment === 'string') {
    const index = parent.findIndex((item) => isRecord(item) && item.key === segment);
    if (index >= 0) {
      parent[index] = value;
    } else {
      throwKeyedArrayItemNotFound(segment);
    }
    return;
  }
  if (isRecord(parent) && typeof segment === 'string') {
    assertSafeJsonPathSegment(segment);
    parent[segment] = value;
  }
}

function assertSafeJsonPathSegment(segment: string): void {
  if (!UNSAFE_JSON_PATH_SEGMENTS.has(segment)) {
    return;
  }

  throw new RunJSSourceError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source path segment "${segment}" is unsafe`, {
    details: {
      segment,
    },
  });
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

function resolveLegacyVersion(code: unknown, version: unknown, uninitialized = false): string {
  if (typeof version === 'string' && version) {
    return version;
  }
  return !uninitialized && typeof code === 'string' && code.trim() ? 'v1' : 'v2';
}

function getExistingNestedValue(root: unknown, path: JsonPath): unknown {
  let current = root;
  for (const segment of path) {
    const next = getChild(current, segment);
    if (Array.isArray(current) && typeof segment === 'string' && typeof next === 'undefined') {
      throwKeyedArrayItemNotFound(segment);
    }
    current = next;
    if (typeof current === 'undefined') return undefined;
  }

  return current;
}

function throwKeyedArrayItemNotFound(key: string): never {
  throw new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', `RunJS source keyed item "${key}" was not found`, {
    details: {
      key,
    },
  });
}

function formatPath(path: JsonPath): string {
  return path.map((segment) => String(segment)).join('.');
}
