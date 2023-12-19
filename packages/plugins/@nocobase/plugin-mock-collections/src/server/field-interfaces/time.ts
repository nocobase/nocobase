import { faker } from '@faker-js/faker';
import { dayjs } from '@nocobase/utils';

export const time = {
  options: () => ({
    type: 'time',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'TimePicker',
      'x-component-props': {
        format: 'HH:mm:ss',
      },
    },
  }),
  mock: () => dayjs(faker.date.anytime()).format('HH:mm:ss'),
};
