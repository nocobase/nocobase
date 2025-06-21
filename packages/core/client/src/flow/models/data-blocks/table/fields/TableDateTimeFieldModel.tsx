/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import React from 'react';
import { TableFieldModel } from './TableFieldModel';

export class TableDateTimeFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];

  public render() {
    return (
      <div>
        {this.props.prefix}
        {dayjs(this.getValue()).format('YYYY-MM-DD')}
        {this.props.suffix}
      </div>
    );
  }
}
