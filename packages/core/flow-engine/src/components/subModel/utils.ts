/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelContext } from '../../flowContext';
import { ModelConstructor } from '../../types';
import { isInheritedFrom } from '../../utils';

export function buildSubModelItem(M: ModelConstructor) {
  const meta = M.meta || {};
  if (meta.hide) {
    return;
  }
  const item = {
    key: M.name,
    label: meta.label || M.name,
    // Ensure toggleable models can be detected and toggled in menus
    // Meta.toggleable indicates the item should behave like a switch (unique per parent)
    // Add corresponding flags so AddSubModelButton can compute toggle state and removal
    toggleable: meta.toggleable,
    // Use the model class name for toggle detection (engine.getModelClass)
    // This is required by AddSubModelButton to locate existing instances
    useModel: M.name,
    children: buildSubModelChildren(M),
  };
  if (!item.children) {
    item['createModelOptions'] = meta.createModelOptions || {
      use: M.name, //TODO: this is wrong after code minized, we need to fix this
    };
  }
  return item;
}

export function buildSubModelChildren(M: ModelConstructor) {
  const meta = M.meta || {};
  let children: any;
  if (meta.children) {
    // @ts-ignore
    if (meta.children === false) {
      children = null;
    }
    if (Array.isArray(meta.children)) {
      children = meta.children;
    } else if (typeof meta.children === 'function') {
      children = meta.children;
    }
  } else if (M['defineChildren']) {
    children = M['defineChildren'].bind(M);
  }
  return children;
}

export function buildSubModelItems(subModelBaseClass: string | ModelConstructor, exclude = []) {
  return async (ctx: FlowModelContext) => {
    const SubModelClasses = ctx.engine.getSubclassesOf(subModelBaseClass);
    const items = [];
    for (const [name, M] of SubModelClasses) {
      let isInherited = false;
      for (const P of exclude) {
        if (M === P || M.name === P.name || isInheritedFrom(M, P)) {
          isInherited = true;
          break;
        }
      }
      if (isInherited) {
        continue;
      }
      const item = buildSubModelItem(M);
      if (!item) {
        continue;
      }
      items.push(item);
    }
    return items;
  };
}

export function buildSubModelGroups(subModelBaseClasses = []) {
  return async (ctx: FlowModelContext) => {
    const items = [];
    const exclude = [];
    for (const subModelBaseClass of subModelBaseClasses) {
      const BaseClass = ctx.engine.getModelClass(subModelBaseClass);
      if (!BaseClass) {
        continue;
      }
      let children = buildSubModelChildren(BaseClass);
      if (typeof children === 'function') {
        children = await children(ctx);
      }
      if (!children) {
        children = await buildSubModelItems(subModelBaseClass, exclude)(ctx);
      }
      exclude.push(BaseClass);
      if (!children || children?.length === 0) {
        continue;
      }
      items.push({
        key: BaseClass.name,
        type: 'group',
        label: BaseClass.meta?.label || BaseClass.name,
        children,
      });
    }
    return items;
  };
}
