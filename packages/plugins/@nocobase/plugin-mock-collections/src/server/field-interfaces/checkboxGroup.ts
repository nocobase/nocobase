import { faker } from '@faker-js/faker';
import _ from 'lodash';

export const checkboxGroup = {
  options: (options) => ({
    interface: 'checkboxGroup',
    type: 'array',
    defaultValue: [],
    // name,
    uiSchema: {
      type: 'array',
      'x-component': 'Checkbox.Group',
      enum: options?.uiSchema?.enum || [
        { value: 'option1', label: 'Option1' },
        { value: 'option2', label: 'Option2' },
        { value: 'option3', label: 'Option3' },
      ],
    },
  }),
  mock: (options) => faker.helpers.arrayElements(_.map(options?.uiSchema?.enum, _.property('value'))),
};
