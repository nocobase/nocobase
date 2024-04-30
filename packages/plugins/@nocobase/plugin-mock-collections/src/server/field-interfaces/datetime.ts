/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
