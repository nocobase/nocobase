/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { TextAreaWithContextSelector } from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { css } from '@emotion/css';
import { ActionPanelActionModel } from './ActionPanelActionModel';

// 补全 URL
function completeURL(url: string, origin = window.location.origin) {
  if (!url) {
    return '';
  }
  if (isURL(url)) {
    return url;
  }
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

function joinUrlSearch(url: string, params: { name: string; value: any }[] = []): string {
  if (!params?.length) return url;

  const queryString = params
    .filter((p) => p.name && p.value !== undefined && p.value !== null && p.value !== '')
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
    .join('&');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${queryString}`;
}

export class ActionPanelLinkActionModel extends ActionPanelActionModel {
  onClick(event) {
    this.dispatchEvent('click', {
      event,
      ...this.getInputArgs(),
    });
  }
}

ActionPanelLinkActionModel.define({
  label: escapeT('Link'),
});

ActionPanelLinkActionModel.registerFlow({
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
          if (openInNewWindow) {
            window.open(completeURL(link), '_blank');
          } else {
            ctx.router.navigate(link, { replace: true });
          }
        } else {
          console.error('link should be a string');
        }
      },
    },
  },
});

ActionPanelLinkActionModel.registerFlow({
  key: 'linkButtonSettings',
  title: escapeT('Link action settings', { ns: 'block-workbench' }),
  steps: {
    editLink: {
      title: escapeT('Edit link'),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          url: {
            title: escapeT('URL'),
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
