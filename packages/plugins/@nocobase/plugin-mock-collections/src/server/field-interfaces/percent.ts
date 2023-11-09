import { faker } from '@faker-js/faker';

export const percent = {
  options: () => ({
    type: 'float',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Percent',
      'x-component-props': {
        stringMode: true,
        step: '1',
        addonAfter: '%',
      },
    },
  }),
  mock: () => faker.number.float({ max: 1000 }),
};
