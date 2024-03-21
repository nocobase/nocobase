import { faker } from '@faker-js/faker';

export const number = {
  options: () => ({
    type: 'double',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  }),
  mock: () => faker.number.float({ max: 1000 }),
};
