/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { ApplicationContext, FormFieldModel } from '@nocobase/client';
import React from 'react';
import { largeField } from '@nocobase/flow-engine';
import { MarkdownVditor } from './components/index';
@largeField()
export class MarkdownVditorEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['vditor'];

  get component() {
    return [
      (props) => {
        return (
          <ApplicationContext.Provider value={this.context.app}>
            <MarkdownVditor {...props} />
          </ApplicationContext.Provider>
        );
      },
      {},
    ];
  }
}
