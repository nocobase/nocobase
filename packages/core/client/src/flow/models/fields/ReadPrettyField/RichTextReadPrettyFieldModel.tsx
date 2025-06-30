/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { tval } from '@nocobase/utils/client';
import { reactive } from '@nocobase/flow-engine';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';
import { MarkdownReadPretty } from '../EditableField/MarkdownEditableFieldModel/index';

export class RichTextReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['richText'];
  @reactive
  public render() {
    const { textOnly = true } = this.props;
    const value = this.getValue();
    return <MarkdownReadPretty textOnly={textOnly} value={value} />;
  }
}

RichTextReadPrettyFieldModel.registerFlow({
  key: 'displayMode',
  title: tval('Specific properties'),
  auto: true,
  sort: 200,
  steps: {
    displayMode: {
      uiSchema: {
        textOnly: {
          type: 'string',
          enum: [
            { label: tval('Text only'), value: true },
            { label: tval('Html'), value: false },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
      },
      title: tval('Display mode'),
      defaultParams: {
        textOnly: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ textOnly: params.textOnly });
      },
    },
  },
});
