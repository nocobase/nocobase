import { faker } from '@faker-js/faker';

export const textarea = {
  options: () => ({
    interface: 'textarea',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  }),
  mock: () => faker.lorem.lines(),
};
