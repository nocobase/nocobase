/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta } from '../flowContext';
import { inferRecordRef, buildRecordMeta } from '../utils/variablesParams';

function makeMetaFromValue(value: any, title?: string): any {
  const t = typeof value;
  if (value === null || value === undefined) return { type: 'any', title };
  if (Array.isArray(value)) {
    return { type: 'array', title };
  }
  if (t === 'string') return { type: 'string', title };
  if (t === 'number') return { type: 'number', title };
  if (t === 'boolean') return { type: 'boolean', title };
  if (t === 'object') {
    const props: Record<string, any> = {};
    Object.keys(value || {}).forEach((k) => {
      props[k] = makeMetaFromValue(value[k], k);
    });
    return { type: 'object', title, properties: props };
  }
  return { type: 'any', title };
}

function buildNavigationMeta(): any {
  return {
    type: 'object',
    title: 'Navigation',
    properties: {
      current: {
        type: 'object',
        title: 'Current',
        properties: {
          viewUid: { type: 'string', title: 'viewUid' },
          tabUid: { type: 'string', title: 'tabUid' },
          filterByTk: { type: 'string', title: 'filterByTk' },
          sourceId: { type: 'string', title: 'sourceId' },
        },
      },
      viewStack: { type: 'array', title: 'View stack' },
    },
  };
}

/**
 * Create a meta factory for ctx.view that includes:
 * - buildVariablesParams: { record } via inferRecordRef
 * - properties.record: full collection meta via buildRecordMeta
 * - type/preventClose/inputArgs/navigation fields for better variable selection UX
 */
export function createViewMeta(ctx: FlowContext, getView: () => any): () => Promise<PropertyMeta> {
  return async () => {
    const recordMeta = await buildRecordMeta(
      () => {
        try {
          const ref = inferRecordRef(ctx);
          if (!ref?.collection) return null;
          const ds = ctx.dataSourceManager?.getDataSource?.(ref.dataSourceKey || 'main');
          return ds?.collectionManager?.getCollection?.(ref.collection) || null;
        } catch (e) {
          return null;
        }
      },
      'View record',
      (c) => inferRecordRef(c),
    );

    const view = getView();
    return {
      type: 'object',
      title: 'View',
      buildVariablesParams: (c) => {
        const ref = inferRecordRef(c);
        return ref ? { record: ref } : undefined;
      },
      properties: async () => {
        const props: Record<string, any> = {};
        if (recordMeta) props.record = recordMeta;
        props.type = { type: 'string', title: 'Type' };
        props.preventClose = { type: 'boolean', title: 'Prevent close' };
        props.inputArgs = makeMetaFromValue(view?.inputArgs, 'Input args');
        props.navigation = buildNavigationMeta();
        return props;
      },
    } as PropertyMeta;
  };
}
