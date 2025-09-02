/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta } from '../flowContext';
import type { JSONValue } from './params-resolvers';
import type { Collection } from '../data-source';
import { createCollectionContextMeta } from './createRecordProxyContext';
import type { RecordRef } from '../utils/serverContextParams';

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
 * Extract top-level ctx variable names used inside a JSON template.
 * Supports dot and bracket notations, e.g. {{ ctx.record.id }}, {{ ctx['parentRecord'].name }}.
 */
export function extractUsedVariableNames(template: JSONValue): Set<string> {
  const result = new Set<string>();
  const visit = (src: any) => {
    if (typeof src === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(src)) !== null) {
        const expr = m[1];
        // ctx.<var>
        const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let pm: RegExpExecArray | null;
        while ((pm = pathRegex.exec(expr)) !== null) {
          result.add(pm[1]);
        }
        // ctx['var'] or ctx["var"]
        const bracketVarRegex = /ctx\[\s*(["'])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\1\s*\]/g;
        let bm: RegExpExecArray | null;
        while ((bm = bracketVarRegex.exec(expr)) !== null) {
          result.add(bm[2]);
        }
      }
    } else if (Array.isArray(src)) {
      src.forEach(visit);
    } else if (src && typeof src === 'object') {
      Object.values(src).forEach(visit);
    }
  };
  visit(template);
  return result;
}

/**
 * Extract used top-level ctx variables with their subpaths.
 * Returns a map: varName -> string[] subPaths
 * Examples:
 *  - {{ ctx.user.id }}        => { user: ['id'] }
 *  - {{ ctx['user'].roles[0].name }} => { user: ['roles[0].name'] }
 *  - {{ ctx.view.record.id }} => { view: ['record.id'] }
 *  - {{ ctx.twice(21) }}      => { twice: [''] } // method call -> empty subPath
 */
export function extractUsedVariablePaths(template: JSONValue): Record<string, string[]> {
  const usage: Record<string, string[]> = {};
  const visit = (src: any) => {
    if (typeof src === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(src)) !== null) {
        const expr = m[1];
        // Dot notation: ctx.varName[...]
        const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)([^\s)]*)/g;
        let pm: RegExpExecArray | null;
        while ((pm = pathRegex.exec(expr)) !== null) {
          const varName = pm[1];
          const after = pm[2] || '';
          usage[varName] = usage[varName] || [];
          if (after.startsWith('.')) {
            usage[varName].push(after.slice(1));
          } else if (after.startsWith('[')) {
            // bracket first segment, normalize
            const mm = after.match(/^\[\s*(["'])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
            if (mm) {
              const first = mm[2];
              const rest = mm[3] || '';
              usage[varName].push(`${first}${rest}`);
            } else {
              const mn = after.match(/^\[(\d+)\](.*)$/);
              if (mn) {
                const idx = mn[1];
                const rest = mn[2] || '';
                usage[varName].push(`[${idx}]${rest}`);
              }
            }
          } else if (after.startsWith('(')) {
            if (!usage[varName].length) usage[varName].push('');
          }
        }
        // Bracket var: ctx["varName"]...
        const bracketVarRegex = /ctx\[\s*(["'])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\1\s*\]([^\s)]*)/g;
        let bm: RegExpExecArray | null;
        while ((bm = bracketVarRegex.exec(expr)) !== null) {
          const varName = bm[2];
          const after = bm[3] || '';
          usage[varName] = usage[varName] || [];
          if (after.startsWith('.')) {
            usage[varName].push(after.slice(1));
          } else if (after.startsWith('[')) {
            const mm = after.match(/^\[\s*(["'])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
            if (mm) {
              const first = mm[2];
              const rest = mm[3] || '';
              usage[varName].push(`${first}${rest}`);
            } else {
              const mn = after.match(/^\[(\d+)\](.*)$/);
              if (mn) {
                const idx = mn[1];
                const rest = mn[2] || '';
                usage[varName].push(`[${idx}]${rest}`);
              }
            }
          } else if (after.startsWith('(')) {
            if (!usage[varName].length) usage[varName].push('');
          }
        }
      }
    } else if (Array.isArray(src)) {
      src.forEach(visit);
    } else if (src && typeof src === 'object') {
      Object.values(src).forEach(visit);
    }
  };
  visit(template);
  return usage;
}
