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

export class PercentColumnModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['percent'];
  render() {
    return (value, record, index) => {
      return (
        <>
          <InputNumberReadPretty value={value} />
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}
