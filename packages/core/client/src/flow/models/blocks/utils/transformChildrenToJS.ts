/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, buildWrapperFieldChildren, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
import { AssociationFieldGroupModel } from '../../base/AssociationFieldGroupModel';

export interface TransformOptions {
  fieldUseModel: string; // e.g. 'JSFieldModel' | 'JSEditableFieldModel'
  refreshTargets: string[];
}

/**
 * 递归将 SubModelItem 列表中的叶子节点 createModelOptions 重写为指定的 JS 字段模型。
 * - 保留 children 的形态：数组或函数；
 * - 对函数型 children 做一层包裹，确保返回结果继续被转换；
 * - 对已有 createModelOptions（对象或函数）做二次包装并追加 subModels.field.use。
 */
export function transformChildrenToJS(
  items: SubModelItem[] | false | undefined,
  options: TransformOptions,
): SubModelItem[] {
  const { fieldUseModel, refreshTargets } = options;

  const wrap = (nodes: SubModelItem[] | false | undefined): SubModelItem[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((it) => {
      const next: SubModelItem = { ...it };

      // 递归处理 children
      if (next.children) {
        if (typeof next.children === 'function') {
          const fn = next.children;
          next.children = async (innerCtx: FlowModelContext) => {
            const res = await fn(innerCtx);
            return wrap(res);
          };
        } else if (Array.isArray(next.children)) {
          next.children = wrap(next.children);
        }
      }

      // 重写 createModelOptions 以覆盖 subModels.field.use
      if (next.createModelOptions) {
        const orig = next.createModelOptions;
        next.createModelOptions = async (innerCtx: FlowModelContext, extra?: unknown) => {
          type CreateModelOptionsStringUse = Omit<import('@nocobase/flow-engine').CreateModelOptions, 'use'> & {
            use?: string;
          };
          const resolved: CreateModelOptionsStringUse = await (typeof orig === 'function'
            ? orig(innerCtx, extra)
            : orig);
          resolved.subModels = resolved.subModels || {};
          resolved.subModels.field = { ...(resolved.subModels.field || {}), use: fieldUseModel };
          return resolved;
        };
        next.refreshTargets = next.refreshTargets || refreshTargets;
      }

      return next;
    });
  };

  return wrap(items);
}

/**
 * 构造“关联字段（JS 化）”分组节点，支持懒加载 children 并在返回时完成 JS 化。
 */
export function buildAssociationJSGroup(
  ctx: FlowModelContext,
  provider: (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>,
  options: TransformOptions & {
    key?: string;
    label?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
  },
): SubModelItem {
  const { fieldUseModel, refreshTargets } = options;
  const key = options.key ?? 'js-association-fields';
  const label = options.label ?? tExpr('Display association fields');
  const searchable = options.searchable ?? true;
  const searchPlaceholder = options.searchPlaceholder ?? tExpr('Search fields');

  return {
    key,
    type: 'group',
    label,
    searchable,
    searchPlaceholder,
    children: async (innerCtx: FlowModelContext) => {
      const raw = await provider(innerCtx);
      return transformChildrenToJS(raw, { fieldUseModel, refreshTargets });
    },
  };
}

/**
 * 为表单场景生成“关联字段”分组的子项，避免引入新的模型类。这个类型并不会落库
 * 通过绑定 AssociationFieldGroupModel.defineChildren 的 this，临时指定 itemModelName = 'FormItemModel'。
 */
class FormAssociationFieldGroupShim extends AssociationFieldGroupModel {
  static itemModelName = 'FormItemModel';
}

export function buildFormAssociationChildren(ctx: FlowModelContext) {
  const items = FormAssociationFieldGroupShim.defineChildren(ctx);
  return items as SubModelItem[];
}

// =========================
// Higher-level builder for JS field menus
// =========================

export interface JSFieldMenuChildrenOptions {
  useModel: string;
  fieldUseModel: string;
  refreshTargets: string[];
  associationPathName?: string;
  /**
   * 仅在需要“关系字段”入口时传入（例如 Table / Details 区块）；
   * 表单的 JS field 菜单默认不展示关系字段。
   */
  associationProvider?: (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;
}

export async function buildJSFieldMenuChildren(ctx: FlowModelContext, opts: JSFieldMenuChildrenOptions) {
  const { useModel, fieldUseModel, refreshTargets, associationPathName, associationProvider } = opts;
  const groups = buildWrapperFieldChildren(ctx, {
    useModel,
    fieldUseModel,
    associationPathName,
    refreshTargets,
  });
  let directChildren: SubModelItem[] = [];
  const maybeChildren = groups?.[0]?.children;
  if (Array.isArray(maybeChildren)) {
    directChildren = maybeChildren;
  }

  if (!associationProvider) return directChildren;

  // 仅当“关联字段”实际存在时，才追加该分组
  const assocRaw = await associationProvider(ctx);
  if (!Array.isArray(assocRaw) || assocRaw.length === 0) return directChildren;

  const assocJSGroup = buildAssociationJSGroup(ctx, associationProvider, {
    fieldUseModel,
    refreshTargets,
  });
  return [...directChildren, assocJSGroup];
}
