/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs, getDefaultFormat, str2moment } from '@nocobase/utils/client';
import React from 'react';

const arrayToLabel = (value: any) => {
  return Array.isArray(value) ? value.join('~') : value;
};

export const getDatePickerLabel = (props): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props) as dayjs.Dayjs;
  return arrayToLabel(m && m.isValid() ? m.format(format) : props.value);
};

export const getLabelFormatValue = (labelUiSchema: any, value: any): any => {
  if (Array.isArray(labelUiSchema?.enum) && value !== undefined && value !== null) {
    const opt: any = labelUiSchema.enum.find((option: any) => option.value === value);
    return opt?.label ?? value;
  }

  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return getDatePickerLabel({ ...labelUiSchema?.['x-component-props'], value });
    default:
      return value;
  }
};

export const toPlainLabel = (value: any) => {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (React.isValidElement(value)) {
    return String((value as React.ReactElement<any>).props?.children ?? '');
  }
  return String(value);
};
