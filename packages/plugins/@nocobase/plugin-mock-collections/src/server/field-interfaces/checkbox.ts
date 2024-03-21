import { faker } from '@faker-js/faker';

export const checkbox = {
  options: () => ({
    type: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  }),
  mock: () => faker.datatype.boolean(),
};
