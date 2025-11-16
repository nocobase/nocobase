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
import { CommonItemModel } from '../base';
import { editMarkdownFlow } from '../../flows/editMarkdownFlow';

export class MarkdownItemModel extends CommonItemModel {
  render() {
    console.log(1111, this.props.content);
    return (
      <FormItem shouldUpdate showLabel={false}>
        {this.props.content}
      </FormItem>
    );
  }
}

MarkdownItemModel.registerFlow(editMarkdownFlow);

MarkdownItemModel.define({
  label: '{{t("Markdown")}}',
});
