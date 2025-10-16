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
import Vditor from 'vditor';
import { MarkdownWithContextSelector } from './components/Edit';
export class MarkdownBlockModel extends BlockModel {
  render() {
    const { content } = this.props;
    const token = this.context.themeToken;
    const t = this.context.t;

    return <Card>{content}</Card>;
  }
}

MarkdownBlockModel.define({
  label: escapeT('Markdown'),
});

MarkdownBlockModel.registerFlow({
  key: 'markdownBlockSettings',
  title: escapeT('Markdown block settings'),
  steps: {
    editMarkdown: {
      title: escapeT('Edit markdown'),
      uiSchema(ctx) {
        return {
          content: {
            type: 'string',
            'x-component': MarkdownWithContextSelector,
          },
        };
      },
      useRawParams: true,
      defaultParams: {
        content: "{{t('This is a demo text, **supports Markdown syntax**.')}}",
      },
      handler(ctx, params) {
        ctx.model.setProps({
          content: params.content,
        });
      },
    },
  },
});
