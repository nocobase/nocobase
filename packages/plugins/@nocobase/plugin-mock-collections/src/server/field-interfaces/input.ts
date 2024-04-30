/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { faker } from '@faker-js/faker';

export const input = {
  options: () => ({
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  }),
  mock: (option) => {
    if (option.collectionName === 'roles' && option.name === 'name') {
      // roles.name can only include A-Z, a-z, 0-9, _-*$
      return faker.string.alpha(10);
    }

    return faker.word.words({ count: { min: 5, max: 10 } });
  },
};
