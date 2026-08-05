/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import FlowModelRepository from '../repository';
import type {
  RecordSlotResolverInput,
  RecordSlotResolverRegistration,
  RecordSlotResolverResult,
} from './record-slot-resolvers';

type FlowModelOptions = Readonly<{
  stepParams?: unknown;
  subModels?: unknown;
}>;

type ResourceTarget = Readonly<{
  associationName?: string;
  collection: string;
  dataSourceKey: string;
}>;

type CollectionRef = Readonly<{
  collection: unknown;
  collectionName: string;
  dataSourceKey: string;
}>;

type AssociationEdge = Readonly<{
  source: CollectionRef;
  target: CollectionRef;
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getModelOptions(value: unknown): FlowModelOptions | undefined {
  if (!isObject(value)) return undefined;
  return (isObject(value.options) ? value.options : value) as FlowModelOptions;
}

function getNodeString(value: unknown, key: 'parentId' | 'subKey' | 'uid'): string | undefined {
  if (!isObject(value)) return undefined;
  const nodeValue = value[key];
  return typeof nodeValue === 'string' && nodeValue ? nodeValue : undefined;
}

function getStepInit(options: FlowModelOptions, flowKey: string) {
  if (!isObject(options.stepParams)) return undefined;
  const step = options.stepParams[flowKey];
  return isObject(step) && isObject(step.init) ? step.init : undefined;
}

function readString(target: unknown, key: string) {
  if (!isObject(target)) return undefined;
  const direct = target[key];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const options = target.options;
  const nested = isObject(options) ? options[key] : undefined;
  return typeof nested === 'string' && nested.trim() ? nested.trim() : undefined;
}

function callMethod(target: unknown, name: string, ...args: unknown[]) {
  if (!isObject(target) || typeof target[name] !== 'function') return undefined;
  return (target[name] as (...methodArgs: unknown[]) => unknown).apply(target, args);
}

function getResourceTarget(options: FlowModelOptions): ResourceTarget | undefined {
  const init = getStepInit(options, 'resourceSettings');
  const collection = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
  const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : 'main';
  const associationName = typeof init?.associationName === 'string' ? init.associationName.trim() : undefined;
  if (!collection || !dataSourceKey || (typeof init?.associationName === 'string' && !associationName)) {
    return undefined;
  }
  return { collection, dataSourceKey, ...(associationName ? { associationName } : {}) };
}

function getFieldTarget(
  input: RecordSlotResolverInput,
  source: CollectionRef,
  fieldName: string,
): AssociationEdge | undefined {
  const field = callMethod(source.collection, 'getField', fieldName);
  const association = callMethod(field, 'isAssociationField') === true || callMethod(field, 'isRelationField') === true;
  if (!association) return undefined;

  const rawTargetCollection = isObject(field) ? field.targetCollection : undefined;
  const targetCollection =
    typeof rawTargetCollection === 'function' ? rawTargetCollection.call(field) : rawTargetCollection;
  const collectionName = readString(targetCollection, 'name') || readString(field, 'target');
  const dataSourceKey = readString(targetCollection, 'dataSourceKey') || source.dataSourceKey;
  const collection = targetCollection || (collectionName && input.getCollection?.(dataSourceKey, collectionName));
  if (!collectionName || !collection) return undefined;
  return { source, target: { collection, collectionName, dataSourceKey } };
}

function resolveAssociationPath(
  input: RecordSlotResolverInput,
  source: CollectionRef,
  path: readonly string[],
): AssociationEdge | undefined {
  let current = source;
  let edge: AssociationEdge | undefined;
  for (const segment of path) {
    edge = getFieldTarget(input, current, segment);
    if (!edge) return undefined;
    current = edge.target;
  }
  return edge;
}

function resolveResourceCollection(
  input: RecordSlotResolverInput,
  resource: ResourceTarget,
): CollectionRef | undefined {
  let sourceName = resource.collection;
  const associationPath = resource.associationName?.split('.').filter(Boolean) || [];
  if (associationPath.length > 1) sourceName = associationPath.shift() || sourceName;
  const collection = input.getCollection?.(resource.dataSourceKey, sourceName);
  if (!collection) return undefined;
  const source = { collection, collectionName: sourceName, dataSourceKey: resource.dataSourceKey };
  return associationPath.length ? resolveAssociationPath(input, source, associationPath)?.target : source;
}

function getSubModel(options: FlowModelOptions, name: string): unknown {
  return isObject(options.subModels) ? options.subModels[name] : undefined;
}

function getFormItems(form: FlowModelOptions): readonly FlowModelOptions[] | undefined {
  const grid = getModelOptions(getSubModel(form, 'grid'));
  if (!grid) return undefined;
  const items = getSubModel(grid, 'items');
  return Array.isArray(items)
    ? items.map(getModelOptions).filter((item): item is FlowModelOptions => !!item)
    : undefined;
}

function getFieldPath(options: FlowModelOptions) {
  const init = getStepInit(options, 'fieldSettings');
  const fieldPath = typeof init?.fieldPath === 'string' ? init.fieldPath.trim() : '';
  const associationPath = typeof init?.associationPathName === 'string' ? init.associationPathName.trim() : '';
  if (!fieldPath) return undefined;
  if (!associationPath || fieldPath === associationPath || fieldPath.startsWith(`${associationPath}.`))
    return fieldPath;
  return `${associationPath}.${fieldPath}`;
}

function getFieldSource(input: RecordSlotResolverInput, options: FlowModelOptions): CollectionRef | undefined {
  const init = getStepInit(options, 'fieldSettings');
  const collectionName = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
  const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : 'main';
  const collection = collectionName && dataSourceKey ? input.getCollection?.(dataSourceKey, collectionName) : undefined;
  return collection ? { collection, collectionName, dataSourceKey } : undefined;
}

function isJsonField(field: unknown) {
  return ['json', 'jsonb'].includes(
    String(readString(field, 'type') || readString(field, 'interface') || '').toLowerCase(),
  );
}

function pathStartsWith(path: readonly (string | number)[], prefix: readonly string[]) {
  return prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment);
}

function resolved(slot: readonly (string | number)[]): RecordSlotResolverResult {
  return { status: 'resolved', slot };
}

async function getLineage(input: RecordSlotResolverInput) {
  const ancestors = input.loadAncestors ? await input.loadAncestors() : [];
  const lineage = [input.currentNode, ...ancestors].filter((node): node is unknown => !!node);
  for (let index = 0; index + 1 < lineage.length; index++) {
    const parentId = getNodeString(lineage[index], 'parentId');
    const parentUid = getNodeString(lineage[index + 1], 'uid');
    if (parentId && parentUid && parentId !== parentUid) throw new Error('Invalid FlowModel lineage');
  }
  return lineage;
}

async function loadModelTree(input: RecordSlotResolverInput, node: unknown) {
  const options = getModelOptions(node);
  if (options && getFormItems(options)) return options;
  const uid = isObject(node) && typeof node.uid === 'string' ? node.uid : undefined;
  if (!uid || !input.ctx) return undefined;
  const repository = input.ctx.db.getCollection('flowModels').repository as FlowModelRepository;
  return getModelOptions(await repository.findModelById(uid, { includeAsyncNode: true }));
}

async function findFormProvider(input: RecordSlotResolverInput, lineage: readonly unknown[]) {
  for (const node of lineage) {
    const options = getModelOptions(node);
    if (!options || (!getFormItems(options) && !getResourceTarget(options))) continue;
    const form = await loadModelTree(input, node);
    const items = form && getFormItems(form);
    if (!form || !items) continue;
    const resource = getResourceTarget(form);
    return resource ? { collection: resolveResourceCollection(input, resource), items } : undefined;
  }
  return undefined;
}

function getConfiguredAssociationSlots(
  input: RecordSlotResolverInput,
  source: CollectionRef,
  items: readonly FlowModelOptions[],
) {
  const slots = new Map<string, readonly string[]>();
  const fieldPaths: string[][] = [];
  for (const item of items) {
    const fieldPath = getFieldPath(item)?.split('.').filter(Boolean) || [];
    if (fieldPath.length) fieldPaths.push(fieldPath);
    let current = source;
    const prefix: string[] = [];
    for (const segment of fieldPath) {
      const edge = getFieldTarget(input, current, segment);
      if (!edge) break;
      prefix.push(segment);
      slots.set(prefix.join('.'), [...prefix]);
      current = edge.target;
    }
  }
  return { fieldPaths, slots: [...slots.values()] };
}

async function resolveFormValues(input: RecordSlotResolverInput): Promise<RecordSlotResolverResult> {
  const lineage = await getLineage(input);
  const provider = await findFormProvider(input, lineage);
  if (!provider) return { status: 'abstain' };
  if (!provider.collection) return { status: 'deny' };

  const runtimePath = input.path.runtimeSegments;
  const configuredSlots = getConfiguredAssociationSlots(input, provider.collection, provider.items);
  let configured: readonly string[] | undefined;
  for (const slot of configuredSlots.slots) {
    if (pathStartsWith(runtimePath, slot) && (!configured || slot.length > configured.length)) configured = slot;
  }
  if (configured) return resolved(configured);

  const top = runtimePath[0];
  if (typeof top !== 'string') return runtimePath.length ? { status: 'deny' } : resolved([]);
  const field = callMethod(provider.collection.collection, 'getField', top);
  const configuredField = configuredSlots.fieldPaths.some(
    (fieldPath) =>
      pathStartsWith(runtimePath, fieldPath) ||
      (runtimePath.length <= fieldPath.length && runtimePath.every((segment, index) => fieldPath[index] === segment)),
  );
  return field && !isJsonField(field) && !configuredField ? resolved([]) : { status: 'deny' };
}

function sameCollection(left: CollectionRef, right: CollectionRef) {
  return left.dataSourceKey === right.dataSourceKey && left.collectionName === right.collectionName;
}

function getAssociationEdge(input: RecordSlotResolverInput, options: FlowModelOptions): AssociationEdge | undefined {
  const source = getFieldSource(input, options);
  const fullPath = getFieldPath(options)?.split('.').filter(Boolean);
  if (!source || !fullPath?.length) return undefined;
  return resolveAssociationPath(input, source, fullPath);
}

function hasItemProviderBranch(lineage: readonly unknown[], providerIndex: number) {
  return (
    providerIndex === 0 ||
    lineage.slice(0, providerIndex).some((node) => ['grid', 'popup'].includes(getNodeString(node, 'subKey') || ''))
  );
}

function getItemCollectionChain(input: RecordSlotResolverInput, lineage: readonly unknown[]) {
  const edges: AssociationEdge[] = [];
  for (const [index, node] of lineage.entries()) {
    const options = getModelOptions(node);
    const edge = options && getAssociationEdge(input, options);
    if (!edge || !hasItemProviderBranch(lineage, index)) continue;
    const previous = edges[edges.length - 1];
    if (previous && sameCollection(previous.source, edge.source) && sameCollection(previous.target, edge.target))
      continue;
    edges.push(edge);
  }
  if (!edges.length) return [];

  const collections = [edges[0].target, edges[0].source];
  let edgeIndex = 1;
  while (edgeIndex < edges.length) {
    const parent = collections[collections.length - 1];
    const matches = edges.slice(edgeIndex).filter((edge) => sameCollection(edge.target, parent));
    if (!matches.length) break;
    if (matches.some((edge) => !sameCollection(edge.source, matches[0].source))) return [];
    collections.push(matches[0].source);
    edgeIndex = edges.indexOf(matches[0], edgeIndex) + 1;
  }
  return collections;
}

async function resolveItem(input: RecordSlotResolverInput): Promise<RecordSlotResolverResult> {
  const runtimePath = input.path.runtimeSegments;
  let parentDepth = 0;
  while (runtimePath[parentDepth] === 'parentItem') parentDepth += 1;
  if (runtimePath[parentDepth] !== 'value') return { status: 'abstain' };
  const associationName = runtimePath[parentDepth + 1];
  if (typeof associationName !== 'string') return { status: 'abstain' };

  const collections = getItemCollectionChain(input, await getLineage(input));
  const collection = collections[parentDepth];
  if (!collection || !getFieldTarget(input, collection, associationName)) return { status: 'deny' };
  return resolved([...runtimePath.slice(0, parentDepth + 1), associationName]);
}

export function createFormItemRecordSlotResolvers(): readonly RecordSlotResolverRegistration[] {
  return [
    {
      owner: '@nocobase/plugin-flow-engine',
      id: 'form:values',
      match: (path) => path.varName === 'formValues',
      needsAncestors: true,
      resolve: resolveFormValues,
    },
    {
      owner: '@nocobase/plugin-flow-engine',
      id: 'form:item',
      match: (path) => path.varName === 'item',
      needsAncestors: true,
      resolve: resolveItem,
    },
  ];
}
