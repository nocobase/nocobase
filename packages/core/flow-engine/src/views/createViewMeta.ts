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
    // 为数组提供索引子节点，最多展示前 10 项，便于继续向下遍历
    const max = Math.min(value.length || 0, 10);
    const children: Record<string, any> = {};
    for (let i = 0; i < max; i++) {
      children[String(i)] = makeMetaFromValue(value[i], `#${i}`);
    }
    return { type: 'array', title, properties: Object.keys(children).length ? children : undefined };
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

function buildNavigationMeta(ctx: FlowContext, getView: () => any): any {
  // 与运行时对象保持一致：无 current，仅暴露 viewStack；并动态展开 viewStack 项
  const t = (key: string) => (ctx as any)?.t?.(key) || key;
  return {
    type: 'object',
    title: t('导航'),
    properties: async () => {
      const view = getView();
      const nav = view?.navigation;
      const props: Record<string, any> = {};

      // 动态 viewStack：按索引展开，并为每个项提供字段
      const stack = Array.isArray(nav?.viewStack) ? nav.viewStack : [];
      const stackMeta: any = {
        type: 'array',
        title: t('视图堆栈'),
        properties: undefined as Record<string, any> | undefined,
      };
      if (stack.length) {
        const children: Record<string, any> = {};
        const max = Math.min(stack.length, 20);
        for (let i = 0; i < max; i++) {
          const item = stack[i] || {};
          children[String(i)] = {
            type: 'object',
            title: `#${i}`,
            properties: {
              viewUid: { type: 'string', title: 'viewUid' },
              tabUid: { type: 'string', title: 'tabUid' },
              filterByTk: { type: 'string', title: 'filterByTk' },
              sourceId: { type: 'string', title: 'sourceId' },
            },
          };
        }
        stackMeta.properties = children;
      }

      props.viewStack = stackMeta;
      return props;
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
  const viewTitle = (ctx as any)?.t?.('当前视图') || '当前视图';
  const factory = async () => {
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
      (ctx as any)?.t?.('当前视图记录') || '当前视图记录',
      (c) => inferRecordRef(c),
    );

    const view = getView();
    return {
      type: 'object',
      title: viewTitle,
      buildVariablesParams: (c) => {
        const ref = inferRecordRef(c);
        return ref ? { record: ref } : undefined;
      },
      properties: async () => {
        const props: Record<string, any> = {};
        if (recordMeta) props.record = recordMeta;
        props.type = { type: 'string', title: (ctx as any)?.t?.('类型') || '类型' };
        props.preventClose = { type: 'boolean', title: (ctx as any)?.t?.('是否允许关闭') || '是否允许关闭' };
        props.inputArgs = makeMetaFromValue(view?.inputArgs, (ctx as any)?.t?.('输入参数') || '输入参数');
        props.navigation = buildNavigationMeta(ctx, getView);
        return props;
      },
    } as PropertyMeta;
  };
  // 设置工厂函数的 title，让未加载前的占位标题就是“当前视图”
  (factory as any).title = viewTitle;
  return factory;
}
