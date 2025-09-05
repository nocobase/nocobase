/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import type { Collection } from '../../data-source';
import { FlowModelContext } from '../../flowContext';
import { FlowModelMeta, ModelConstructor } from '../../types';
import { isInheritedFrom, resolveCreateModelOptions } from '../../utils';
import { SubModelItem } from './AddSubModelButton';

function buildSubModelItem(M: ModelConstructor, ctx: FlowModelContext): SubModelItem {
  const meta: FlowModelMeta = (M.meta ?? {}) as FlowModelMeta;
  if (meta.hide) {
    return;
  }
  // 判断是否为 CollectionBlockModel 的子类（用于集合选择层开启搜索）
  const item: SubModelItem = {
    key: M.name,
    label: meta.label || M.name,
    // 子菜单级搜索：仅尊重模型 meta 显式配置，避免在工具层做类型耦合判断
    searchable: !!meta.searchable,
    searchPlaceholder: meta.searchPlaceholder,
    // Ensure toggleable models can be detected and toggled in menus
    // Meta.toggleable indicates the item should behave like a switch (unique per parent)
    // Add corresponding flags so AddSubModelButton can compute toggle state and removal
    toggleable: meta.toggleable,
    // Use the model class name for toggle detection (engine.getModelClass)
    // This is required by AddSubModelButton to locate existing instances
    useModel: M.name,
    children: buildSubModelChildren(M, ctx),
  };
  item['createModelOptions'] = meta.createModelOptions || {
    use: M.name, //TODO: this is wrong after code minized, we need to fix this
  };
  return item;
}

function buildSubModelChildren(M: ModelConstructor, ctx: FlowModelContext) {
  const meta: FlowModelMeta = (M.meta ?? {}) as FlowModelMeta;
  let children: any;
  if (meta.children) {
    children = meta.children;
  }
  if (M['defineChildren']) {
    children = M['defineChildren'].bind(M);
  }
  if (typeof children === 'function') {
    const orininalChildren = children;
    children = async () => {
      const resolved = await orininalChildren(ctx);
      // deep clone and wrap createModelOptions
      const wrap = (nodes: any[]): any[] =>
        nodes?.map((n) => {
          const node = { ...n };
          if (node.children) {
            node.children = Array.isArray(node.children) ? wrap(node.children) : node.children;
          } else if (node.createModelOptions) {
            const src = node.createModelOptions;
            node.createModelOptions = async (...args: any[]) => {
              const extraArg = args && args.length > 0 ? args[args.length - 1] : undefined;
              // Resolve default options from FlowModel.define meta first, then child-specific options.
              const defaultOpts = await resolveCreateModelOptions(meta?.createModelOptions, ctx, extraArg);
              const childOpts = await resolveCreateModelOptions(src, ctx, extraArg);
              // Merge with child options taking precedence over defaults.
              return _.merge({}, _.cloneDeep(defaultOpts), childOpts);
            };
          }
          return node;
        });
      return wrap(resolved);
    };
  }

  return children;
}

export function buildSubModelItems(subModelBaseClass: string | ModelConstructor, exclude = []) {
  return async (ctx: FlowModelContext) => {
    const SubModelClasses = ctx.engine.getSubclassesOf(subModelBaseClass);
    // Collect and sort subclasses by meta.sort (ascending), excluding hidden or inherited ones in `exclude`
    const candidates = Array.from(SubModelClasses.values())
      .filter((C) => !C.meta?.hide)
      .filter((C) => {
        for (const P of exclude as (string | ModelConstructor)[]) {
          if (typeof P === 'string') {
            if (C.name === P) return false;
          } else if (C === P || isInheritedFrom(C, P)) {
            return false;
          }
        }
        return true;
      })
      .sort((A, B) => (A.meta?.sort ?? 1000) - (B.meta?.sort ?? 1000));

    const items: SubModelItem[] = [];
    for (const M of candidates) {
      const item = buildSubModelItem(M, ctx);
      if (item) items.push(item);
    }
    return items;
  };
}

export function buildSubModelGroups(subModelBaseClasses: (string | ModelConstructor)[] = []) {
  return async (ctx: FlowModelContext) => {
    const items: SubModelItem[] = [];
    const exclude: (string | ModelConstructor)[] = [];
    for (const subModelBaseClass of subModelBaseClasses) {
      const BaseClass =
        typeof subModelBaseClass === 'string' ? ctx.engine.getModelClass(subModelBaseClass) : subModelBaseClass;
      if (!BaseClass) {
        continue;
      }
      let children = buildSubModelChildren(BaseClass, ctx);

      if (!children) {
        children = await buildSubModelItems(subModelBaseClass, exclude)(ctx);
      }
      exclude.push(BaseClass);

      // 若 children 为函数，则预解析一层以判断是否有子项；
      // 这样当解析结果为空数组时，可自动跳过（隐藏）该分组。
      let hasChildren = false;
      if (typeof children === 'function') {
        try {
          // 兼容签名：我们传入 ctx，但若函数不接收也不会出问题
          const resolved = await children(ctx as FlowModelContext);
          hasChildren = Array.isArray(resolved) ? resolved.length > 0 : !!resolved;
        } catch (e) {
          // 若解析异常，视为无可用子项，跳过该分组，避免空分组
          hasChildren = false;
        }
      } else if (Array.isArray(children)) {
        hasChildren = children.length > 0;
      } else {
        hasChildren = !!children;
      }

      if (!hasChildren) continue;
      // 优先使用父类的 meta.label；若无则回退到传入的基类字符串，避免使用压缩后不稳定的类名
      const groupLabel =
        BaseClass?.meta?.label || (typeof subModelBaseClass === 'string' ? subModelBaseClass : BaseClass.name);
      items.push({
        // 使用传入的字符串作为 key，避免使用类名在压缩后不稳定的问题
        key: typeof subModelBaseClass === 'string' ? subModelBaseClass : BaseClass.name,
        type: 'group',
        label: groupLabel,
        children,
      });
    }
    return items;
  };
}

// ==================== Field-driven children builders ====================
export interface BuildFieldChildrenOptions {
  useModel: string;
  fieldUseModel?: string | ((field: any) => string);
  collection?: Collection;
  associationPathName?: string;
}

export function buildWrapperFieldChildren(ctx: FlowModelContext, options: BuildFieldChildrenOptions) {
  const { useModel, fieldUseModel, associationPathName } = options;
  const collection: Collection = options.collection || ctx.model['collection'] || ctx.collection;
  const fields = collection.getFields();
  const defaultItemKeys = ['fieldSettings', 'init'];
  const children: SubModelItem[] = [];
  for (const f of fields) {
    if (!f?.options?.interface) continue;
    const fieldPath = associationPathName ? `${associationPathName}.${f.name}` : f.name;

    const childUse = typeof fieldUseModel === 'function' ? fieldUseModel(f) : fieldUseModel ?? 'FormFieldModel';
    const stepPayload = {
      dataSourceKey: collection.dataSourceKey,
      collectionName: collection.name,
      fieldPath: f.name,
      associationPathName,
    };

    children.push({
      key: fieldPath,
      label: f.title,
      toggleable: (subModel) => {
        const { associationPathName, fieldPath: fieldName } = subModel.getStepParams('fieldSettings', 'init') || {};
        return (associationPathName ? `${associationPathName}.${fieldName}` : fieldName) === fieldPath;
      },
      useModel: useModel,
      createModelOptions: () => ({
        use: useModel,
        stepParams: {
          fieldSettings: {
            init: stepPayload,
          },
        },
        subModels: {
          field: {
            use: childUse,
            stepParams: {
              fieldSettings: {
                init: stepPayload,
              },
            },
          },
        },
      }),
    });
  }

  const groupKey = `addField_${collection.name}`;
  const finalSearchPlaceholder = ctx.t('Search fields');
  return [
    {
      key: groupKey,
      label: '', // 这个是为了搜索框的占位group, 如果写入内容，会导致出现两层group labels, 本问题的本质是 subModelBaseClass 构建的goup没地方指定是否允许搜索
      type: 'group' as const,
      searchable: true,
      searchPlaceholder: finalSearchPlaceholder,
      children,
    },
  ];
}
