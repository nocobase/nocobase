import { faker } from '@faker-js/faker';

export const richText = {
  options: () => ({
    interface: 'richText',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'RichText',
    },
  }),
  mock: () => faker.lorem.paragraphs(),
};
