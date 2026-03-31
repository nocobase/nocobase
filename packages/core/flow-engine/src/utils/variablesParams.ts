/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  extractUsedVariableNames as _extractUsedVariableNames,
  extractUsedVariablePaths as _extractUsedVariablePaths,
} from '@nocobase/shared';
import type { Collection } from '../data-source';
import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import { buildServerContextParams, type RecordRef, type ServerContextParams } from '../utils/serverContextParams';
import { createCollectionContextMeta } from './createCollectionContextMeta';
import { createAssociationSubpathResolver } from './associationObjectVariable';
import type { JSONValue } from './params-resolvers';
import _ from 'lodash';

// 从 FlowContext 中推断当前记录的 context params 信息
export function inferRecordRef(ctx: FlowContext): RecordRef | undefined {
  const resource = ctx.resource;
  const collectionObj = ctx.collection;
  const recordValue = ctx.record;

  const resourceName = collectionObj?.name || resource?.getResourceName?.();
  const dataSourceKey = collectionObj?.dataSourceKey || resource?.getDataSourceKey?.();
  const filterByTk = resource?.getFilterByTk?.() ?? collectionObj?.getFilterByTK?.(recordValue);

  if (!resourceName || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
  const parts = String(resourceName).split('.');
  const collection = parts[parts.length - 1];
  return { collection, dataSourceKey, filterByTk };
}

// 从 FlowContext.view 中推断记录的 context params 信息
export function inferViewRecordRef(ctx: FlowContext): RecordRef | undefined {
  const view = ctx.view;
  if (!view) return undefined;
  const inputArgs = (view as any)?.inputArgs || {};
  const collection = inputArgs?.collectionName || (view as any)?.record?.collection;
  const dataSourceKey = inputArgs?.dataSourceKey || (view as any)?.record?.dataSourceKey || 'main';
  const filterByTk = inputArgs?.filterByTk || (view as any)?.record?.filterByTk;
  const associationName = inputArgs?.associationName;
  const sourceId = inputArgs?.sourceId;
  if (!collection || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
  return { collection, dataSourceKey, filterByTk, sourceId, associationName };
}

// 统一视图场景中“视图记录”的本地复用逻辑：
// - 当视图 inputArgs.filterByTk 与父 FlowContext.record.filterByTk 一致时，
//   认为视图正在查看同一条记录，此时返回父记录的深拷贝作为 view.record；
// - 否则视为不同记录，不复用父记录（返回 undefined，让后续逻辑走服务端解析）。

export function getViewRecordFromParent(flowContext: FlowContext, viewContext: FlowContext): unknown {
  const parentRecord = flowContext.inputArgs?.record;
  const parentTk = flowContext.collection?.filterTargetKey;
  if (!parentRecord || !parentTk) return undefined;

  const view = viewContext.view;
  const viewFilterByTk = view?.inputArgs?.filterByTk;
  const recordFilterByTk = parentRecord[parentTk];

  // 仅当视图的 filterByTk 与父记录的 filterByTk 一致时，才复用父记录，
  // 否则视为不同记录，不返回本地记录（统一走服务端解析）。
  if (viewFilterByTk == null || recordFilterByTk == null) return undefined;
  if (viewFilterByTk !== recordFilterByTk) return undefined;

  return _.cloneDeep(parentRecord);
}

// 针对视图场景（Page/Dialog/Drawer），创建用于 view.resolveOnServer 的判定函数
export function createViewRecordResolveOnServer(
  ctx: FlowContext,
  getLocalRecord: () => unknown,
): (subPath: string) => boolean {
  return (p: string) => {
    if (!(p === 'record' || p.startsWith('record.'))) return false;
    const local = getLocalRecord();
    // 前端没有可用记录数据：统一走服务端
    if (!local) return true;

    // 直接访问整个 record 对象，使用前端值
    if (p === 'record') return false;

    // 仅在访问关联字段子路径时走服务端；非关联字段使用前端值
    const ref = inferViewRecordRef(ctx);
    const colName = ref?.collection;
    const dsKey = ref?.dataSourceKey || 'main';
    if (!colName) return true; // 未能推断集合，保守起见走服务端
    const ds = (
      ctx as FlowContext & { dataSourceManager?: { getDataSource?: (key: string) => any } }
    ).dataSourceManager?.getDataSource?.(dsKey);
    const collection = ds?.collectionManager?.getCollection?.(colName);
    if (!collection) return true; // 未找到集合定义，保守走服务端

    const resolver = createAssociationSubpathResolver(
      () => collection as Collection,
      () => local,
    );
    const subPath = p.startsWith('record.') ? p.slice('record.'.length) : '';
    if (!subPath) return false;
    return resolver(subPath);
  };
}

/**
 * 创建一个用于 “ctx.record” 变量的 resolveOnServer 判定函数：
 * - 若本地 record 不存在：统一走服务端；
 * - 若本地 record 存在：
 *   - 访问空子路径（"{{ ctx.record }}"）时使用本地值，不走服务端；
 *   - 访问非关联字段（如 id/title）：使用本地值；
 *   - 访问关联字段：
 *     - 若本地该字段无值（undefined/null），则交给服务端解析（无论是 "author" 还是 "author.name"）；
 *     - 若本地已有值，则仅在访问子属性且本地缺少该子属性值时交给服务端。
 */
export function createRecordResolveOnServerWithLocal(
  collectionAccessor: () => Collection | null,
  valueAccessor: () => unknown,
): (subPath: string) => boolean {
  const assocSubpathResolver = createAssociationSubpathResolver(collectionAccessor, () => valueAccessor());
  return (p: string) => {
    const local = valueAccessor();
    if (!local) return true;
    if (!p) return false;

    const collection = collectionAccessor() as any;

    // 访问关联字段整体：当本地该字段无值时，统一交给服务端
    if (!p.includes('.')) {
      const name = p;
      let field: any;
      if (collection) {
        if (typeof collection.getField === 'function') {
          field = collection.getField(name);
        }
        if (!field && typeof collection.getFields === 'function') {
          const fields = collection.getFields() || [];
          field = fields.find((f: any) => f?.name === name);
        }
      }
      const isAssoc = !!field?.isAssociationField?.();
      if (!isAssoc) return false;
      const value = (local as any)?.[name];
      if (value === undefined || value === null) return true;
      return false;
    }

    // 访问关联字段子属性：复用 associationSubpathResolver 的“本地优先 + 关联字段才走服务端”逻辑
    return assocSubpathResolver(p);
  };
}

export function inferParentRecordRef(ctx: FlowContext): RecordRef | undefined {
  const resource = ctx.resource;
  const dataSourceKey = ctx.collection?.dataSourceKey || resource?.getDataSourceKey?.();
  const resourceName = resource?.getResourceName?.();
  const sourceId = resource?.getSourceId?.();
  if (!resourceName || typeof sourceId === 'undefined' || sourceId === null) return undefined;
  const parts = String(resourceName).split('.');
  if (parts.length < 2) return undefined;
  return { collection: parts[0], dataSourceKey, filterByTk: sourceId };
}

export type RecordParamsBuilder = (ctx: FlowContext) => RecordRef | Promise<RecordRef> | undefined;

/**
 * Build a PropertyMeta for a record-like property with variablesParams included.
 */
export async function buildRecordMeta(
  collectionAccessor: () => Collection | null,
  title?: string,
  paramsBuilder?: RecordParamsBuilder,
): Promise<PropertyMeta | null> {
  const base = await createCollectionContextMeta(collectionAccessor, title, true)();
  if (!base) return null;
  return {
    ...base,
    buildVariablesParams: (ctx: FlowContext) => (paramsBuilder ? paramsBuilder(ctx) : inferRecordRef(ctx)),
  } as PropertyMeta;
}

/**
 * Convenience helper to create a PropertyMetaFactory for a record-like variable.
 * It sets the factory.title so UI can display an immediate label before lazy resolution.
 */
export function createRecordMetaFactory(
  collectionAccessor: () => Collection | null,
  title: string,
  paramsBuilder?: RecordParamsBuilder,
): PropertyMetaFactory {
  const factory: PropertyMetaFactory = async () => buildRecordMeta(collectionAccessor, title, paramsBuilder);
  factory.title = title;
  return factory;
}

/**
 * Sugar for the most common case: a current record meta bound to FlowContext.
 * - Title: t('Current record')
 * - Params: inferRecordRef(ctx)
 */
export function createCurrentRecordMetaFactory(
  ctx: FlowContext,
  collectionAccessor: () => Collection | null,
  options?: { title?: string },
): PropertyMetaFactory {
  const title = options?.title
    ? ctx.t?.(options.title) || options.title
    : ctx.t?.('Current record') || 'Current record';
  return createRecordMetaFactory(collectionAccessor, title, (c) => inferRecordRef(c));
}

/**
 * Extract top-level ctx variable names used inside a JSON template.
 * Supports dot and bracket notations, e.g. {{ ctx.record.id }}, {{ ctx['parentRecord'].name }}.
 */
export const extractUsedVariableNames = _extractUsedVariableNames;

/**
 * Extract used top-level ctx variables with their subpaths.
 * Returns a map: varName -> string[] subPaths
 * Examples:
 *  - {{ ctx.user.id }}        => { user: ['id'] }
 *  - {{ ctx['user'].roles[0].name }} => { user: ['roles[0].name'] }
 *  - {{ ctx.view.record.id }} => { view: ['record.id'] }
 *  - {{ ctx.twice(21) }}      => { twice: [''] } // method call -> empty subPath
 */
export const extractUsedVariablePaths = _extractUsedVariablePaths;

/**
 * 根据模板中用到的 ctx 变量，收集并构建服务端解析所需的 contextParams。
 * - 通过 FlowContext 的 PropertyMeta.buildVariablesParams 收集 RecordRef
 * - 仅包含模板中实际使用到的顶层变量键，避免无谓膨胀
 */
export async function collectContextParamsForTemplate(
  ctx: FlowContext,
  template: JSONValue,
): Promise<ServerContextParams | undefined> {
  const usage = _extractUsedVariablePaths(template) || {};
  const varNames = Object.keys(usage);
  if (!varNames.length) return undefined;

  const input: Record<string, any> = {};
  for (const key of varNames) {
    const opt = ctx.getPropertyOptions?.(key);
    const meta: PropertyMeta | (() => Promise<PropertyMeta | null> | PropertyMeta | null) | undefined = opt?.meta;
    if (!meta) continue;
    let built: any;
    try {
      const resolvedMeta = typeof meta === 'function' ? await (meta as any)() : (meta as any);
      const builder = resolvedMeta?.buildVariablesParams;
      if (typeof builder === 'function') {
        built = await builder(ctx);
      }
    } catch (err) {
      // 忽略构建变量参数时的异常，继续处理其他变量
      void err;
      continue;
    }
    if (built) {
      input[key] = built;
    }
  }
  return buildServerContextParams(ctx, input);
}
