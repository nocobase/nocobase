/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { createHash } from 'crypto';
import { vi } from 'vitest';

import type { LightExtensionReferenceOwnerLocator, LightExtensionRuntimeSourceBinding } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { BulkUpgradeService } from '../services/BulkUpgradeService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { ReferenceService } from '../services/ReferenceService';

type RepositoryInput = {
  records?: Record<string, unknown>[];
};

type FlowModelNode = {
  uid: string;
  use?: string;
  stepParams?: Record<string, unknown>;
  subModels?: Record<string, FlowModelNode | FlowModelNode[]>;
};

type MutableModel = Model & {
  update: ReturnType<typeof vi.fn>;
  toJSON: () => Record<string, unknown>;
};

export function createReferenceServiceFixture(
  input: {
    flowModelTrees?: Record<string, FlowModelNode>;
    flowModels?: Record<string, unknown>[];
    publications?: Record<string, unknown>[];
    repos?: Record<string, unknown>[];
    entries?: Record<string, unknown>[];
    references?: Record<string, unknown>[];
    flowModelTemplates?: Record<string, unknown>[];
    flowModelTreePaths?: Record<string, unknown>[];
    desktopRoutes?: Record<string, unknown>[];
    roles?: Record<string, unknown>[];
  } = {},
) {
  const flowModelTrees = { ...(input.flowModelTrees || {}) };
  const repositories = {
    flowModels: createRepository({ records: input.flowModels || [] }),
    lightExtensionEntryPublications: createRepository({ records: input.publications || [] }),
    lightExtensionRepos: createRepository({ records: input.repos || [] }),
    lightExtensionEntries: createRepository({ records: input.entries || [] }),
    lightExtensionReferences: createRepository({ records: input.references || [] }),
    lightExtensionLogs: createRepository(),
    flowModelTemplates: createRepository({ records: input.flowModelTemplates || [] }),
    flowModelTreePath: createRepository({ records: input.flowModelTreePaths || [] }),
    desktopRoutes: createRepository({ records: input.desktopRoutes || [] }),
    roles: createRepository({ records: input.roles || [] }),
  };
  const flowModelRepository = {
    ...repositories.flowModels,
    findModelById: vi.fn(async (uid: string) => cloneJsonValue(flowModelTrees[uid] || null)),
  };
  repositories.flowModels = flowModelRepository;
  const db = {
    getRepository: (name: keyof typeof repositories) => {
      const repository = repositories[name];
      if (!repository) {
        throw new Error(`Unexpected repository ${name}`);
      }
      return repository;
    },
    getCollection: (name: keyof typeof repositories) => {
      const repository = repositories[name];
      if (!repository) {
        throw new Error(`Unexpected collection ${name}`);
      }
      return {
        repository,
      };
    },
    sequelize: {
      transaction: async (run: (transaction: unknown) => Promise<unknown>) => {
        const snapshot = snapshotRepositories(repositories);
        try {
          return await run({ transactionId: 'test_transaction' });
        } catch (error) {
          restoreRepositories(repositories, snapshot);
          throw error;
        }
      },
    },
  } as unknown as Database;
  const auditService = new LightExtensionAuditService(db);
  const recordReferenceEvent = vi.spyOn(auditService, 'recordReferenceEvent').mockResolvedValue(undefined);
  const permissionService = new LightExtensionPermissionService(auditService);
  const service = new ReferenceService(db, auditService, permissionService);

  return {
    db,
    service,
    bulkUpgradeService: new BulkUpgradeService(db, auditService, permissionService, undefined, service),
    repositories,
    flowModelTrees,
    auditService,
    recordReferenceEvent,
  };
}

function snapshotRepositories(repositories: Record<string, { records: MutableModel[] }>) {
  return Object.fromEntries(
    Object.entries(repositories).map(([name, repository]) => [
      name,
      repository.records.map((record) => record.toJSON()),
    ]),
  );
}

function restoreRepositories(
  repositories: Record<string, { records: MutableModel[] }>,
  snapshot: Record<string, Record<string, unknown>[]>,
) {
  for (const [name, records] of Object.entries(snapshot)) {
    const repository = repositories[name];
    if (!repository) {
      continue;
    }
    repository.records.splice(0, repository.records.length, ...records.map((record) => createMutableModel(record)));
  }
}

export function createRepository(input: RepositoryInput = {}) {
  const records = (input.records || []).map((record) => createMutableModel(record));
  return {
    records,
    find: vi.fn(async (options: { filter?: Record<string, unknown> } = {}) =>
      records.filter((record) => matchesFilter(record, options.filter)),
    ),
    findOne: vi.fn(
      async (options: { filterByTk?: string; filter?: Record<string, unknown> } = {}) =>
        records.find(
          (record) => matchesFilterByTk(record, options.filterByTk) && matchesFilter(record, options.filter),
        ) || null,
    ),
    create: vi.fn(async (options: { values: Record<string, unknown> }) => {
      const model = createMutableModel(options.values);
      records.push(model);
      return model;
    }),
    update: vi.fn(
      async (options: { values: Record<string, unknown>; filterByTk?: string; filter?: Record<string, unknown> }) => {
        const matched = records.filter(
          (record) => matchesFilterByTk(record, options.filterByTk) && matchesFilter(record, options.filter),
        );
        for (const record of matched) {
          await record.update(options.values);
        }
        return matched;
      },
    ),
    destroy: vi.fn(async (options: { filterByTk?: string; filter?: Record<string, unknown> } = {}) => {
      const nextRecords = records.filter(
        (record) => !(matchesFilterByTk(record, options.filterByTk) && matchesFilter(record, options.filter)),
      );
      const removed = records.length - nextRecords.length;
      records.splice(0, records.length, ...nextRecords);
      return removed;
    }),
    count: vi.fn(
      async (options: { filter?: Record<string, unknown> } = {}) =>
        records.filter((record) => matchesFilter(record, options.filter)).length,
    ),
  };
}

export function createMutableModel(values: Record<string, unknown>): MutableModel {
  const modelValues = cloneJsonValue(values);
  const model = {
    get: (key: string) => modelValues[key],
    update: vi.fn(async (nextValues: Record<string, unknown>) => {
      Object.assign(modelValues, cloneJsonValue(nextValues));
      return model;
    }),
    toJSON: () => cloneJsonValue(modelValues),
  };

  return model as unknown as MutableModel;
}

export function createSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: 'ler_sales',
    entryId: 'lee_sales_kpi',
    kind: 'js-block',
    publicationId: 'lep_sales_kpi',
    versionPolicy: 'pinned',
    ...input,
  };
}

export function createJsFieldSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return createSourceBinding({
    repoId: 'ler_fields',
    entryId: 'lee_phone_link',
    kind: 'js-field',
    publicationId: 'lep_phone_link',
    ...input,
  });
}

export function createJsActionSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return createSourceBinding({
    repoId: 'ler_actions',
    entryId: 'lee_mark_approved',
    kind: 'js-action',
    publicationId: 'lep_mark_approved',
    ...input,
  });
}

export function createJsBlockNode(
  input: {
    uid?: string;
    sourceMode?: string;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
    settings?: Record<string, unknown>;
  } = {},
): FlowModelNode {
  return {
    uid: input.uid || 'flow_js_block',
    use: 'JSBlockModel',
    stepParams: {
      jsSettings: {
        sourceMode: input.sourceMode || 'light-extension',
        sourceBinding: input.sourceBinding || createSourceBinding(),
        settings: input.settings || {},
      },
    },
  };
}

export function createJsFieldNode(
  input: {
    uid?: string;
    use?: 'JSFieldModel' | 'JSEditableFieldModel' | 'JSColumnModel';
    sourceMode?: string;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
    settings?: Record<string, unknown>;
  } = {},
): FlowModelNode {
  return {
    uid: input.uid || 'flow_js_field',
    use: input.use || 'JSFieldModel',
    stepParams: {
      jsSettings: {
        runJs: {
          sourceMode: input.sourceMode || 'light-extension',
          sourceBinding: input.sourceBinding || createJsFieldSourceBinding(),
          settings: input.settings || {},
        },
      },
    },
  };
}

export function createJsActionNode(
  input: {
    uid?: string;
    use?:
      | 'JSActionModel'
      | 'JSRecordActionModel'
      | 'JSCollectionActionModel'
      | 'JSFormActionModel'
      | 'FilterFormJSActionModel';
    sourceMode?: string;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
    settings?: Record<string, unknown>;
  } = {},
): FlowModelNode {
  return {
    uid: input.uid || 'flow_js_action',
    use: input.use || 'JSActionModel',
    stepParams: {
      clickSettings: {
        runJs: {
          sourceMode: input.sourceMode || 'light-extension',
          sourceBinding: input.sourceBinding || createJsActionSourceBinding(),
          settings: input.settings || {},
        },
      },
    },
  };
}

export function createPublicationRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'lep_sales_kpi',
    repoId: 'ler_sales',
    entryId: 'lee_sales_kpi',
    commitId: 'vsc_commit_1',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: {
      code: 'ctx.render("ok");',
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: 'files_hash_1',
      diagnostics: [],
      metadata: {},
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          default: 5,
          maximum: 10,
        },
        region: {
          type: 'string',
          default: 'APAC',
        },
      },
    },
    settingsDefaultsSnapshot: {
      threshold: 5,
      region: 'APAC',
    },
    settingsSchemaHash: 'schema_hash_1',
    settingsDefaultsHash: 'defaults_hash_1',
    filesHash: 'files_hash_1',
    runtimeCodeHash: 'runtime_hash_1',
    diagnostics: [],
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
    ...input,
  };
}

export function createJsFieldPublicationRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createPublicationRecord({
    id: 'lep_phone_link',
    repoId: 'ler_fields',
    entryId: 'lee_phone_link',
    entryPath: 'src/client/js-fields/phone-link/index.tsx',
    kind: 'js-field',
    surfaceStyle: 'value',
    artifact: {
      code: 'ctx.render("phone");',
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-fields/phone-link/index.tsx',
      filesHash: 'files_hash_field_1',
      diagnostics: [],
      metadata: {},
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {
        prefix: {
          type: 'string',
          default: 'tel:',
        },
      },
    },
    settingsDefaultsSnapshot: {
      prefix: 'tel:',
    },
    ...input,
  });
}

export function createJsActionPublicationRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createPublicationRecord({
    id: 'lep_mark_approved',
    repoId: 'ler_actions',
    entryId: 'lee_mark_approved',
    entryPath: 'src/client/js-actions/mark-approved/index.ts',
    kind: 'js-action',
    surfaceStyle: 'action',
    artifact: {
      code: 'ctx.message.success("approved");',
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-actions/mark-approved/index.ts',
      filesHash: 'files_hash_action_1',
      diagnostics: [],
      metadata: {},
    },
    settingsSchemaSnapshot: {
      type: 'object',
      properties: {
        successMessage: {
          type: 'string',
          default: 'Approved',
        },
      },
    },
    settingsDefaultsSnapshot: {
      successMessage: 'Approved',
    },
    ...input,
  });
}

export function createRepoRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ler_sales',
    lifecycleStatus: 'enabled',
    ...input,
  };
}

export function createJsFieldEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createEntryRecord({
    id: 'lee_phone_link',
    repoId: 'ler_fields',
    kind: 'js-field',
    healthStatus: 'ready',
    ...input,
  });
}

export function createJsActionEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createEntryRecord({
    id: 'lee_mark_approved',
    repoId: 'ler_actions',
    kind: 'js-action',
    healthStatus: 'ready',
    ...input,
  });
}

export function createEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'lee_sales_kpi',
    repoId: 'ler_sales',
    kind: 'js-block',
    healthStatus: 'ready',
    ...input,
  };
}

export function createReferenceRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  const modelUid = typeof input.modelUid === 'string' ? input.modelUid : 'flow_js_block';
  const ownerLocator = isPlainRecord(input.ownerLocator)
    ? (input.ownerLocator as LightExtensionReferenceOwnerLocator)
    : createOwnerLocator(modelUid);
  return {
    id: `lef_${modelUid}`,
    repoId: 'ler_sales',
    entryId: 'lee_sales_kpi',
    publicationId: 'lep_sales_kpi',
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    ownerLocator,
    ownerLocatorHash: hashOwnerLocator(ownerLocator),
    versionPolicy: 'pinned',
    settingsHash: stableJsonHash({}),
    resolvedStatus: 'active',
    ...input,
  };
}

export function createJsFieldReferenceRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  const modelUid = typeof input.modelUid === 'string' ? input.modelUid : 'flow_js_field';
  const use = typeof input.use === 'string' ? input.use : 'JSFieldModel';
  const ownerLocator = isPlainRecord(input.ownerLocator)
    ? (input.ownerLocator as LightExtensionReferenceOwnerLocator)
    : createOwnerLocator(modelUid, { kind: 'js-field', use });
  return createReferenceRecord({
    id: `lef_${modelUid}`,
    repoId: 'ler_fields',
    entryId: 'lee_phone_link',
    publicationId: 'lep_phone_link',
    kind: 'js-field',
    ownerKind: 'flowModel.fieldSettings',
    ownerLocator,
    ownerLocatorHash: hashOwnerLocator(ownerLocator),
    ...input,
  });
}

export function createJsActionReferenceRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  const modelUid = typeof input.modelUid === 'string' ? input.modelUid : 'flow_js_action';
  const use = typeof input.use === 'string' ? input.use : 'JSActionModel';
  const ownerLocator = isPlainRecord(input.ownerLocator)
    ? (input.ownerLocator as LightExtensionReferenceOwnerLocator)
    : createOwnerLocator(modelUid, { kind: 'js-action', use });
  return createReferenceRecord({
    id: `lef_${modelUid}`,
    repoId: 'ler_actions',
    entryId: 'lee_mark_approved',
    publicationId: 'lep_mark_approved',
    kind: 'js-action',
    ownerKind: 'flowModel.actionSettings',
    ownerLocator,
    ownerLocatorHash: hashOwnerLocator(ownerLocator),
    ...input,
  });
}

export function createOwnerLocator(
  modelUid: string,
  input: { kind?: 'js-block' | 'js-field' | 'js-action'; use?: string } = {},
): LightExtensionReferenceOwnerLocator {
  if (input.kind === 'js-field') {
    return {
      kind: 'flowModel.fieldSettings',
      modelUid,
      use: input.use || 'JSFieldModel',
      descriptor: 'Field model settings locator',
    };
  }
  if (input.kind === 'js-action') {
    return {
      kind: 'flowModel.actionSettings',
      modelUid,
      use: input.use || 'JSActionModel',
      descriptor: 'Action model click settings locator',
    };
  }
  return {
    kind: 'flowModel.step',
    modelUid,
    use: 'JSBlockModel',
    stepPath: ['stepParams', 'jsSettings'],
  };
}

export function hashOwnerLocator(ownerLocator: LightExtensionReferenceOwnerLocator): string {
  if (ownerLocator.kind === 'flowModel.step') {
    return stableJsonHash({
      kind: ownerLocator.kind,
      modelUid: ownerLocator.modelUid,
      use: ownerLocator.use,
      stepPath: ownerLocator.stepPath,
    });
  }
  return stableJsonHash({
    kind: ownerLocator.kind,
    modelUid: ownerLocator.modelUid,
    ...(ownerLocator.use ? { use: ownerLocator.use } : {}),
    ...(ownerLocator.stepPath?.length ? { stepPath: ownerLocator.stepPath } : {}),
    ...(ownerLocator.hostPath?.length ? { hostPath: ownerLocator.hostPath } : {}),
  });
}

export function stableJsonHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableSerialize(value)).digest('hex')}`;
}

function matchesFilterByTk(record: MutableModel, filterByTk?: string | string[]): boolean {
  if (!filterByTk) {
    return true;
  }
  if (Array.isArray(filterByTk)) {
    return filterByTk.some((item) => matchesFilterByTk(record, item));
  }
  return record.get('id') === filterByTk || record.get('uid') === filterByTk || record.get('name') === filterByTk;
}

function matchesFilter(record: MutableModel, filter: Record<string, unknown> | undefined): boolean {
  if (!filter) {
    return true;
  }
  return Object.entries(filter).every(([key, value]) => matchesFilterEntry(record, key, value));
}

function matchesFilterEntry(record: MutableModel, key: string, value: unknown): boolean {
  if (key === '$and' && Array.isArray(value)) {
    return value.every((item) => isPlainRecord(item) && matchesFilter(record, item));
  }
  if (key === '$or' && Array.isArray(value)) {
    return value.some((item) => isPlainRecord(item) && matchesFilter(record, item));
  }
  const recordValue = record.get(key);
  if (isPlainRecord(value) && Array.isArray(value.$in)) {
    return value.$in.includes(recordValue);
  }
  return recordValue === value;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
