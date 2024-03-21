import { faker } from '@faker-js/faker';

export const datetime = {
  options: () => ({
    type: 'date',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'DatePicker',
      'x-component-props': {
        dateFormat: 'YYYY-MM-DD',
        showTime: false,
      },
    },
  }),
  mock: () => faker.date.anytime(),
};
