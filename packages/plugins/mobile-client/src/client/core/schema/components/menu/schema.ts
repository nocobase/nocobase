export const menuItemSchema = {
  properties: {
    name: {
      type: 'string',
      title: `{{t('Menu name')}}`,
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    icon: {
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
      title: `{{t('Icon')}}`,
      'x-component-props': {},
    },
  },
};
