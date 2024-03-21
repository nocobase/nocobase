import { ISchema, Schema } from '@formily/react';
import { isArr } from '@formily/shared';
import { getDefaultFormat, str2moment } from '@nocobase/utils/client';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { CollectionFieldOptions_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { Field } from '@formily/core';

export const useLabelUiSchemaV2 = () => {
  const { getCollectionJoinField } = useCollectionManager_deprecated();

  return (collectionName: string, label: string): ISchema => {
    if (!collectionName) {
      return;
    }
    const labelField = getCollectionJoinField(`${collectionName}.${label}`) as CollectionFieldOptions_deprecated;
    return labelField?.uiSchema;
  };
};

export const useLabelUiSchema = (collectionName: string, label: string): ISchema => {
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  if (!collectionName) {
    return;
  }
  const labelField = getCollectionJoinField(`${collectionName}.${label}`) as CollectionFieldOptions_deprecated;
  return labelField?.uiSchema;
};

export const getDatePickerLabels = (props): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props) as dayjs.Dayjs;
  const labels = m && m.isValid() ? m.format(format) : props.value;
  return isArr(labels) ? labels.join('~') : labels;
};

const toArr = (v) => {
  if (!v) {
    return [];
  }
  return Array.isArray(v) ? v : [v];
};

export const getLabelFormatValue = (labelUiSchema: ISchema, value: any, isTag = false): any => {
  const options = labelUiSchema?.enum;
  if (Array.isArray(options) && value) {
    const values = toArr(value).map((val) => {
      const opt: any = options.find((option: any) => option.value === val);
      if (isTag) {
        return React.createElement(Tag, { color: opt?.color }, opt?.label);
      }
      return opt?.label;
    });
    return isTag ? values : values.join(', ');
  }
  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value });
    default:
      return value;
  }
};

export const getTabFormatValue = (labelUiSchema: ISchema, value: any, tagColor): any => {
  const options = labelUiSchema?.enum;
  if (Array.isArray(options) && value) {
    const values = toArr(value).map((val) => {
      const opt: any = options.find((option: any) => option.value === val);
      return React.createElement(Tag, { color: tagColor || opt?.color }, opt?.label);
    });
    return values;
  }
  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return React.createElement(
        Tag,
        { color: tagColor },
        getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value }),
      );

    default:
      return React.createElement(Tag, { color: tagColor }, value);
  }
};

export function flatData(data) {
  const newArr = [];
  for (let i = 0; i < data.length; i++) {
    const children = data[i]['children'];
    if (Array.isArray(children)) {
      newArr.push(...flatData(children));
    }
    newArr.push({ ...data[i] });
  }
  return newArr;
}

export function isShowFilePicker(labelUiSchema) {
  return labelUiSchema?.['x-component'] === 'Preview';
}

/**
 * 当前字段的模式是否是 `子表格` 或者 `子表单`
 */
export function isSubMode(field: any) {
  const mode = field['x-component-props']?.mode || (field as Field).componentProps?.mode;
  return ['Nester', 'SubTable', 'PopoverNester'].includes(mode);
}
