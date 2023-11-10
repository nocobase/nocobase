import { faker } from '@faker-js/faker';

export const input = {
  options: () => ({
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  }),
  mock: () => faker.word.words({ count: { min: 5, max: 10 } }),
};
