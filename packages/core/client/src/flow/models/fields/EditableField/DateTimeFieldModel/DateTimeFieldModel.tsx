/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from 'antd';
import { escapeT } from '@nocobase/flow-engine';
import { FormFieldModel } from '../FormFieldModel';

export class DateTimeFieldModel extends FormFieldModel {
  setProps(props) {
    let { dateFormat, timeFormat } = props || {};
    if (!props.format && (dateFormat || timeFormat)) {
      if (!dateFormat) {
        dateFormat = this.props?.dateFormat || 'YYYY-MM-DD';
      }
      if (!timeFormat) {
        timeFormat = this.props?.timeFormat || 'HH:mm:ss';
      }
      props.format = props?.showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    }
    super.setProps({
      ...props,
    });
  }

  get component() {
    return [DatePicker, {}];
  }
}

DateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 600,
  title: escapeT('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: escapeT('Date display format'),
    },
  },
});
