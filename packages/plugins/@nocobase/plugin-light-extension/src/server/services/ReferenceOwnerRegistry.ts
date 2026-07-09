/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import type {
  LightExtensionFlowModelOwnerLocator,
  LightExtensionKind,
  LightExtensionReferenceOwnerAdapterContract,
  LightExtensionReferenceOwnerKind,
  LightExtensionReferenceOwnerLocator,
} from '../../shared/types';

export type ReferenceOwnerAdapter = LightExtensionReferenceOwnerAdapterContract & {
  stepPath?: ['stepParams', 'jsSettings'];
  settingsKey?: 'jsSettings' | 'clickSettings';
  modelUses?: string[];
};

const JS_BLOCK_STEP_PATH: ['stepParams', 'jsSettings'] = ['stepParams', 'jsSettings'];

const REFERENCE_OWNER_ADAPTERS: ReferenceOwnerAdapter[] = [
  {
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    title: 'JS Block',
    status: 'active',
    locatorContract: 'FlowModel JSBlockModel step settings locator',
    modelUse: 'JSBlockModel',
    stepPath: JS_BLOCK_STEP_PATH,
    message: 'Active adapter scans FlowModel JSBlockModel nodes and rebuilds references from persisted settings.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
  {
    kind: 'js-field',
    ownerKind: 'flowModel.fieldSettings',
    title: 'JS Field',
    status: 'active',
    locatorContract: 'Field model settings locator',
    modelUse: 'JSFieldModel',
    modelUses: ['JSFieldModel', 'JSEditableFieldModel', 'JSColumnModel'],
    implementationTask: '03-task-js-field-entry-end-to-end.md',
    message: 'Active adapter scans JS field display, editable field, and table column model settings.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
  {
    kind: 'js-action',
    ownerKind: 'flowModel.actionSettings',
    title: 'JS Action',
    status: 'active',
    locatorContract: 'Action model click settings locator',
    modelUse: 'JSActionModel',
    modelUses: [
      'JSActionModel',
      'JSRecordActionModel',
      'JSCollectionActionModel',
      'JSFormActionModel',
      'FilterFormJSActionModel',
    ],
    settingsKey: 'clickSettings',
    implementationTask: '04-task-js-action-entry-end-to-end.md',
    message:
      'Active adapter scans JS action button click settings across normal, record, collection, form, and filter form actions.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
  {
    kind: 'js-item',
    ownerKind: 'flowModel.itemSettings',
    title: 'JS Item',
    status: 'active',
    locatorContract: 'Item model settings locator',
    modelUse: 'JSItemModel',
    modelUses: ['JSItemModel', 'JSItemActionModel'],
    implementationTask: '05-task-js-item-entry-end-to-end.md',
    message: 'Active adapter scans JS item display and action-item model settings.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
  {
    kind: 'runjs',
    ownerKind: 'flowModel.runjsHost',
    title: 'RunJS',
    status: 'active',
    locatorContract: 'RunJS value host locator for field linkage, defaults, and assignment forms',
    implementationTask: '06-task-runjs-entry-end-to-end.md',
    message: 'Active adapter scans nested RunJSValue hosts and rebuilds references with per-host locators.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
  {
    kind: 'event',
    ownerKind: 'flowModel.eventSettings',
    title: 'Event',
    status: 'placeholder',
    locatorContract: 'Lifecycle event settings locator',
    implementationTask: '07-task-event-entry-end-to-end.md',
    message: 'Waiting for the Event host task to provide concrete lifecycle event locators and save hooks.',
    supportsVersionPolicy: true,
    supportsImpact: true,
    supportsBulkUpgrade: true,
    supportsRebuild: true,
  },
];

export const JS_BLOCK_REFERENCE_OWNER_ADAPTER = REFERENCE_OWNER_ADAPTERS[0];

export function listReferenceOwnerAdapters(): LightExtensionReferenceOwnerAdapterContract[] {
  return REFERENCE_OWNER_ADAPTERS.map(toPublicOwnerAdapterContract);
}

export function getReferenceOwnerAdapterByKind(kind: string): ReferenceOwnerAdapter | undefined {
  return REFERENCE_OWNER_ADAPTERS.find((adapter) => adapter.kind === kind);
}

export function getReferenceOwnerAdapterByUse(use: string): ReferenceOwnerAdapter | undefined {
  return REFERENCE_OWNER_ADAPTERS.find((adapter) => adapter.modelUse === use || adapter.modelUses?.includes(use));
}

export function getReferenceOwnerAdapterByOwnerKind(ownerKind: string): ReferenceOwnerAdapter | undefined {
  return REFERENCE_OWNER_ADAPTERS.find((adapter) => adapter.ownerKind === ownerKind);
}

export function collectReferenceOwnerNodes<
  TNode extends { uid?: string; use?: string; subModels?: Record<string, unknown> },
>(
  node: TNode | null | undefined,
  bucket: Array<{ adapter: ReferenceOwnerAdapter; node: TNode }> = [],
): Array<{ adapter: ReferenceOwnerAdapter; node: TNode }> {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  const adapter = getReferenceOwnerAdapterByUse(typeof node.use === 'string' ? node.use : '');
  if (adapter?.status === 'active' && node.uid) {
    bucket.push({ adapter, node });
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of Array.isArray(value) ? value : value ? [value] : []) {
      collectReferenceOwnerNodes(child as TNode, bucket);
    }
  }
  return bucket;
}

export function buildReferenceOwnerLocator(
  adapter: ReferenceOwnerAdapter,
  modelUid: string,
  modelUse?: string,
  hostPath?: Array<string | number>,
): LightExtensionReferenceOwnerLocator {
  if (adapter.ownerKind === 'flowModel.step') {
    return {
      kind: adapter.ownerKind,
      modelUid,
      use: adapter.modelUse === 'JSBlockModel' ? 'JSBlockModel' : 'JSBlockModel',
      stepPath: adapter.stepPath || JS_BLOCK_STEP_PATH,
    };
  }

  return {
    kind: adapter.ownerKind,
    modelUid,
    use: normalizeString(modelUse) || adapter.modelUse,
    hostPath: hostPath?.length ? hostPath.map(String) : undefined,
    descriptor: adapter.locatorContract,
  };
}

export function normalizeReferenceOwnerLocator(value: unknown): LightExtensionReferenceOwnerLocator | null {
  if (!isPlainRecord(value)) {
    return null;
  }
  const ownerKind = normalizeString(value.kind);
  const adapter = getReferenceOwnerAdapterByOwnerKind(ownerKind);
  if (!adapter) {
    return null;
  }
  const modelUid = normalizeString(value.modelUid);
  if (!modelUid) {
    return null;
  }
  if (adapter.ownerKind === 'flowModel.step') {
    return buildReferenceOwnerLocator(adapter, modelUid);
  }

  return {
    kind: adapter.ownerKind as Exclude<LightExtensionReferenceOwnerKind, 'flowModel.step'>,
    modelUid,
    use: normalizeString(value.use) || undefined,
    stepPath: Array.isArray(value.stepPath) ? value.stepPath.map(String) : undefined,
    hostPath: Array.isArray(value.hostPath) ? value.hostPath.map(String) : undefined,
    descriptor: normalizeString(value.descriptor) || adapter.locatorContract,
  };
}

export function isFlowModelStepOwnerLocator(
  ownerLocator: LightExtensionReferenceOwnerLocator,
): ownerLocator is LightExtensionFlowModelOwnerLocator {
  return ownerLocator.kind === 'flowModel.step';
}

export function getReferenceOwnerModelUid(ownerLocator: LightExtensionReferenceOwnerLocator): string {
  return normalizeString(ownerLocator.modelUid);
}

export function hashReferenceOwnerLocator(ownerLocator: LightExtensionReferenceOwnerLocator): string {
  return stableJsonHash(toOwnerLocatorHashIdentity(ownerLocator));
}

export function stableJsonHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableSerialize(value)).digest('hex')}`;
}

function toPublicOwnerAdapterContract(adapter: ReferenceOwnerAdapter): LightExtensionReferenceOwnerAdapterContract {
  return {
    kind: adapter.kind as LightExtensionKind,
    ownerKind: adapter.ownerKind,
    title: adapter.title,
    status: adapter.status,
    locatorContract: adapter.locatorContract,
    modelUse: adapter.modelUse,
    implementationTask: adapter.implementationTask,
    message: adapter.message,
    supportsVersionPolicy: adapter.supportsVersionPolicy,
    supportsImpact: adapter.supportsImpact,
    supportsBulkUpgrade: adapter.supportsBulkUpgrade,
    supportsRebuild: adapter.supportsRebuild,
  };
}

function toOwnerLocatorHashIdentity(ownerLocator: LightExtensionReferenceOwnerLocator): Record<string, unknown> {
  if (ownerLocator.kind === 'flowModel.step') {
    return {
      kind: ownerLocator.kind,
      modelUid: ownerLocator.modelUid,
      use: ownerLocator.use,
      stepPath: ownerLocator.stepPath,
    };
  }

  return {
    kind: ownerLocator.kind,
    modelUid: ownerLocator.modelUid,
    ...(ownerLocator.use ? { use: ownerLocator.use } : {}),
    ...(ownerLocator.stepPath?.length ? { stepPath: ownerLocator.stepPath } : {}),
    ...(ownerLocator.hostPath?.length ? { hostPath: ownerLocator.hostPath } : {}),
  };
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

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
