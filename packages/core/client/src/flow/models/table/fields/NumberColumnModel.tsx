/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { TableColumnModel } from '../../TableColumnModel';
import { InputNumberReadPretty } from '../components/InputNumberReadPretty';

export class NumberColumnModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['number'];
  render() {
    console.log(this.props);
    return (value, record, index) => {
      console.log(value);
      return (
        <>
          <InputNumberReadPretty value={value} />
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}

NumberColumnModel.registerFlow({
  key: 'options',
  auto: true,
  sort: 100,
  steps: {
    step1: {
      handler(ctx, params) {},
    },
  },
});
