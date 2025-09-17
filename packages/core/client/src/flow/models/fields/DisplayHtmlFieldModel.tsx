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

export class DisplayHtmlFieldModel extends FieldModel {
  public render() {
    const { textOnly = true, value } = this.props;
    return <DisplayMarkdown textOnly={textOnly} value={value} />;
  }
}

DisplayHtmlFieldModel.registerFlow({
  key: 'htmlFieldSettings',
  title: tval('Content settings'),
  sort: 200,
  steps: {
    renderMode: {
      use: 'renderMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayHtmlFieldModel', ['markdown', 'richText'], {
  isDefault: true,
});
