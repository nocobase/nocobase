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
     * 关闭弹窗视图并执行内部路由导航。
     * 通过遍历引擎栈调用 destroyView() 直接销毁弹窗（跳过路由回退逻辑），
     * 避免与后续的 router.navigate 冲突。
     *
     * 支持两种场景：
     * 1. 跳转到完全不同的页面 → 关闭所有弹窗层
     * 2. 当前路径包含目标路径（部分后退） → 只关闭多出的弹窗层
     */
    const closeViewsAndNavigate = (url: string) => {
      if (ctx.view && ctx.engine) {
        const currentPath = window.location.pathname;
        const targetPath = url.startsWith('/') ? url : `/${url}`;

        // 从栈顶（最内层）到栈底（根）收集所有引擎
        let top = ctx.engine;
        while (top.nextEngine) top = top.nextEngine;
        const engines = [];
        let eng = top;
        while (eng) {
          engines.push(eng);
          eng = eng.previousEngine;
        }

        if (currentPath !== targetPath && currentPath.startsWith(targetPath)) {
          // 部分后退：目标路径是当前路径的前缀，按 URL 中的 /popups/ 段数计算需关闭的层数
          const remaining = currentPath.slice(targetPath.length);
          const layersToClose = (remaining.match(/\/popups\//g) || []).length;
          let closed = 0;
          for (const e of engines) {
            if (closed >= layersToClose) break;
            if (e.destroyView()) closed++;
          }
        } else {
          // 不同页面：关闭所有弹窗视图
          for (const e of engines) {
            e.destroyView();
          }
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
