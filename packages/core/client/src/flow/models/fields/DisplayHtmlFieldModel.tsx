/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { DisplayMarkdown } from '../../internal/components/Markdown/DisplayMarkdown';
import { DisplayTitleFieldModel } from './DisplayTitleFieldModel';

export class DisplayHtmlFieldModel extends DisplayTitleFieldModel {
  public renderComponent(value) {
    const { textOnly = true } = this.props;
    return textOnly ? value : <DisplayMarkdown {...this.props} textOnly={textOnly} value={value} />;
  }
}

DisplayHtmlFieldModel.define({
  label: escapeT('HTML'),
});

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
