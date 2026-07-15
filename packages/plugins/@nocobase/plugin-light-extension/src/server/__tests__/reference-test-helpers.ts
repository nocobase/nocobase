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
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { ReferenceService } from '../services/ReferenceService';

type RepositoryInput = {
  records?: Record<string, unknown>[];
};

type FlowModelNode = {
  uid: string;
  use?: string;
  stepParams?: Record<string, unknown>;
  flowRegistry?: Record<string, unknown>;
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
    ...input,
  });
}

export function createJsItemSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return createSourceBinding({
    repoId: 'ler_items',
    entryId: 'lee_level_label',
    kind: 'js-item',
    ...input,
  });
}

export function createRunJSSourceBinding(
  input: Partial<LightExtensionRuntimeSourceBinding> = {},
): LightExtensionRuntimeSourceBinding {
  return createSourceBinding({
    repoId: 'ler_runjs',
    entryId: 'lee_normalize_amount',
    kind: 'runjs',
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
        runJs: {
          sourceMode: input.sourceMode || 'light-extension',
          sourceBinding: input.sourceBinding || createSourceBinding(),
          settings: input.settings || {},
        },
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

export function createJsItemNode(
  input: {
    uid?: string;
    use?: 'JSItemModel' | 'JSItemActionModel';
    sourceMode?: string;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
    settings?: Record<string, unknown>;
  } = {},
): FlowModelNode {
  return {
    uid: input.uid || 'flow_js_item',
    use: input.use || 'JSItemModel',
    stepParams: {
      jsSettings: {
        runJs: {
          sourceMode: input.sourceMode || 'light-extension',
          sourceBinding: input.sourceBinding || createJsItemSourceBinding(),
          settings: input.settings || {},
        },
      },
    },
  };
}

export function createRunJSHostNode(
  input: {
    uid?: string;
    storage?: 'stepParams' | 'flowRegistry';
    sourceMode?: string;
    sourceBinding?: LightExtensionRuntimeSourceBinding;
    settings?: Record<string, unknown>;
  } = {},
): FlowModelNode {
  const runJsValue = {
    code: '',
    version: 'v2',
    sourceMode: input.sourceMode || 'light-extension',
    sourceBinding: input.sourceBinding || createRunJSSourceBinding(),
    settings: input.settings || {},
  };
  if (input.storage === 'flowRegistry') {
    return {
      uid: input.uid || 'flow_form_runjs',
      use: 'FormBlockModel',
      flowRegistry: {
        formModelSettings: {
          steps: {
            defaultValue: {
              params: {
                value: runJsValue,
              },
            },
          },
        },
      },
    };
  }
  return {
    uid: input.uid || 'flow_form_runjs',
    use: 'FormBlockModel',
    stepParams: {
      formModelSettings: {
        defaultValue: runJsValue,
      },
    },
  };
}

export function createRepoRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ler_sales',
    lifecycleStatus: 'enabled',
    headCommitId: 'vsc_commit_1',
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

export function createJsItemEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createEntryRecord({
    id: 'lee_level_label',
    repoId: 'ler_items',
    kind: 'js-item',
    healthStatus: 'ready',
    ...input,
  });
}

export function createRunJSEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  return createEntryRecord({
    id: 'lee_normalize_amount',
    repoId: 'ler_runjs',
    kind: 'runjs',
    healthStatus: 'ready',
    ...input,
  });
}

export function createEntryRecord(input: Record<string, unknown> = {}): Record<string, unknown> {
  const kind = typeof input.kind === 'string' ? input.kind : 'js-block';
  const entryPath =
    typeof input.entryPath === 'string' ? input.entryPath : `src/client/${kindToFolder(kind)}/sales-kpi/index.tsx`;
  return {
    id: 'lee_sales_kpi',
    repoId: 'ler_sales',
    target: 'client',
    kind,
    entryName: 'sales-kpi',
    entryPath,
    descriptorPath: `${entryPath.slice(0, entryPath.lastIndexOf('/'))}/entry.json`,
    title: 'Sales KPI',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
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
          enum: ['APAC', 'EMEA'],
        },
      },
    },
    settingsSchemaHash: stableJsonHash({
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
          enum: ['APAC', 'EMEA'],
        },
      },
    }),
    compiledCommitId: 'vsc_commit_1',
    runtimeArtifact: {
      code: 'ctx.render("ok");',
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath,
      filesHash: 'files_hash_1',
      diagnostics: [],
      metadata: {},
    },
    runtimeVersion: 'v2',
    surfaceStyle: kind === 'js-action' ? 'action' : kind === 'runjs' ? 'value' : 'render',
    runtimeCodeHash: 'runtime_hash_1',
    artifactHash: 'artifact_hash_1',
    filesHash: 'files_hash_1',
    settingsDefaultsHash: stableJsonHash({
      threshold: 5,
      region: 'APAC',
    }),
    compiledAt: '2026-07-06T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
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
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    ownerLocator,
    ownerLocatorHash: hashOwnerLocator(ownerLocator),
    settingsHash: stableJsonHash({}),
    resolvedStatus: 'active',
    ...input,
  };
}

function kindToFolder(kind: string): string {
  if (kind === 'js-field') {
    return 'js-fields';
  }
  if (kind === 'js-action') {
    return 'js-actions';
  }
  if (kind === 'js-item') {
    return 'js-items';
  }
  if (kind === 'runjs') {
    return 'runjs';
  }
  return 'js-blocks';
}

export function createOwnerLocator(
  modelUid: string,
  input: {
    kind?: 'js-block' | 'js-field' | 'js-action' | 'js-item';
    use?: string;
  } = {},
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
  if (input.kind === 'js-item') {
    return {
      kind: 'flowModel.itemSettings',
      modelUid,
      use: input.use || 'JSItemModel',
      descriptor: 'Item model settings locator',
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
