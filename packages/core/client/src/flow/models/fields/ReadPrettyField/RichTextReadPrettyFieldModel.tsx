/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reactive } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { MarkdownReadPretty } from '../../../internal/components/MarkdownReadPretty';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

export class RichTextReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['richText'];
  // @reactive
  public render() {
    const { textOnly = true } = this.props;
    const value = this.getValue();
    return <MarkdownReadPretty textOnly={textOnly} value={value} />;
  }
}

RichTextReadPrettyFieldModel.registerFlow({
  key: 'richTextSettings',
  title: tval('Rich text settings'),
  sort: 200,
  steps: {
    displayMode: {
      use: 'displayMode',
    },
  },
});
