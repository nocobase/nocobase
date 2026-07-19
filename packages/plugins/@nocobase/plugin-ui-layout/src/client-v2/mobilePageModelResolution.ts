/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import type { CreateModelOptions, FlowEngine, FlowModel, ResolveUseResult } from '@nocobase/flow-engine';
import { MobileChildPageModel, MobileRootPageModel } from './models/MobilePageModels';

const mobilePageResolutionPatched = Symbol.for('nocobase.plugin-ui-layout.mobilePageResolutionPatched');

type PageModelClass = (typeof RootPageModel | typeof ChildPageModel) & {
  [mobilePageResolutionPatched]?: boolean;
  resolveUse?: (options: CreateModelOptions, engine: FlowEngine, parent?: FlowModel) => ResolveUseResult | void;
};
type MobilePageModelClass = typeof MobileRootPageModel | typeof MobileChildPageModel;

type MobileLayoutRuntimeContext = {
  isMobileLayout?: boolean;
  inputArgs?: {
    isMobileLayout?: boolean;
    pageModelClass?: string;
  };
  layout?: {
    layoutModelClass?: string;
    rootPageModelClass?: string;
    childPageModelClass?: string;
  };
  layoutContext?: {
    isMobileLayout?: boolean;
    layout?: {
      layoutModelClass?: string;
      rootPageModelClass?: string;
      childPageModelClass?: string;
    };
  };
  view?: {
    inputArgs?: {
      isMobileLayout?: boolean;
      pageModelClass?: string;
    };
  };
};

function isMobileLayoutDefinition(layout: MobileLayoutRuntimeContext['layout'] | undefined, mobileModelClass: string) {
  return (
    layout?.layoutModelClass === 'MobileLayoutModel' ||
    layout?.rootPageModelClass === mobileModelClass ||
    layout?.childPageModelClass === mobileModelClass
  );
}

function shouldResolveToMobilePageModel(context: unknown, mobileModelClass: string) {
  try {
    const ctx = context as MobileLayoutRuntimeContext | undefined;

    return (
      ctx?.inputArgs?.pageModelClass === mobileModelClass ||
      ctx?.view?.inputArgs?.pageModelClass === mobileModelClass ||
      isMobileLayoutDefinition(ctx?.layout, mobileModelClass) ||
      isMobileLayoutDefinition(ctx?.layoutContext?.layout, mobileModelClass)
    );
  } catch (error) {
    return false;
  }
}

function findParentModelInEngineStack(options: CreateModelOptions, engine: FlowEngine) {
  if (!options.parentId || typeof engine.getModel !== 'function') {
    return undefined;
  }

  return engine.getModel<FlowModel>(options.parentId, true);
}

function isMobilePageSubModel(
  options: CreateModelOptions,
  engine: FlowEngine,
  mobileModelClass: string,
  parent?: FlowModel,
) {
  const stackedParent = parent || findParentModelInEngineStack(options, engine);

  return (
    options.subKey === 'page' &&
    (shouldResolveToMobilePageModel(stackedParent?.context, mobileModelClass) ||
      shouldResolveToMobilePageModel(engine.context, mobileModelClass))
  );
}

function hasResolvedTarget(result: ResolveUseResult | void) {
  if (!result) {
    return false;
  }

  return typeof result !== 'object' || !('use' in result) || !!result.use;
}

function patchPageModelResolution(ModelClass: PageModelClass, MobileModelClass: MobilePageModelClass) {
  if (ModelClass[mobilePageResolutionPatched]) {
    return;
  }

  const originalResolveUse = ModelClass.resolveUse;
  ModelClass.resolveUse = function resolveMobilePageModel(options, engine, parent) {
    const mobileModelClass = MobileModelClass.name;
    const isBasePageModelRequest = options.use === ModelClass || options.use === ModelClass.name;
    if (!isBasePageModelRequest) {
      return originalResolveUse?.call(this, options, engine, parent);
    }

    const resolved = originalResolveUse?.call(this, options, engine, parent);
    if (hasResolvedTarget(resolved)) {
      return resolved;
    }

    if (isMobilePageSubModel(options, engine, mobileModelClass, parent)) {
      return MobileModelClass;
    }

    return resolved;
  };

  ModelClass[mobilePageResolutionPatched] = true;
}

export function registerMobilePageModelResolution() {
  patchPageModelResolution(RootPageModel, MobileRootPageModel);
  patchPageModelResolution(ChildPageModel, MobileChildPageModel);
}
