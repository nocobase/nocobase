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

    // Close view first if going back to previous page/popup
    if (actionAfterSuccess === 'previous') {
      if (ctx.view) {
        ctx.view.close();
      }
    }

    // Show success message
    if (successMessage) {
      const translatedMessage = ctx.t(successMessage);
      if (manualClose) {
        await ctx.modal.success({
          title: translatedMessage,
          onOk: async () => {
            if (actionAfterSuccess === 'redirect' && redirectTo) {
              if (isURL(redirectTo)) {
                window.location.href = redirectTo;
              } else {
                ctx.router.navigate(redirectTo);
              }
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
      if (isURL(redirectTo)) {
        window.location.href = redirectTo;
      } else {
        ctx.router.navigate(redirectTo);
      }
    }
  },
});
