/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { TextAreaWithContextSelector } from '../components/TextAreaWithContextSelector';

type NavigateValue = {
  url: string;
  searchParams?: Array<{
    name: string;
    value: string;
  }>;
  openInNewWindow?: boolean;
};

export const navigateToURL = defineAction({
  name: 'navigateToURL',
  title: tExpr('Navigate to URL'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  sort: 400,
  uiSchema: {
    value: {
      type: 'object',
      properties: {
        url: {
          title: tExpr('URL'),
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': TextAreaWithContextSelector,
          description: '{{t("Do not concatenate search params in the URL")}}',
          required: true,
        },
        searchParams: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          title: '{{t("Search parameters")}}',
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                'x-component-props': {
                  style: {
                    flexWrap: 'nowrap',
                    maxWidth: '100%',
                    display: 'flex',
                  },
                  className: css`
                    & > .ant-space-item:first-child {
                      flex: 3;
                    }
                    & > .ant-space-item:nth-child(2) {
                      flex-shrink: 0;
                      flex: 5;
                    }
                    & > .ant-space-item:last-child {
                      flex-shrink: 0;
                      flex: 1;
                    }
                  `,
                },
                properties: {
                  name: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{t("Name")}}',
                    },
                  },
                  value: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': TextAreaWithContextSelector,
                    'x-component-props': {
                      rows: 1,
                    },
                  },
                  remove: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'ArrayItems.Remove',
                  },
                },
              },
            },
          },
          properties: {
            add: {
              type: 'void',
              title: '{{t("Add parameter")}}',
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
        openInNewWindow: {
          type: 'boolean',
          'x-content': '{{t("Open in new window")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
      },
    },
  },
  async handler(ctx, { value }) {
    const params: NavigateValue = value || { url: '', searchParams: [], openInNewWindow: false };
    const { url, searchParams = [], openInNewWindow = false } = params;

    if (!url) {
      return;
    }

    // 构建完整 URL(包含查询参数)
    let fullUrl = url;
    if (searchParams && searchParams.length > 0) {
      const urlObj = new URL(url, globalThis.location.origin);
      for (const param of searchParams) {
        if (param.name && param.value !== undefined) {
          urlObj.searchParams.append(param.name, param.value);
        }
      }
      fullUrl = urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // 根据配置决定打开方式
    if (openInNewWindow) {
      globalThis.open(fullUrl, '_blank');
    } else {
      // 使用 React Router 导航
      ctx.router.navigate(fullUrl);
    }
  },
});
