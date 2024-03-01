import { faker } from '@faker-js/faker';

export const input = {
  options: () => ({
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  }),
  mock: (option) => {
    if (option.collectionName === 'roles' && option.name === 'name') {
      // roles.name can only include A-Z, a-z, 0-9, _-*$
      return faker.word.words(1);
    }

    return faker.word.words({ count: { min: 5, max: 10 } });
  },
};
