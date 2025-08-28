/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';
import { MarkdownReadPretty } from '../../../internal/components/MarkdownDisplay/MarkdownReadPretty';
import { FormItem } from './FormItem/FormItem';
export class MarkdownItemModel extends FormCustomFormItemModel {
  render() {
    return (
      <FormItem shouldUpdate showLabel={false}>
        <MarkdownReadPretty value={this.props.content} />
      </FormItem>
    );
  }
}

MarkdownItemModel.registerFlow({
  key: 'markdownItemSetting',
  title: '{{t("Markdown Setting")}}',
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
  label: '{{t("Add markdown")}}',
});
