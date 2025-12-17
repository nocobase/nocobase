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

export function joinUrlSearch(url: string, params: { name: string; value: any }[] = []): string {
  if (!params?.length) return url;

  const filtered = params.filter((p) => p.name && p.value !== undefined && p.value !== null && p.value !== '');
  if (!filtered.length) return url;

  try {
    // 检测是否为绝对 URL
    const isAbsolute = /^https?:\/\//i.test(url);

    // 确定 base，用于 URL 构造器解析相对路径
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

    // 使用 URL 构造器自动处理 query、hash 等
    const u = new URL(url, isAbsolute ? undefined : base);

    for (const { name, value } of filtered) {
      u.searchParams.set(name, String(value));
    }

    // 如果是相对路径（没有协议、域名），去掉 origin
    if (!isAbsolute) {
      // 组合 pathname + search + hash
      return `${u.pathname}${u.search}${u.hash}`;
    }

    return u.toString();
  } catch {
    // fallback: 纯字符串拼接方式
    const queryString = filtered.map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&');

    const [path, hash = ''] = url.split('#');
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}${queryString}${hash ? `#${hash}` : ''}`;
  }
}

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
          if (openInNewWindow) {
            window.open(completeURL(link), '_blank');
          } else {
            if (isURL(link)) {
              window.location.href = link;
            } else {
              ctx.router.navigate(link, { replace: true });
              if (ctx.view) {
                ctx.view.close();
              }
            }
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
