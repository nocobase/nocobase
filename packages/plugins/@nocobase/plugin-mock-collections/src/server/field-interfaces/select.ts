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
        { value: 'option1', label: 'Option1', color: 'red' },
        { value: 'option2', label: 'Option2', color: 'green' },
        { value: 'option3', label: 'Option3', color: 'blue' },
      ],
    },
  }),
  mock: (options) => faker.helpers.arrayElement(_.map(options?.uiSchema?.enum, _.property('value'))),
};
