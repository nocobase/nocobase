/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@nocobase/flow-engine';
import React from 'react';
import { DisplayMarkdown } from '../../internal/components/Markdown/DisplayMarkdown';
import { CommonItemModel } from '../base/CommonItemModel';

export class MarkdownItemModel extends CommonItemModel {
  render() {
    return (
      <FormItem shouldUpdate showLabel={false}>
        <DisplayMarkdown value={this.props.content} />
      </FormItem>
    );
  }
}

MarkdownItemModel.registerFlow({
  key: 'markdownItemSetting',
  title: '{{t("Markdown settings")}}',
  steps: {
    content: {
      title: '{{t("Edit content")}}',
      defaultParams: {
        content: 'This is a demo text, **supports Markdown syntax**.',
      },
      uiSchema(ctx) {
        return {
          content: {
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: { minRows: 3, maxRows: 20 },
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          content: params.content,
        });
      },
    },
  },
});

MarkdownItemModel.define({
  label: '{{t("Markdown")}}',
});
