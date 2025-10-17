/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';
import { escapeT } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'antd';

export class MarkdownBlockModel extends BlockModel {
  render() {
    const { content } = this.props;
    return <Card>{content}</Card>;
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
          <>
            <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
              {t('Syntax references')}:
            </span>
            <a href={`https://shopify.github.io/liquid/basics/introduction/`} target="_blank" rel="noreferrer">
              Liquid
            </a>
          </>
        );

        return {
          content: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': (props) => ctx.markdown.edit(props),
            description: descriptionContent,
          },
        };
      },
      useRawParams: true,
      defaultParams: {
        content: "{{ 'This is a demo text, **supports Markdown syntax**.' | t: locale, i18n }}",
      },
      async handler(ctx, params) {
        const content = params.content;
        try {
          const result = await ctx.liquid.renderWithFullContext(content, ctx);
          // 解析 Markdown
          const mdContent = ctx.markdown.render(ctx.t(result));
          ctx.model.setProps({
            content: mdContent,
          });
        } catch (error) {
          ctx.model.setProps({
            content: <pre>{`渲染失败: ${error}`}</pre>,
          });
        }
      },
    },
  },
});
