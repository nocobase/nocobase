/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { isArr } from '@formily/shared';
import { dayjs, getDefaultFormat, str2moment } from '@nocobase/utils/client';
import { Tag } from 'antd';
import React, { Component } from 'react';
import { CollectionFieldOptions_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';

export const useLabelUiSchema = (collectionField: CollectionFieldOptions_deprecated, label: string): ISchema => {
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  if (!collectionField) {
    return;
  }
  const labelField = getCollectionJoinField(`${collectionField.target}.${label}`) as CollectionFieldOptions_deprecated;
  return labelField?.uiSchema;
};

export const getDatePickerLabels = (props): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props) as dayjs.Dayjs;
  const labels = m && m.isValid() ? m.format(format) : props.value;
  return isArr(labels) ? labels.join('~') : labels;
};

export const getLabelFormatValue = (
  labelUiSchema: ISchema,
  value: any,
  isTag = false,
  targetTitleCollectionField?,
  TitleRenderer?: any,
): any => {
  if (TitleRenderer) {
    return <TitleRenderer value={value} collectionField={targetTitleCollectionField} />;
  }
  if (Array.isArray(labelUiSchema?.enum) && value) {
    const opt: any = labelUiSchema.enum.find((option: any) => option.value === value);
    if (isTag) {
      return React.createElement(Tag, { color: opt?.color }, opt?.label);
    }
    return opt?.label;
  }
  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value });
    default:
      return value;
  }
};
