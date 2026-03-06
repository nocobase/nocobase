/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { isURL } from '@nocobase/utils/client';
import { TextAreaWithContextSelector } from '../components/TextAreaWithContextSelector';

export const afterSuccess = defineAction({
  name: 'afterSuccess',
  title: tExpr('After successful submission'),
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
        { label: tExpr('Redirect to'), value: 'redirect' },
      ],
    },
    redirectTo: {
      type: 'string',
      title: tExpr('Link'),
      'x-decorator': 'FormItem',
      'x-component': TextAreaWithContextSelector,
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
