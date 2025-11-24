/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineFlow, tExpr, FlowModel, FlowModelContext } from '@nocobase/flow-engine';
import React from 'react';
import { Space } from 'antd';

export const editMarkdownFlow = defineFlow<FlowModel>({
  key: 'markdownBlockSettings',
  title: tExpr('Markdown block settings', { ns: 'block-markdown' }),
  steps: {
    editMarkdown: {
      title: tExpr('Edit markdown'),
      uiSchema(ctx) {
        const t = ctx.t;
        const descriptionContent = (
          <Space>
            <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
              {t('References')}:
            </span>
            <a
              href={`https://v2.docs.nocobase.com/cn/interface-builder/blocks/other-blocks/markdown`}
              target="_blank"
              rel="noreferrer"
            >
              Markdown
            </a>
          </Space>
        );

        return {
          content: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': (props) => {
              return ctx.markdown.edit({
                ...props,
                value: props.value || ctx.model.props.value,
                style: {
                  padding: 10,
                },
              });
            },
            description: descriptionContent,
          },
        };
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      useRawParams: true,
      defaultParams: {
        content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
      },
      async handler(ctx, params) {
        const content = params.content;
        try {
          const result = await ctx.liquid.renderWithFullContext(ctx.t(content), ctx);
          // 解析 Markdown
          const mdContent = ctx.markdown.render(ctx.t(result), { textOnly: false });
          ctx.model.setProps({
            content: mdContent,
            value: content,
          });
        } catch (error) {
          ctx.model.setProps({
            content: <pre>{`渲染失败: ${error}`}</pre>,
            value: content,
          });
        }
      },
    },
  },
});
