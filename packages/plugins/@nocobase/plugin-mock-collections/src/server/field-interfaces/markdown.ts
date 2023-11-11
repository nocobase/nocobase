import { faker } from '@faker-js/faker';

export const markdown = {
  options: () => ({
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Markdown',
    },
  }),
  mock: () => faker.lorem.paragraphs(),
};
