import { faker } from '@faker-js/faker';

export const email = {
  options: () => ({
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-validator': 'email',
    },
  }),
  mock: () => faker.internet.email(),
};
