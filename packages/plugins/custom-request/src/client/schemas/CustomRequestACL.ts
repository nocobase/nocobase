import { generateNTemplate } from '../locale';

export const CustomRequestACLSchema = {
  type: 'object',
  properties: {
    roles: {
      type: 'array',
      title: generateNTemplate('Roles'),
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        tooltip: generateNTemplate('If not set, all roles can see this action'),
      },
      'x-component': 'Select',
      'x-component-props': {
        multiple: true,
        fieldNames: {
          label: 'title',
          value: 'name',
        },
        objectValue: true,
        options: '{{ currentRoles }}',
      },
    },
  },
};
