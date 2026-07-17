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
  LightExtensionKind,
  LightExtensionReferenceOwnerAdapterContract,
  LightExtensionReferenceOwnerKind,
  LightExtensionReferenceOwnerLocator,
} from '../../shared/types';

export type ReferenceOwnerAdapter = LightExtensionReferenceOwnerAdapterContract & {
  stepPath?: ['stepParams', 'jsSettings'] | ['stepParams', 'jsSettings', 'runJs'];
  settingsKey?: 'jsSettings' | 'clickSettings';
  modelUses?: string[];
};

const JS_BLOCK_STEP_PATH: ['stepParams', 'jsSettings'] = ['stepParams', 'jsSettings'];
const JS_PAGE_STEP_PATH: ['stepParams', 'jsSettings', 'runJs'] = ['stepParams', 'jsSettings', 'runJs'];

const REFERENCE_OWNER_ADAPTERS: ReferenceOwnerAdapter[] = [
  {
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    title: 'JS Block',
    locatorContract: 'FlowModel JSBlockModel step settings locator',
    modelUse: 'JSBlockModel',
    stepPath: JS_BLOCK_STEP_PATH,
  },
  {
    kind: 'js-page',
    ownerKind: 'flowModel.pageSettings',
    title: 'JS Page',
    locatorContract: 'FlowModel JSPageModel page settings locator',
    modelUse: 'JSPageModel',
    stepPath: JS_PAGE_STEP_PATH,
  },
  {
    kind: 'js-field',
    ownerKind: 'flowModel.fieldSettings',
    title: 'JS Field',
    locatorContract: 'Field model settings locator',
    modelUse: 'JSFieldModel',
    modelUses: ['JSFieldModel', 'JSEditableFieldModel', 'JSColumnModel'],
  },
  {
    kind: 'js-action',
    ownerKind: 'flowModel.actionSettings',
    title: 'JS Action',
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
  },
  {
    kind: 'js-item',
    ownerKind: 'flowModel.itemSettings',
    title: 'JS Item',
    locatorContract: 'Item model settings locator',
    modelUse: 'JSItemModel',
    modelUses: ['JSItemModel', 'JSItemActionModel'],
  },
  {
    kind: 'runjs',
    ownerKind: 'flowModel.runjsHost',
    title: 'RunJS',
    locatorContract: 'RunJS value host locator for defaults, assignments, and linkage values',
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
  if (adapter && node.uid) {
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
      use: 'JSBlockModel',
      stepPath: adapter.stepPath || JS_BLOCK_STEP_PATH,
    };
  }

  return {
    kind: adapter.ownerKind,
    modelUid,
    use: normalizeString(modelUse) || adapter.modelUse,
    ...(adapter.stepPath ? { stepPath: adapter.stepPath } : {}),
    ...(hostPath?.length ? { hostPath: hostPath.map(String) } : {}),
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
    locatorContract: adapter.locatorContract,
    modelUse: adapter.modelUse,
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
