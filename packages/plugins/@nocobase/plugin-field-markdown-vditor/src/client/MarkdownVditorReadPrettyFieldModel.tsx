/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { reactive } from '@nocobase/flow-engine';
import { ReadPrettyFieldModel, ApplicationContext } from '@nocobase/client';
import { Display } from './components/Display';

export class MarkdownVditorReadPrettyFieldModel extends ReadPrettyFieldModel {
  static readonly supportedFieldInterfaces = ['vditor'];

  @reactive
  public render() {
    const value = this.getValue();
    const app = this.ctx.globals.app;
    if (!value) {
      return <div></div>;
    }
    return (
      <ApplicationContext.Provider value={app}>
        <Display value={value} />
      </ApplicationContext.Provider>
    );
  }
}
