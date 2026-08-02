/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '../models';

type LoadedPageOptions = {
  parentId?: string;
  subKey?: string;
};

type DirtyKeyOptions = {
  force?: boolean;
};

type FlowSettingsContextLike = {
  flowSettingsEnabled?: boolean;
};

type FlowEngineLike = {
  context?: FlowSettingsContextLike;
  previousEngine?: FlowEngineLike;
};

const getLoadedPageKey = (options?: LoadedPageOptions): string | undefined => {
  const parentId = options?.parentId;
  const subKey = options?.subKey;
  if (!parentId || subKey !== 'page') {
    return undefined;
  }
  return `${parentId}::${subKey}`;
};

const getLoadedPageKeyFromModel = (model?: FlowModel | null): string | undefined => {
  let current = model;
  while (current) {
    if (current.subKey === 'page' && current.parent?.uid) {
      return getLoadedPageKey({ parentId: current.parent.uid, subKey: current.subKey });
    }
    current = current.parent as FlowModel | undefined;
  }
  return undefined;
};

const isFlowSettingsEnabledForContext = (context?: FlowSettingsContextLike): boolean => {
  try {
    return !!context?.flowSettingsEnabled;
  } catch (error) {
    return false;
  }
};

const isFlowSettingsEnabledForModel = (model?: FlowModel | null): boolean => {
  if (isFlowSettingsEnabledForContext(model?.context as FlowSettingsContextLike | undefined)) {
    return true;
  }

  const visited = new Set<FlowEngineLike>();
  let engine = model?.flowEngine as FlowEngineLike | undefined;
  while (engine && !visited.has(engine)) {
    visited.add(engine);
    if (isFlowSettingsEnabledForContext(engine.context)) {
      return true;
    }
    engine = engine.previousEngine;
  }
  return false;
};

const removeLoadedModelTree = (model?: FlowModel | null): void => {
  if (!model?.uid || !model.flowEngine) {
    return;
  }
  if (model.flowEngine.getModel(model.uid) === model) {
    model.flowEngine.removeModelWithSubModels(model.uid);
  }
};

const mountLoadedModelToParent = <T extends FlowModel = FlowModel>(model: T | null, forceReplace = false): T | null => {
  if (!model?.parent || !model.subKey) {
    return model;
  }

  const mounted = (model.parent.subModels as any)?.[model.subKey];
  const existing =
    forceReplace && model.subType !== 'array' && mounted && !Array.isArray(mounted)
      ? (mounted as FlowModel)
      : model.parent.findSubModel(model.subKey, (m) => m.uid === model.uid);
  if (existing) {
    if (!forceReplace || existing === model) {
      return model;
    }
    removeLoadedModelTree(existing);
  }

  if (model.subType === 'array') {
    model.parent.addSubModel(model.subKey, model);
  } else {
    model.parent.setSubModel(model.subKey, model);
  }
  return model;
};

export const createLoadedPageCache = () => {
  const dirtyKeys = new Set<string>();

  return {
    getDirtyKeyForModel(model?: FlowModel | null, options?: DirtyKeyOptions): string | undefined {
      if (!options?.force && !isFlowSettingsEnabledForModel(model)) {
        return undefined;
      }
      return getLoadedPageKeyFromModel(model);
    },

    markDirty(key?: string): void {
      if (key) {
        dirtyKeys.add(key);
      }
    },

    markDirtyForOptions(options?: LoadedPageOptions): void {
      const key = getLoadedPageKey(options);
      if (key) {
        dirtyKeys.add(key);
      }
    },

    shouldBypass(options?: LoadedPageOptions, isFlowSettingsEnabled?: () => boolean): boolean {
      const key = getLoadedPageKey(options);
      if (!key || !dirtyKeys.has(key)) {
        return false;
      }
      try {
        return !isFlowSettingsEnabled?.();
      } catch (error) {
        return true;
      }
    },

    clear(options?: LoadedPageOptions): void {
      const key = getLoadedPageKey(options);
      if (key) {
        dirtyKeys.delete(key);
      }
    },

    mountModelToParent: mountLoadedModelToParent,
  };
};
