/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { DisplayTitleFieldModel, tval } from '@nocobase/client';
import { Display } from './components/Display';

export class DisplayVditorFieldModel extends DisplayTitleFieldModel {
  public renderComponent(value) {
    if (!value) {
      return;
    }
    return <Display value={value} ellipsis={this.props.textOnly} />;
  }
}
DisplayVditorFieldModel.define({
  label: escapeT('MarkdownVditor'),
});

DisplayVditorFieldModel.registerFlow({
  key: 'markdownVditorSettings',
  title: tval('Content settings'),
  sort: 200,
  steps: {
    renderMode: {
      use: 'renderMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayVditorFieldModel', ['vditor'], { isDefault: true });
