/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DisplayItemModel } from '@nocobase/flow-engine';

import { FieldModel, ApplicationContext, tval } from '@nocobase/client';
import { Display } from './components/Display';

export class DisplayVditorFieldModel extends FieldModel {
  public render() {
    const { value } = this.props;
    const app = this.context.app;
    if (!value) {
      return <div></div>;
    }
    return (
      <ApplicationContext.Provider value={app}>
        <Display value={value} ellipsis={this.props.textOnly} />
      </ApplicationContext.Provider>
    );
  }
}

DisplayVditorFieldModel.registerFlow({
  key: 'markdownVditorSettings',
  title: tval('MarkdownVditor settings'),
  sort: 200,
  steps: {
    displayMode: {
      use: 'displayMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayVditorFieldModel', ['vditor'], { isDefault: true });
