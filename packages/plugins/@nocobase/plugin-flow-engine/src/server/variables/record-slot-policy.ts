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

function getValueAtPath(value: unknown, path: readonly (string | number)[]) {
  let current = value;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') current = current[segment];
    else if (isObject(current)) current = current[String(segment)];
    else return undefined;
  }
  return current;
}

function getLocalHosts(flowModel: unknown, path: VariablePathRef) {
  const hosts: FlowModelNode[] = [];
  const root = asFlowModelNode(flowModel);
  if (root) hosts.push(root);
  for (let index = 1; index <= path.templatePath.length; index++) {
    const candidate = asFlowModelNode(getValueAtPath(flowModel, path.templatePath.slice(0, index)));
    if (candidate && candidate !== hosts[hosts.length - 1]) hosts.push(candidate);
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
  return typeof init?.fieldPath === 'string' && init.fieldPath ? init.fieldPath : undefined;
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
    if (segments[index] === 'value' && typeof segments[index + 1] === 'string' && segments.length > index + 2) {
      return { slot: Object.freeze(segments.slice(0, index + 2)), source: 'item-association' };
    }
  }
  return undefined;
}

function compileFormSlot(
  path: VariablePathRef,
  options: CompileRecordSlotPoliciesOptions,
): RecordSlotPolicy | undefined {
  if (path.varName !== 'formValues') return undefined;
  const host = findHost(path, options, (node) => NORMAL_FORM_USES.has(String(node.use)));
  const top = path.runtimeSegments[0];
  const resource = host && getResource(host);
  if (!host || !resource || typeof top !== 'string' || !options.resolveFieldKind) return undefined;

  const fieldKind = options.resolveFieldKind(resource.dataSourceKey, resource.collectionName, top);
  if (!fieldKind) return undefined;
  const configured = getGridItems(host).some((item) => getFieldPath(item)?.split('.')[0] === top);
  if (!configured) return { slot: Object.freeze([]), source: 'form-record' };
  if (fieldKind === 'association' && path.runtimeSegments.length > 1) {
    return { slot: Object.freeze([top]), source: 'form-association' };
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
  if (!host || !resource || !options.resolveFieldKind) return undefined;

  for (const item of getGridItems(host)) {
    const fieldPath = getFieldPath(item);
    const configuredName = typeof item.props?.name === 'string' && item.props.name ? item.props.name : undefined;
    const fieldName = configuredName || (fieldPath && item.uid ? `${fieldPath}_${String(item.uid)}` : undefined);
    if (!fieldName || !fieldPath) continue;
    const slot = fieldName.split('.').filter(Boolean);
    if (!startsWithSegments(path.runtimeSegments, slot) || path.runtimeSegments.length === slot.length) continue;
    if (options.resolveFieldKind(resource.dataSourceKey, resource.collectionName, fieldPath) !== 'association') {
      return undefined;
    }
    return { slot: Object.freeze(slot), source: 'filter-form' };
  }
  return undefined;
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
