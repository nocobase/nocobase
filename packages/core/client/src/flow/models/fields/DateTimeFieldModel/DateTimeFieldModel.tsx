/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from 'antd';
import React from 'react';
import { tExpr } from '@nocobase/flow-engine';
import { FieldModel } from '../../base';

export class DateTimeFieldModel extends FieldModel {}

DateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 3000,
  title: tExpr('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tExpr('Date display format'),
    },
  },
});
