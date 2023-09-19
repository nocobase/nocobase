import { generateNTemplate } from '../../../../locale';

export const menuItemSchema = {
  properties: {
    name: {
      type: 'string',
      title: generateNTemplate('Menu name'),
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
    icon: {
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
      title: generateNTemplate('Icon'),
      'x-component-props': {},
    },
  },
};
