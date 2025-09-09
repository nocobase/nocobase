/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import type { JSONValue } from './params-resolvers';
import type { Collection } from '../data-source';
import { createCollectionContextMeta } from './createRecordProxyContext';
import { buildServerContextParams, type RecordRef, type ServerContextParams } from '../utils/serverContextParams';
import {
  extractUsedVariableNames as _extractUsedVariableNames,
  extractUsedVariablePaths as _extractUsedVariablePaths,
} from '@nocobase/utils/client';

// Narrowest resource shape we rely on for inference
type ResourceLike = {
  getResourceName?: () => string;
  getDataSourceKey?: () => string | undefined;
  getFilterByTk?: () => unknown;
  getSourceId?: () => unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getResource(ctx: FlowContext): ResourceLike | undefined {
  const r = (ctx as FlowContext)['resource'];
  return isObject(r) ? (r as ResourceLike) : undefined;
}

type CollectionShape = { name?: string; dataSourceKey?: string };

function getCollection(ctx: FlowContext): CollectionShape | undefined {
  const c = (ctx as FlowContext)['collection'] as unknown;
  if (isObject(c)) {
    const mc = c as Partial<CollectionShape>;
    return { name: mc.name, dataSourceKey: mc.dataSourceKey };
  }
  return undefined;
}

export function inferRecordRef(ctx: FlowContext): RecordRef | undefined {
  const resource = getResource(ctx);
  const collectionObj = getCollection(ctx);

  const resourceName = collectionObj?.name || resource?.getResourceName?.();
  const dataSourceKey = collectionObj?.dataSourceKey || resource?.getDataSourceKey?.();
  const filterByTk = resource?.getFilterByTk?.();

  if (!resourceName || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
  const parts = String(resourceName).split('.');
  const collection = parts[parts.length - 1];
  return { collection, dataSourceKey, filterByTk };
}

export function inferParentRecordRef(ctx: FlowContext): RecordRef | undefined {
  const resource = getResource(ctx);
  const dataSourceKey = getCollection(ctx)?.dataSourceKey || resource?.getDataSourceKey?.();
  const rn = resource?.getResourceName?.();
  const sourceId = resource?.getSourceId?.();
  if (!rn || typeof sourceId === 'undefined' || sourceId === null) return undefined;
  const parts = String(rn).split('.');
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
  const base = await createCollectionContextMeta(collectionAccessor, title)();
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
): PropertyMetaFactory {
  const title = (ctx as any)?.t?.('Current record') || 'Current record';
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
  try {
    const usage = _extractUsedVariablePaths(template) || {};
    const varNames = Object.keys(usage);
    if (!varNames.length) return undefined;

    const input: Record<string, any> = {};
    for (const key of varNames) {
      const opt = (ctx as any).getPropertyOptions?.(key);
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
        // 使用 void 引用以避免 no-unused-vars，同时避免空代码块触发 no-empty
        void err;
        continue;
      }
      if (built) {
        input[key] = built;
      }
    }
    return buildServerContextParams(ctx, input);
  } catch (_) {
    return undefined;
  }
}
