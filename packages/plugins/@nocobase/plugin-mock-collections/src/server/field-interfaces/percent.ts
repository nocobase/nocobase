/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { faker } from '@faker-js/faker';

export const percent = {
  options: () => ({
    type: 'float',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Percent',
      'x-component-props': {
        stringMode: true,
        step: '1',
        addonAfter: '%',
      },
    },
  }),
  mock: () => faker.number.float({ max: 1000 }),
};
