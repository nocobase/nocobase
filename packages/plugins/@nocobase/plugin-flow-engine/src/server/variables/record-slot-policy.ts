/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AnalyzedTemplate, PathSegment, VariablePathRef } from '../template/variable-expression';

export type RecordSlotPolicySource =
  | 'direct-record'
  | 'filter-form'
  | 'form-association'
  | 'form-record'
  | 'item-association'
  | 'popup-record'
  | 'view-record';

export type RecordSlotPolicy = Readonly<{
  slot: readonly PathSegment[];
  source: RecordSlotPolicySource;
}>;

export type RecordSlotPolicies = ReadonlyMap<string, RecordSlotPolicy>;

export type FlowModelVariableContract = Readonly<{
  allowedPaths: ReadonlySet<string>;
  recordSlots: RecordSlotPolicies;
}>;

export type ResolveFlowModelFieldKind = (
  dataSourceKey: string,
  collectionName: string,
  fieldPath: string,
) => 'association' | 'field' | undefined;

type FlowModelNode = Readonly<{
  parentId?: unknown;
  props?: Readonly<Record<string, unknown>>;
  stepParams?: Readonly<Record<string, unknown>>;
  subKey?: unknown;
  subModels?: Readonly<Record<string, unknown>>;
  uid?: unknown;
  use?: unknown;
}>;

type CompileRecordSlotPoliciesOptions = Readonly<{
  ancestorModels?: readonly unknown[];
  flowModel?: unknown;
  resolveFieldKind?: ResolveFlowModelFieldKind;
}>;

const NORMAL_FORM_USES = new Set([
  'CreateFormModel',
  'EditFormModel',
  'FormBlockModel',
  'FormModel',
  'PopupSubTableFormModel',
]);
const FORM_RECORD_USES = new Set(['EditFormModel', 'PopupSubTableFormModel']);
const DIRECT_ITEM_CONTEXT_USES = new Set(['SubFormFieldModel', 'SubFormListFieldModel']);
const RECORD_PICKER_OWNER_USES = new Set([
  'PopupSubTableFieldModel',
  'RecordPickerFieldModel',
  'SubFormListFieldModel',
  'SubTableFieldModel',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asFlowModelNode(value: unknown): FlowModelNode | undefined {
  return isObject(value) && typeof value.use === 'string' ? value : undefined;
}

function sameSegments(left: readonly PathSegment[], right: readonly PathSegment[]) {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function startsWithSegments(path: readonly PathSegment[], prefix: readonly PathSegment[]) {
  return prefix.length <= path.length && prefix.every((segment, index) => segment === path[index]);
}

function getLocalHosts(flowModel: unknown, path: VariablePathRef) {
  const hosts: FlowModelNode[] = [];
  let host = asFlowModelNode(flowModel);
  if (!host) return hosts;
  hosts.push(host);
  let index = 0;
  while (path.templatePath[index] === 'subModels' && typeof path.templatePath[index + 1] === 'string') {
    const child = host.subModels?.[path.templatePath[index + 1]];
    const arrayIndex = path.templatePath[index + 2];
    const candidate = asFlowModelNode(
      Array.isArray(child) && typeof arrayIndex === 'number' ? child[arrayIndex] : child,
    );
    if (!candidate) break;
    hosts.push(candidate);
    host = candidate;
    index += Array.isArray(child) ? 3 : 2;
  }
  return hosts;
}

function findHost(
  path: VariablePathRef,
  options: CompileRecordSlotPoliciesOptions,
  predicate: (node: FlowModelNode) => boolean,
) {
  const localHosts = getLocalHosts(options.flowModel, path);
  for (let index = localHosts.length - 1; index >= 0; index--) {
    if (predicate(localHosts[index])) return localHosts[index];
  }
  return options.ancestorModels?.map(asFlowModelNode).find((node) => !!node && predicate(node));
}

function getHosts(path: VariablePathRef, options: CompileRecordSlotPoliciesOptions) {
  return [
    ...getLocalHosts(options.flowModel, path).reverse(),
    ...(options.ancestorModels?.map(asFlowModelNode).filter((node): node is FlowModelNode => !!node) || []),
  ];
}

function getResource(host: FlowModelNode) {
  const resourceSettings = isObject(host.stepParams?.resourceSettings) ? host.stepParams.resourceSettings : undefined;
  const init = isObject(resourceSettings?.init) ? resourceSettings.init : undefined;
  const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey : 'main';
  const collectionName = typeof init?.collectionName === 'string' ? init.collectionName : '';
  return collectionName ? { collectionName, dataSourceKey } : undefined;
}

function getGridItems(host: FlowModelNode): readonly FlowModelNode[] {
  const grid = asFlowModelNode(host.subModels?.grid);
  const items = grid?.subModels?.items;
  return Array.isArray(items) ? items.map(asFlowModelNode).filter((item): item is FlowModelNode => !!item) : [];
}

function getFieldPath(item: FlowModelNode) {
  const fieldSettings = isObject(item.stepParams?.fieldSettings) ? item.stepParams.fieldSettings : undefined;
  const init = isObject(fieldSettings?.init) ? fieldSettings.init : undefined;
  const fieldPath = typeof init?.fieldPath === 'string' ? init.fieldPath : '';
  const associationPathName = typeof init?.associationPathName === 'string' ? init.associationPathName : '';
  return associationPathName && fieldPath && !fieldPath.includes('.')
    ? `${associationPathName}.${fieldPath}`
    : fieldPath || undefined;
}

function getItemOwnerField(owner: FlowModelNode | undefined, hosts: readonly FlowModelNode[]) {
  if (!owner) return undefined;
  const wrapper = hosts.find((host) => {
    if (host === owner) return false;
    const field = asFlowModelNode(host.subModels?.field);
    return (
      (typeof owner.parentId === 'string' && owner.parentId === host.uid) ||
      (typeof owner.uid === 'string' && field?.uid === owner.uid)
    );
  });
  for (const host of [owner, wrapper]) {
    const fieldSettings = isObject(host?.stepParams?.fieldSettings) ? host.stepParams.fieldSettings : undefined;
    const init = isObject(fieldSettings?.init) ? fieldSettings.init : undefined;
    const collectionName = typeof init?.collectionName === 'string' ? init.collectionName : '';
    const rawFieldPath = typeof init?.fieldPath === 'string' ? init.fieldPath : '';
    const associationPathName = typeof init?.associationPathName === 'string' ? init.associationPathName : '';
    const fieldPath =
      associationPathName && rawFieldPath && !rawFieldPath.includes('.')
        ? `${associationPathName}.${rawFieldPath}`
        : rawFieldPath;
    if (collectionName && fieldPath) {
      return {
        collectionName,
        dataSourceKey: typeof init?.dataSourceKey === 'string' ? init.dataSourceKey : 'main',
        fieldPath,
      };
    }
  }
  return undefined;
}

function getItemContexts(hosts: readonly FlowModelNode[]) {
  const contexts: Array<{ owner: FlowModelNode; valueEnabled: boolean }> = [];
  for (let index = 0; index < hosts.length; index++) {
    const host = hosts[index];
    const use = String(host.use);
    const child = hosts[index - 1];
    if (
      RECORD_PICKER_OWNER_USES.has(use) &&
      child?.use === 'BlockGridModel' &&
      child.subKey === 'grid-block' &&
      typeof host.uid === 'string' &&
      child.parentId === host.uid
    ) {
      contexts.push({ owner: host, valueEnabled: false });
    }
    if (DIRECT_ITEM_CONTEXT_USES.has(use)) {
      contexts.push({ owner: host, valueEnabled: true });
      continue;
    }
    const ownerUse =
      use === 'PopupSubTableFormModel'
        ? 'PopupSubTableFieldModel'
        : use === 'SubTableColumnModel'
          ? 'SubTableFieldModel'
          : undefined;
    if (ownerUse) {
      const owner = hosts.slice(index + 1).find((candidate) => candidate.use === ownerUse);
      if (owner) contexts.push({ owner, valueEnabled: true });
      continue;
    }
  }
  return contexts;
}

function compileFixedSlot(
  path: VariablePathRef,
  options: CompileRecordSlotPoliciesOptions,
): RecordSlotPolicy | undefined {
  const segments = path.runtimeSegments;
  if (['record', 'responseRecord', 'clickedRowRecord'].includes(path.varName)) {
    return { slot: Object.freeze([]), source: 'direct-record' };
  }
  if (path.varName === 'view' && segments[0] === 'record') {
    return { slot: Object.freeze(['record']), source: 'view-record' };
  }
  if (path.varName === 'popup') {
    let index = 0;
    while (segments[index] === 'parent') index += 1;
    if (segments[index] === 'record' || segments[index] === 'sourceRecord') {
      return { slot: Object.freeze(segments.slice(0, index + 1)), source: 'popup-record' };
    }
  }
  if (path.varName === 'item' && options.flowModel) {
    let index = 0;
    while (segments[index] === 'parentItem') index += 1;
    const itemFieldPath = segments[index + 1];
    if (segments[index] !== 'value' || typeof itemFieldPath !== 'string' || segments.length <= index + 2) {
      return undefined;
    }
    const hosts = getHosts(path, options);
    const contexts = getItemContexts(hosts);
    const context = contexts[index];
    if (context && !context.valueEnabled) return undefined;
    const crossedContexts = contexts.slice(0, Math.min(index + 1, contexts.length));
    if (
      crossedContexts.some(({ owner }) => {
        const field = getItemOwnerField(owner, hosts);
        return (
          !field ||
          options.resolveFieldKind?.(field.dataSourceKey, field.collectionName, field.fieldPath) !== 'association'
        );
      })
    ) {
      return undefined;
    }
    const ownerField = getItemOwnerField(context?.owner, hosts);
    const source =
      ownerField ||
      (index === contexts.length ? getItemOwnerField(contexts[contexts.length - 1]?.owner, hosts) : undefined);
    const fieldPath = ownerField ? `${ownerField.fieldPath}.${itemFieldPath}` : itemFieldPath;
    if (
      !source ||
      options.resolveFieldKind?.(source.dataSourceKey, source.collectionName, fieldPath) !== 'association'
    ) {
      return undefined;
    }
    return { slot: Object.freeze(segments.slice(0, index + 2)), source: 'item-association' };
  }
  return undefined;
}

function compileFormSlot(
  path: VariablePathRef,
  options: CompileRecordSlotPoliciesOptions,
): RecordSlotPolicy | undefined {
  if (path.varName !== 'formValues') return undefined;
  const host = findHost(path, options, (node) => NORMAL_FORM_USES.has(String(node.use)));
  const resource = host && getResource(host);
  const resolveFieldKind = options.resolveFieldKind;
  if (!host || !resource || !resolveFieldKind) return undefined;

  let configured: { fieldPath: string; slot: string[] } | undefined;
  for (const item of getGridItems(host)) {
    const fieldPath = getFieldPath(item);
    if (!fieldPath) continue;
    const slot = fieldPath.split('.').filter(Boolean);
    if (startsWithSegments(path.runtimeSegments, slot) && (!configured || slot.length > configured.slot.length)) {
      configured = { fieldPath, slot };
    }
  }
  if (configured) {
    if (resolveFieldKind(resource.dataSourceKey, resource.collectionName, configured.fieldPath) !== 'association') {
      return undefined;
    }
    return { slot: Object.freeze(configured.slot), source: 'form-association' };
  }

  const top = path.runtimeSegments[0];
  if (
    typeof top === 'string' &&
    resolveFieldKind(resource.dataSourceKey, resource.collectionName, top) &&
    FORM_RECORD_USES.has(String(host.use))
  ) {
    return { slot: Object.freeze([]), source: 'form-record' };
  }
  return undefined;
}

function compileFilterFormSlot(
  path: VariablePathRef,
  options: CompileRecordSlotPoliciesOptions,
): RecordSlotPolicy | undefined {
  if (path.varName !== 'formValues') return undefined;
  const host = findHost(path, options, (node) => node.use === 'FilterFormBlockModel');
  const resource = host && getResource(host);
  const resolveFieldKind = options.resolveFieldKind;
  if (!host || !resource || !resolveFieldKind) return undefined;

  let configured: { fieldPaths: string[]; slot: string[] } | undefined;
  for (const item of getGridItems(host)) {
    const fieldPath = getFieldPath(item);
    const configuredName = typeof item.props?.name === 'string' && item.props.name ? item.props.name : undefined;
    const fieldName = configuredName || (fieldPath && item.uid ? `${fieldPath}_${String(item.uid)}` : undefined);
    if (!fieldName || !fieldPath) continue;
    const slot = fieldName.split('.').filter(Boolean);
    if (!startsWithSegments(path.runtimeSegments, slot) || path.runtimeSegments.length === slot.length) continue;
    if (!configured || slot.length > configured.slot.length) {
      configured = { fieldPaths: [fieldPath], slot };
    } else if (slot.length === configured.slot.length) {
      configured.fieldPaths.push(fieldPath);
    }
  }
  if (
    !configured ||
    configured.fieldPaths.some(
      (fieldPath) => resolveFieldKind(resource.dataSourceKey, resource.collectionName, fieldPath) !== 'association',
    )
  ) {
    return undefined;
  }
  return { slot: Object.freeze(configured.slot), source: 'filter-form' };
}

function compilePathSlot(path: VariablePathRef, options: CompileRecordSlotPoliciesOptions) {
  return compileFixedSlot(path, options) || compileFilterFormSlot(path, options) || compileFormSlot(path, options);
}

export function compileRecordSlotPolicies(
  analysis: Pick<AnalyzedTemplate, 'paths'>,
  options: CompileRecordSlotPoliciesOptions = {},
): RecordSlotPolicies {
  const occurrences = new Map<string, Array<RecordSlotPolicy | undefined>>();
  for (const path of analysis.paths) {
    const policies = occurrences.get(path.canonicalKey) || [];
    policies.push(compilePathSlot(path, options));
    occurrences.set(path.canonicalKey, policies);
  }

  const result = new Map<string, RecordSlotPolicy>();
  for (const [canonicalKey, policies] of occurrences) {
    const first = policies[0];
    if (!first || policies.some((policy) => !policy || !sameSegments(policy.slot, first.slot))) continue;
    result.set(canonicalKey, Object.freeze({ slot: first.slot, source: first.source }));
  }
  return result;
}

export function createFlowModelVariableContract(
  analysis: AnalyzedTemplate,
  options: CompileRecordSlotPoliciesOptions = {},
): FlowModelVariableContract {
  return Object.freeze({
    allowedPaths: new Set(analysis.paths.map((path) => path.canonicalKey)),
    recordSlots: compileRecordSlotPolicies(analysis, options),
  });
}
