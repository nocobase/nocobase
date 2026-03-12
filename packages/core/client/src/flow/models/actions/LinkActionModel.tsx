/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { isURL } from '@nocobase/utils/client';
import { css } from '@emotion/css';
import type { ButtonProps } from 'antd/es/button';
import { TextAreaWithContextSelector } from '../../components/TextAreaWithContextSelector';
import { ActionModel, ActionSceneEnum } from '../base';
import { joinUrlSearch } from './joinUrlSearch';
import { handleLinkNavigation, shouldDestroyViewAfterLinkNavigation } from './LinkActionUtils';
export { joinUrlSearch } from './joinUrlSearch';

export class LinkActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;

  defaultProps: ButtonProps = {
    title: tExpr('Link'),
    icon: 'LinkOutlined',
  };
}

LinkActionModel.define({
  label: tExpr('Link'),
});

LinkActionModel.registerFlow({
  key: 'actionPanelLinkSettings',
  on: 'click',
  steps: {
    click: {
      async handler(ctx, params) {
        const { url, searchParams, openInNewWindow } = ctx.model.props as any;
        const t = ctx.t;
        if (!url) {
          ctx.message.warning(t('Please configure the URL'));
          return;
        }
        const link = joinUrlSearch(url, searchParams);

        if (link) {
          const isExternalLink = isURL(link);
          handleLinkNavigation({
            link,
            openInNewWindow,
            router: ctx.router,
            isExternalLink,
          });
          // embed 是页面容器，不应销毁；仅弹窗视图在站内同窗口跳转后销毁。
          if (
            ctx.view &&
            shouldDestroyViewAfterLinkNavigation({
              openInNewWindow,
              isExternalLink,
              viewType: ctx.view.type,
            })
          ) {
            ctx.view.destroy();
          }
        } else {
          console.error('link should be a string');
        }
      },
    },
  },
});

LinkActionModel.registerFlow({
  key: 'linkButtonSettings',
  title: tExpr('Link action settings'),
  steps: {
    editLink: {
      title: tExpr('Edit link'),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          url: {
            title: tExpr('URL'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': TextAreaWithContextSelector,
            description: t('Do not concatenate search params in the URL'),
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "html"}}',
                },
              },
            },
            required: true,
          },
          searchParams: {
            type: 'array',
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            title: `{{t("Search parameters")}}`,
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
                      ,
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
                        placeholder: `{{t("Name")}}`,
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
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "html"}}',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add parameter")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          openInNewWindow: {
            type: 'boolean',
            'x-content': t('Open in new window'),
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "html"}}',
                },
              },
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          url: params.url,
          searchParams: params.searchParams,
          openInNewWindow: params.openInNewWindow,
        });
      },
    },
  },
});
