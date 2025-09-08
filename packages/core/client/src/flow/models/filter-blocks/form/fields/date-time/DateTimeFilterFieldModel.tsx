/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { escapeT } from '@nocobase/flow-engine';
import { FilterFormFieldModel } from '../FilterFormFieldModel';
import { DateFilterDynamicComponent } from './components/DateFilterDynamicComponent';

export class DateTimeFilterFieldModel extends FilterFormFieldModel {
  get component() {
    return [DateFilterDynamicComponent, {}];
  }
}

DateTimeFilterFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 1000,
  title: escapeT('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: escapeT('Date display format'),
    },
  },
});
