/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowContext,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  defineAction,
  tExpr,
  useFlowSettingsContext,
  type Collection,
  type FlowRuntimeContext,
  type MetaTreeNode,
  type PropertyMetaFactory,
} from '@nocobase/flow-engine';
import { isURL } from '@nocobase/utils/client';
import React, { useMemo } from 'react';
import {
  TextAreaWithContextSelector,
  type TextAreaWithContextSelectorProps,
} from '../components/TextAreaWithContextSelector';

type ResponseRecordPlainStepContext = {
  steps?: FlowRuntimeContext['steps'];
};

type ResponseRecordFlowDefinitionContext = {
  flowKey?: string;
  model?: {
    getFlow?: (flowKey: string) => { steps?: Record<string, unknown> } | undefined;
  };
};

type ResponseRecordContext = FlowContext &
  ResponseRecordPlainStepContext & {
    blockModel?: { collection?: Collection };
    collection?: Collection;
    model?: FlowRuntimeContext['model'] & { collection?: Collection };
  };

function getResponseRecordSteps(ctx: FlowContext | ResponseRecordPlainStepContext): FlowRuntimeContext['steps'] {
  return 'steps' in ctx ? ctx.steps || {} : {};
}

export function getAfterSuccessResponseRecord(ctx: FlowContext | ResponseRecordPlainStepContext) {
  const steps = getResponseRecordSteps(ctx);
  const preferredStepKeys = ['saveResource', 'submit', 'request', 'apply', 'save'];

  for (const stepKey of preferredStepKeys) {
    if (Object.prototype.hasOwnProperty.call(steps, stepKey) && steps[stepKey]?.result != null) {
      return steps[stepKey].result;
    }
  }

  const results = Object.entries(steps)
    .filter(([stepKey, step]) => stepKey !== 'afterSuccess' && step?.result != null)
    .map(([, step]) => step.result);
  return results[results.length - 1];
}

function getResponseRecordMeta(ctx: ResponseRecordContext): PropertyMetaFactory | undefined {
  if (!hasResponseRecordSource(ctx)) {
    return;
  }
  const collectionAccessor = getResponseRecordCollectionAccessor(ctx);
  if (!collectionAccessor()) {
    return;
  }
  return createRecordMetaFactory(collectionAccessor, ctx.t('Response record'), () => {
    const collection = collectionAccessor();
    const record = getAfterSuccessResponseRecord(ctx);
    if (!collection || !record) {
      return;
    }
    try {
      const filterByTk = collection.getFilterByTK(record);
      if (filterByTk == null) {
        return;
      }
      return {
        collection: collection.name,
        dataSourceKey: collection.dataSourceKey || 'main',
        filterByTk,
      };
    } catch (error) {
      return;
    }
  });
}

function hasResponseRecordSource(ctx: FlowContext | ResponseRecordPlainStepContext) {
  if (Object.prototype.hasOwnProperty.call(getResponseRecordSteps(ctx), 'saveResource')) {
    return true;
  }

  const { model, flowKey } = ctx as ResponseRecordFlowDefinitionContext;
  if (!model || typeof model.getFlow !== 'function' || !flowKey) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(model.getFlow(flowKey)?.steps || {}, 'saveResource');
}

function getResponseRecordCollectionAccessor(ctx: ResponseRecordContext) {
  return () => ctx.blockModel?.collection || ctx.collection || ctx.model?.collection || null;
}

export function getMetaTreeWithResponseRecord(ctx: FlowRuntimeContext): MetaTreeNode[] {
  const responseRecordMeta = getResponseRecordMeta(ctx);
  if (!responseRecordMeta) {
    return ctx.getPropertyMetaTree?.() || [];
  }

  const scoped = new FlowContext();
  scoped.addDelegate(ctx);
  scoped.defineProperty('responseRecord', {
    get: () => getAfterSuccessResponseRecord(ctx),
    cache: false,
    resolveOnServer: createRecordResolveOnServerWithLocal(getResponseRecordCollectionAccessor(ctx), () =>
      getAfterSuccessResponseRecord(ctx),
    ),
    meta: responseRecordMeta,
  });
  return scoped.getPropertyMetaTree();
}

function AfterSuccessRedirectTextArea(props: TextAreaWithContextSelectorProps) {
  const flowCtx = useFlowSettingsContext();
  const metaTree = useMemo(() => () => getMetaTreeWithResponseRecord(flowCtx), [flowCtx]);

  return <TextAreaWithContextSelector {...props} metaTree={metaTree} />;
}

export const afterSuccess = defineAction({
  name: 'afterSuccess',
  title: tExpr('After successful submission'),
  defineProperties(ctx) {
    const responseRecordMeta = getResponseRecordMeta(ctx);
    return {
      responseRecord: {
        get: () => getAfterSuccessResponseRecord(ctx),
        cache: false,
        resolveOnServer: createRecordResolveOnServerWithLocal(getResponseRecordCollectionAccessor(ctx), () =>
          getAfterSuccessResponseRecord(ctx),
        ),
        ...(responseRecordMeta ? { meta: responseRecordMeta } : {}),
      },
    };
  },
  uiSchema: {
    successMessage: {
      type: 'string',
      title: tExpr('Popup message'),
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    manualClose: {
      type: 'boolean',
      title: tExpr('Message popup close method'),
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: tExpr('Automatic close'), value: false },
        { label: tExpr('Manually close'), value: true },
      ],
    },
    actionAfterSuccess: {
      type: 'string',
      title: tExpr('Action after successful submission'),
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: tExpr('Stay on the current popup or page'), value: 'stay' },
        { label: tExpr('Return to the previous popup or page'), value: 'previous' },
        { label: tExpr('Close popup and redirect to'), value: 'redirect' },
      ],
    },
    redirectTo: {
      type: 'string',
      title: tExpr('Link'),
      'x-decorator': 'FormItem',
      'x-component': AfterSuccessRedirectTextArea,
      'x-reactions': {
        dependencies: ['actionAfterSuccess'],
        fulfill: {
          state: {
            visible: "{{$deps[0]==='redirect'}}",
          },
        },
      },
    },
  },
  defaultParams: {
    successMessage: tExpr('Saved successfully'),
    manualClose: false,
    actionAfterSuccess: 'previous',
  },
  async handler(ctx, params) {
    const { successMessage, manualClose = false, actionAfterSuccess = 'previous', redirectTo } = params;

    // Close current view if going back to previous page/popup
    if (actionAfterSuccess === 'previous') {
      if (ctx.view) {
        ctx.view.close();
      }
    }

    /**
     * 关闭所有弹窗视图并执行内部路由导航（"关闭并跳转至…"）。
     *
     * 流程：
     * 1. 从内到外遍历引擎栈，对每个弹窗调用 destroyView()：
     *    - 路由触发的弹窗：navigation.back()（replace 方式清理 URL）+ destroy()（立即移除元素）
     *    - 非路由弹窗：直接 destroy()
     * 2. 所有弹窗关闭后 URL 回到弹窗前的页面
     * 3. 执行 router.navigate(url) 压栈跳转到目标页面
     * 4. 浏览器后退 → 回到弹窗前的页面
     */
    const closeViewsAndNavigate = (url: string) => {
      if (ctx.engine) {
        // 从栈顶（最内层）到栈底（根）收集所有引擎
        let top = ctx.engine;
        while (top.nextEngine) top = top.nextEngine;
        const engines = [];
        let eng = top;
        while (eng) {
          engines.push(eng);
          eng = eng.previousEngine;
        }

        // 从内到外关闭所有弹窗视图（drawer/dialog）
        // embed 视图未注册 destroyView 回调，会自动跳过
        for (const e of engines) {
          e.destroyView();
        }
      }
      ctx.router.navigate(url);
    };

    const navigateTo = (url: string) => {
      if (isURL(url)) {
        window.location.href = url;
        return;
      }
      closeViewsAndNavigate(url);
    };

    // Show success message
    if (successMessage) {
      const translatedMessage = ctx.t(successMessage);
      if (manualClose) {
        await ctx.modal.success({
          title: translatedMessage,
          onOk: async () => {
            if (actionAfterSuccess === 'redirect' && redirectTo) {
              navigateTo(redirectTo);
            }
          },
        });
        return;
      } else {
        ctx.message.success(translatedMessage);
      }
    }

    // Handle redirect (when not manual close, redirect happens immediately)
    if (actionAfterSuccess === 'redirect' && redirectTo) {
      navigateTo(redirectTo);
    }
  },
});
