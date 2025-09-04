/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { escapeT } from '@nocobase/flow-engine';
import { FilterFormEditableFieldModel } from '../FilterFormEditableFieldModel';
import { DateFilterDynamicComponent } from '../../../../../../schema-component';

export class DateTimeFilterFormFieldModel extends FilterFormEditableFieldModel {
  declare decorator: any;
  enableDisplayMode = false;

  setComponentProps(componentProps) {
    const operator = this.props.operator;
    let { dateFormat, timeFormat } = componentProps || {};
    if (!componentProps.format && (dateFormat || timeFormat)) {
      if (!dateFormat) {
        dateFormat = this.field.componentProps?.dateFormat || 'YYYY-MM-DD';
      }
      if (!timeFormat) {
        timeFormat = this.field.componentProps?.timeFormat || 'HH:mm:ss';
      }
      componentProps.format = componentProps?.showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    }
    //@ts-ignore
    super.setComponentProps({
      ...componentProps,
      isRange: operator === '$dateBetween',
    });
  }

  get component() {
    return [DateFilterDynamicComponent, {}];
  }
}

DateTimeFilterFormFieldModel.registerFlow({
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
