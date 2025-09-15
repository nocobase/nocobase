/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { DisplayMarkdown } from '../../internal/components/Markdown/DisplayMarkdown';
import { FieldModel } from '../base';

export class MarkdownReadPrettyFieldModel extends FieldModel {
  public static readonly supportedFieldInterfaces = ['markdown'];
  public render() {
    const { textOnly = true, value } = this.props;
    return <DisplayMarkdown textOnly={textOnly} value={value} />;
  }
}

MarkdownReadPrettyFieldModel.registerFlow({
  key: 'markdownSettings',
  title: tval('Markdown settings'),
  sort: 200,
  steps: {
    displayMode: {
      use: 'displayMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('MarkdownReadPrettyFieldModel', ['markdown', 'richText'], {
  isDefault: true,
});
