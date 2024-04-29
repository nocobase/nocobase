/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
