/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel, css } from '@nocobase/client';
import { escapeT } from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';

export class MarkdownBlockModel extends BlockModel {
  renderComponent() {
    const { content } = this.props;
    return content;
  }
}

MarkdownBlockModel.define({
  label: escapeT('Markdown'),
});

MarkdownBlockModel.registerFlow({
  key: 'markdownBlockSettings',
  title: escapeT('Markdown block settings', { ns: 'block-markdown' }),
  steps: {
    editMarkdown: {
      title: escapeT('Edit markdown'),
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
              });
            },
            description: descriptionContent,
          },
        };
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
