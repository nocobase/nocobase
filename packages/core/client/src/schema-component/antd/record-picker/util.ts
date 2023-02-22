import { ISchema } from '@formily/react';
import { isArr } from '@formily/shared';
import { getDefaultFormat, str2moment } from '@nocobase/utils/client';
import moment from 'moment';
import { CollectionFieldOptions, useCollectionManager } from '../../../collection-manager';

export const useLabelUiSchema = (collectionField: CollectionFieldOptions, label: string): ISchema => {
  const { getCollectionJoinField } = useCollectionManager();
  if (!collectionField) {
    return;
  }
  const labelField = getCollectionJoinField(`${collectionField.target}.${label}`) as CollectionFieldOptions;
  return labelField?.uiSchema;
};

export const getDatePickerLabels = (props): string => {
  const format = getDefaultFormat(props) as string;
  const m = str2moment(props.value, props) as moment.Moment;
  const labels = m && m.isValid() ? m.format(format) : props.value;
  return isArr(labels) ? labels.join('~') : labels;
};

export const getLabelFormatValue = (labelUiSchema: ISchema, value: any): string => {
  if (Array.isArray(labelUiSchema?.enum) && value) {
    const opt: any = labelUiSchema.enum.find((option: any) => option.value === value);
    return opt?.label;
  }
  switch (labelUiSchema?.['x-component']) {
    case 'DatePicker':
      return getDatePickerLabels({ ...labelUiSchema?.['x-component-props'], value });
    default:
      return value;
  }
};
