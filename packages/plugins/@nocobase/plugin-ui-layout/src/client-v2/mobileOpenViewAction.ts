/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { openView } from '@nocobase/client-v2';

const MOBILE_CHILD_PAGE_MODEL_CLASS = 'MobileChildPageModel';
const DEFAULT_CHILD_PAGE_MODEL_CLASS = 'ChildPageModel';

type OpenViewHandler = NonNullable<typeof openView.handler>;
type OpenViewContext = Parameters<OpenViewHandler>[0];
type OpenViewParams = Parameters<OpenViewHandler>[1];

type MobileOpenViewInputArgs = {
  isMobileLayout?: boolean;
  pageModelClass?: unknown;
} & Record<string, unknown>;

type FlowContextPropertyOptions = {
  value?: unknown;
  get?: () => unknown;
  cache?: boolean;
  observable?: boolean;
  once?: boolean;
  meta?: unknown;
  info?: unknown;
};

type InputArgsOverrideContext = OpenViewContext & {
  defineProperty?: (key: string, options: FlowContextPropertyOptions) => void;
  _props?: Record<string, FlowContextPropertyOptions | undefined>;
};

type OpenViewModelContext = {
  inputArgs?: Record<string, unknown>;
  isMobileLayout?: boolean;
  defineProperty?: (key: string, options: FlowContextPropertyOptions) => void;
};

type OpenViewContextWithModel = OpenViewContext & {
  model?: {
    context?: OpenViewModelContext;
  };
};

function isMobileOpenViewContext(ctx: OpenViewContext) {
  const inputArgs = ctx.inputArgs as MobileOpenViewInputArgs | undefined;

  return inputArgs?.isMobileLayout === true || ctx.isMobileLayout === true;
}

function hasCustomPageModelClass(pageModelClass: unknown) {
  return (
    typeof pageModelClass !== 'undefined' &&
    pageModelClass !== DEFAULT_CHILD_PAGE_MODEL_CLASS &&
    pageModelClass !== MOBILE_CHILD_PAGE_MODEL_CLASS
  );
}

function shouldUseMobileChildPageModel(ctx: OpenViewContext, params: OpenViewParams) {
  const inputArgs = ctx.inputArgs as MobileOpenViewInputArgs | undefined;
  const paramPageModelClass = (params as { pageModelClass?: unknown } | undefined)?.pageModelClass;

  return (
    isMobileOpenViewContext(ctx) &&
    !hasCustomPageModelClass(inputArgs?.pageModelClass) &&
    !hasCustomPageModelClass(paramPageModelClass)
  );
}

export function resolveMobileOpenViewInputArgs(
  ctx: OpenViewContext,
  params: OpenViewParams,
): MobileOpenViewInputArgs | undefined {
  const inputArgs = ctx.inputArgs as MobileOpenViewInputArgs | undefined;
  if (!shouldUseMobileChildPageModel(ctx, params)) {
    return inputArgs;
  }

  if (inputArgs?.pageModelClass === MOBILE_CHILD_PAGE_MODEL_CLASS) {
    return inputArgs;
  }

  return {
    ...inputArgs,
    pageModelClass: MOBILE_CHILD_PAGE_MODEL_CLASS,
  };
}

export function resolveMobileOpenViewParams(ctx: OpenViewContext, params: OpenViewParams): OpenViewParams {
  if (!shouldUseMobileChildPageModel(ctx, params)) {
    return params;
  }

  if ((params as { pageModelClass?: unknown } | undefined)?.pageModelClass === MOBILE_CHILD_PAGE_MODEL_CLASS) {
    return params;
  }

  return {
    ...params,
    pageModelClass: MOBILE_CHILD_PAGE_MODEL_CLASS,
  };
}

function overrideContextInputArgs(ctx: OpenViewContext, inputArgs: MobileOpenViewInputArgs | undefined) {
  const target = ctx as InputArgsOverrideContext;
  const originalOptions = target._props?.inputArgs;
  const originalDescriptor = Object.getOwnPropertyDescriptor(ctx, 'inputArgs');

  if (typeof target.defineProperty === 'function') {
    target.defineProperty('inputArgs', { value: inputArgs });
  } else {
    Object.defineProperty(ctx, 'inputArgs', {
      configurable: true,
      enumerable: originalDescriptor?.enumerable ?? true,
      value: inputArgs,
    });
  }

  return () => {
    if (originalOptions && typeof target.defineProperty === 'function') {
      target.defineProperty('inputArgs', originalOptions);
      return;
    }

    if (originalDescriptor) {
      Object.defineProperty(ctx, 'inputArgs', originalDescriptor);
    }
  };
}

function exposeMobileOpenViewInputArgsOnModelContext(
  ctx: OpenViewContext,
  inputArgs: MobileOpenViewInputArgs | undefined,
) {
  if (inputArgs?.pageModelClass !== MOBILE_CHILD_PAGE_MODEL_CLASS) {
    return;
  }

  const modelContext = (ctx as OpenViewContextWithModel).model?.context;
  if (!modelContext || hasCustomPageModelClass(modelContext.inputArgs?.pageModelClass)) {
    return;
  }

  const nextInputArgs = {
    ...modelContext.inputArgs,
    isMobileLayout: true,
    pageModelClass: MOBILE_CHILD_PAGE_MODEL_CLASS,
  };

  if (typeof modelContext.defineProperty === 'function') {
    modelContext.defineProperty('inputArgs', { value: nextInputArgs });
    modelContext.defineProperty('isMobileLayout', { value: true });
    return;
  }

  modelContext.inputArgs = nextInputArgs;
  modelContext.isMobileLayout = true;
}

export const mobileOpenView = {
  ...openView,
  async handler(ctx: OpenViewContext, params: OpenViewParams) {
    const inputArgs = resolveMobileOpenViewInputArgs(ctx, params);
    const resolvedParams = resolveMobileOpenViewParams(ctx, params);
    const originalInputArgs = ctx.inputArgs;

    exposeMobileOpenViewInputArgsOnModelContext(ctx, inputArgs);

    if (inputArgs === originalInputArgs) {
      return openView.handler(ctx, resolvedParams);
    }

    const restoreInputArgs = overrideContextInputArgs(ctx, inputArgs);
    try {
      return await openView.handler(ctx, resolvedParams);
    } finally {
      restoreInputArgs();
    }
  },
};
