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
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{t("Option value")}}',
              },
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
  const options = getOptionsSchema();
  const propsSchema = {
    DatePicker: {
      type: 'object',
      properties: {
        showTime,
      },
    },
    'DatePicker.RangePicker': {
      type: 'object',
      properties: {
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
