import { moment2str } from '@nocobase/utils/client';
import dayjs from 'dayjs';

export const getOptionsSchema = () => {
  const options = {
    title: '{{t("Options")}}',
    type: 'array',
    'x-decorator': 'FormItem',
    'x-component': 'ArrayItems',
    items: {
      type: 'object',
      'x-decorator': 'ArrayItems.Item',
      properties: {
        space: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            label: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{t("Option label")}}',
              },
              required: true,
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{t("Option value")}}',
              },
              required: true,
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
      },
    },
    properties: {
      add: {
        type: 'void',
        title: 'Add',
        'x-component': 'ArrayItems.Addition',
      },
    },
  };
  return options;
};

export const getPropsSchemaByComponent = (component: string) => {
  const showTime = {
    type: 'boolean',
    'x-content': '{{ t("Show time") }}',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
  };
  const dateFormat = {
    type: 'string',
    title: '{{t("Date format")}}',
    'x-component': 'Radio.Group',
    'x-decorator': 'FormItem',
    default: 'YYYY-MM-DD',
    enum: [
      {
        label: '{{t("Year/Month/Day")}}',
        value: 'YYYY/MM/DD',
      },
      {
        label: '{{t("Year-Month-Day")}}',
        value: 'YYYY-MM-DD',
      },
      {
        label: '{{t("Day/Month/Year")}}',
        value: 'DD/MM/YYYY',
      },
    ],
  };
  const options = getOptionsSchema();
  const propsSchema = {
    DatePicker: {
      type: 'object',
      properties: {
        dateFormat,
        showTime,
      },
    },
    'DatePicker.RangePicker': {
      type: 'object',
      properties: {
        dateFormat,
        showTime,
      },
    },
    Select: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: [
            {
              label: '{{ t("Single select") }}',
              value: '',
            },
            {
              label: '{{ t("Multiple select") }}',
              value: 'multiple',
            },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {
            defaultValue: '',
          },
        },
        options,
      },
    },
    'Checkbox.Group': {
      type: 'object',
      properties: {
        options,
      },
    },
    'Radio.Group': {
      type: 'object',
      properties: {
        options,
      },
    },
  };
  return propsSchema[component];
};

export const transformValue = (value: any, props: any) => {
  if (!value) {
    return value;
  }
  if (dayjs.isDayjs(value)) {
    if (!props.showTime) {
      value = value.startOf('day');
    }
    return moment2str(value, props);
  }
  if (Array.isArray(value) && value.length && dayjs.isDayjs(value[0])) {
    let start = value[0];
    let end = value[1];
    if (props.showTime) {
      start = start.startOf('day');
      end = end.endOf('day');
    }
    return [start.toISOString(), end.toISOString()];
  }
  return value;
};

export const setDefaultValue = async (field: any, variables: any) => {
  const defaultValue = field.initialValue;
  const isVariable =
    typeof defaultValue === 'string' && defaultValue?.startsWith('{{$') && defaultValue?.endsWith('}}');
  if (!isVariable || !variables) {
    field.setValue(defaultValue);
    field.setInitialValue(defaultValue);
  } else {
    field.loading = true;
    const value = await variables.parseVariable(defaultValue);
    const transformedValue = transformValue(value, field.componentProps);
    field.setValue(transformedValue);
    field.setInitialValue(transformedValue);
    field.loading = false;
  }
};
