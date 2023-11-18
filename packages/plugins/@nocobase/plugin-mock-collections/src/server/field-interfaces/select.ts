import { faker } from '@faker-js/faker';
import _ from 'lodash';

export const select = {
  options: (options) => ({
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Select',
      enum: options?.uiSchema?.enum || [
        { value: 'option1', label: 'Option1' },
        { value: 'option2', label: 'Option2' },
        { value: 'option3', label: 'Option3' },
      ],
    },
  }),
  mock: (options) => faker.helpers.arrayElement(_.map(options?.uiSchema?.enum, _.property('value'))),
};
