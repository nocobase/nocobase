/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import { inferRecordRef, buildRecordMeta } from '../utils/variablesParams';

// 判断是否为普通对象（Plain Object），避免对类实例/代理等进行深度遍历
function isPlainObject(val: any) {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

// 懒加载元信息：仅在展开节点时计算子属性；并加入循环引用防护
function makeMetaFromValue(value: any, title?: string, seen?: WeakSet<any>): any {
  const t = typeof value;
  if (value === null || value === undefined) return { type: 'any', title };

  if (Array.isArray(value)) {
    return {
      type: 'array',
      title,
      properties: async () => {
        const max = Math.min(value.length || 0, 10);
        const children: Record<string, any> = {};
        const nextSeen = seen ?? new WeakSet<any>();
        for (let i = 0; i < max; i++) {
          children[String(i)] = makeMetaFromValue(value[i], `#${i}`, nextSeen);
        }
        return children;
      },
    };
  }

  if (t === 'string') return { type: 'string', title };
  if (t === 'number') return { type: 'number', title };
  if (t === 'boolean') return { type: 'boolean', title };

  // 仅对普通对象做懒递归；其它对象（如运行时实例）视为 any，防止进入复杂的循环引用
  if (t === 'object' && isPlainObject(value)) {
    return {
      type: 'object',
      title,
      properties: async () => {
        const nextSeen = seen ?? new WeakSet<any>();
        if (nextSeen.has(value)) {
          // 循环引用：不再展开子节点
          return {};
        }
        nextSeen.add(value);
        const props: Record<string, any> = {};
        Object.keys(value || {}).forEach((k) => {
          props[k] = makeMetaFromValue(value[k], k, nextSeen);
        });
        return props;
      },
    };
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
export function createViewMeta(ctx: FlowContext, getView: () => any): PropertyMetaFactory {
  const viewTitle = (ctx as any)?.t?.('当前视图') || '当前视图';
  const factory: PropertyMetaFactory = async () => {
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
  factory.title = viewTitle;
  return factory;
}
