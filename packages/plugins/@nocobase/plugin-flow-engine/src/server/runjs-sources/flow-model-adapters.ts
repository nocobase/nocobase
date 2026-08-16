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
  type RunJSRuntimeArtifact,
  type RunJSRuntimeWriteResult,
  type RunJSSourceAdapter,
  type RunJSSourceAdapterContext,
  type RunJSSourceLocator,
  type RunJSSourcePermissionResult,
  type RunJSSurfaceStyle,
} from '@nocobase/runjs/workspace/server';

import FlowModelRepository from '../repository';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type FlowRegistryRunJSLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.flowRegistry.runjs' }>;
type JsonRecord = Record<string, unknown>;
type JsonPath = Array<string | number>;

/**
 * Canonical JS Template integration names map to the established FlowModel and RunJS wire keys. This package cannot
 * depend on the optional JS Template plugin, so the literal contract is pinned here and compared by tests.
 */
export const JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT = Object.freeze({
  sourceMode: 'js-template',
  sourceBindingType: 'js-template-entry',
  locatorKind: 'flowModel.step',
  stepKey: 'runJs',
  paramPath: Object.freeze(['code']),
  versionPath: Object.freeze(['version']),
  sourceMetadataKindKey: 'jsTemplateKind',
  modelSurfaces: Object.freeze([
    { modelUse: 'JSBlockModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSFieldModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSEditableFieldModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSItemModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSColumnModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSItemActionModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSRecordActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSCollectionActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSFormActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'FilterFormJSActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
  ] as const),
});

const RENDER_MODEL_USES = new Set<string>(
  JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.modelSurfaces
    .filter((surface) => surface.surfaceStyle === 'render')
    .map((surface) => surface.modelUse),
);

const ACTION_MODEL_USES = new Set<string>(
  JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.modelSurfaces
    .filter((surface) => surface.surfaceStyle === 'action')
    .map((surface) => surface.modelUse),
);

const INITIALIZABLE_FLOW_MODEL_RUNJS_PATHS = new Map<string, string>([
  ...JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.modelSurfaces.map(
    (surface) => [surface.modelUse, surface.flowKey] as const,
  ),
]);

const UNSAFE_JSON_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const JS_TEMPLATE_SOURCE_BINDING_KEYS = new Set(['type', 'projectId', 'templateId', 'kind']);
const JS_TEMPLATE_SOURCE_BINDING_KINDS = new Set(['js-block', 'js-field', 'js-action', 'js-item']);

export function createFlowModelRunJSSourceAdapters(db: Database): RunJSSourceAdapter[] {
  return [createFlowModelStepAdapter(db), createFlowRegistryRunJSAdapter(db)];
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
      const model = await loadFlowModel(db, locator.modelUid, ctx);
      if (ctx.sourceTransition !== 'external-binding-replay' || !isCanonicalJsTemplateExternalBinding(model, locator)) {
        assertFlowModelStepSourceIsInline(model, locator, ctx);
      }
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
      assertSourceCanApplyExternalBinding(getAtPath(nextStepParams, bindingRootPath), locator.kind);

      setAtPath(nextStepParams, [...bindingRootPath, 'sourceMode'], binding.sourceMode);
      setAtPath(nextStepParams, [...bindingRootPath, 'sourceBinding'], cloneJsonRecord(binding.sourceBinding));

      await getFlowModelRepository(db).patch({ uid: locator.modelUid, stepParams: nextStepParams }, { transaction });

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
        version: source.version,
        label: buildFlowModelLabel(model, `${locator.flowKey}.${locator.stepKey}`),
        surfaceStyle: 'action',
        language: inferLanguage(source.version),
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
      const versionPath = resolveFlowRegistryRunJSVersionPath(sourcePath);

      setAtPath(nextFlowRegistry, [locator.flowKey, 'steps', locator.stepKey, ...sourcePath], artifact.code);
      setAtPath(nextFlowRegistry, [locator.flowKey, 'steps', locator.stepKey, ...versionPath], artifact.version);

      await getFlowModelRepository(db).patch(
        { uid: locator.modelUid, flowRegistry: nextFlowRegistry },
        { transaction },
      );

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
  if (
    sourceMode === JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.sourceMode &&
    ctx?.sourceTransition === 'external-to-inline'
  ) {
    return;
  }

  throw new RunJSSourceError('RUNJS_SOURCE_READONLY', 'RunJS workspace authoring is disabled for external source', {
    details: {
      kind: locator.kind,
      sourceMode,
    },
  });
}

function isCanonicalJsTemplateExternalBinding(model: JsonRecord, locator: FlowModelStepLocator): boolean {
  const sourceRootPath: JsonPath = ['stepParams', locator.flowKey, locator.stepKey, ...locator.paramPath.slice(0, -1)];
  const sourceBinding = getAtPath(model, [...sourceRootPath, 'sourceBinding']);
  if (!isRecord(sourceBinding)) {
    return false;
  }
  const keys = Object.keys(sourceBinding);

  return (
    getAtPath(model, [...sourceRootPath, 'sourceMode']) === JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.sourceMode &&
    keys.length === JS_TEMPLATE_SOURCE_BINDING_KEYS.size &&
    keys.every((key) => JS_TEMPLATE_SOURCE_BINDING_KEYS.has(key)) &&
    sourceBinding.type === JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.sourceBindingType &&
    isNonEmptyString(sourceBinding.projectId) &&
    isNonEmptyString(sourceBinding.templateId) &&
    typeof sourceBinding.kind === 'string' &&
    JS_TEMPLATE_SOURCE_BINDING_KINDS.has(sourceBinding.kind)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isInitializableFlowModelRunJSSource(model: JsonRecord, locator: FlowModelStepLocator): boolean {
  return (
    locator.stepKey === JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.stepKey &&
    locator.paramPath.length === 1 &&
    locator.paramPath[0] === JS_TEMPLATE_FLOW_MODEL_RUNJS_ADAPTER_CONTRACT.paramPath[0] &&
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

function buildFlowRegistryRunJSFingerprint(locator: FlowRegistryRunJSLocator, model: JsonRecord): string {
  const source = readFlowRegistryRunJSSource(model, locator);

  return buildRunJSOwnerFingerprint({
    locator,
    ownerUpdatedAt: {
      ...getFlowModelFingerprintOwner(model),
      sourcePath: source.sourcePath,
      versionPath: source.versionPath,
    },
    selectedLegacyValue: source.code,
    selectedVersion: source.version,
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
  const versionPath = resolveFlowRegistryRunJSVersionPath(sourcePath);
  const value = getAtPath(step, sourcePath);
  if (typeof value !== 'string') {
    throwNestedPathNotFound([...stepPath, ...sourcePath]);
  }

  return {
    code: value,
    version: resolveLegacyVersion(value, getAtPath(step, versionPath)),
    sourcePath,
    versionPath,
  };
}

function resolveFlowRegistryRunJSVersionPath(sourcePath: string[]): string[] {
  return [sourcePath[0], 'version'];
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

function throwNestedPathNotFound(path: JsonPath): never {
  throw new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', `RunJS source path "${formatPath(path)}" was not found`, {
    details: {
      path: formatPath(path),
    },
  });
}

function assertSourceCanApplyExternalBinding(value: unknown, kind: string): void {
  if (!isRecord(value)) {
    return;
  }
  const sourceMode = typeof value.sourceMode === 'string' ? value.sourceMode : '';
  if (!sourceMode || sourceMode === 'inline') {
    return;
  }
  throw new RunJSSourceError(
    'RUNJS_SOURCE_OWNER_OUTDATED',
    'RunJS source binding changed before the binding update completed',
    {
      details: { kind, sourceMode },
    },
  );
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

function inferLanguage(version: string): RunJSLanguage {
  return version === 'jsx' ? 'jsx' : version === 'javascript' || version === 'v1' ? 'javascript' : 'typescript';
}

function buildFlowModelLabel(model: JsonRecord, fallback: string): string {
  const title = typeof model.title === 'string' && model.title.trim() ? model.title.trim() : null;
  const use = typeof model.use === 'string' && model.use.trim() ? model.use.trim() : 'FlowModel';

  return title ? `${title} / ${fallback}` : `${use} / ${fallback}`;
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
