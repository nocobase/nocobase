import { faker } from '@faker-js/faker';

export const integer = {
  options: () => ({
    type: 'bigInt',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  }),
  mock: () => faker.number.int({ max: 10000 }),
};
