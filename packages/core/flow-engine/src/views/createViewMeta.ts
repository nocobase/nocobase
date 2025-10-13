/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import { buildRecordMeta, inferViewRecordRef } from '../utils/variablesParams';

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

/**
 * Create a meta factory for ctx.view that includes:
 * - buildVariablesParams: { record } via inferRecordRef
 * - properties.record: full collection meta via buildRecordMeta
 * - type/preventClose/inputArgs/navigation fields for better variable selection UX
 */
export function createViewMeta(ctx: FlowContext): PropertyMetaFactory {
  const viewTitle = ctx.t('当前视图');
  const factory: PropertyMetaFactory = async () => {
    const view = ctx.view;
    return {
      type: 'object',
      title: ctx.t('当前视图'),
      buildVariablesParams: (c) => {
        const params = inferViewRecordRef(c);
        if (params) {
          return {
            record: params,
          };
        }
        return undefined;
      },
      properties: async () => {
        const props: Record<string, any> = {};
        // 仅当能推断到当前记录引用时，才暴露“当前视图记录”，避免出现空子菜单
        const refNow = inferViewRecordRef(ctx);
        if (refNow && refNow.collection) {
          const recordFactory: PropertyMetaFactory = async () => {
            try {
              const ref = inferViewRecordRef(ctx);
              if (!ref?.collection) return null;
              const dsKey = ref.dataSourceKey || 'main';
              const ds = ctx.dataSourceManager?.getDataSource?.(dsKey);
              const col = ds?.collectionManager?.getCollection?.(ref.collection);
              if (!col) return null;
              return (await buildRecordMeta(
                () => col,
                ctx.t('当前视图记录'),
                (c) => inferViewRecordRef(c),
              )) as PropertyMeta;
            } catch (e) {
              return null;
            }
          };
          recordFactory.title = ctx.t('当前视图记录');
          recordFactory.hasChildren = true;
          props.record = recordFactory;
        }
        props.type = { type: 'string', title: (ctx as any)?.t?.('类型') || '类型' };
        props.preventClose = { type: 'boolean', title: (ctx as any)?.t?.('是否允许关闭') || '是否允许关闭' };
        props.inputArgs = makeMetaFromValue(view?.inputArgs, (ctx as any)?.t?.('输入参数') || '输入参数');
        return props;
      },
    } as PropertyMeta;
  };
  // 设置工厂函数的 title，让未加载前的占位标题就是“当前视图”
  factory.title = viewTitle;
  return factory;
}
