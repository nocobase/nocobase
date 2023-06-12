export const tabItemSchema = {
  properties: {
    title: {
      type: 'string',
      title: `{{ t('Title') }}`,
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    icon: {
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
      title: `{{ t('Icon') }}`,
      'x-component-props': {},
    },
  },
};
