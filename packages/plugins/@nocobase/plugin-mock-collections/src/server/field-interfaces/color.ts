import { faker } from '@faker-js/faker';

export const color = {
  options: (options) => ({
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'ColorPicker',
      default: '#1677FF',
    },
  }),
  mock: () => faker.color.rgb(),
};
