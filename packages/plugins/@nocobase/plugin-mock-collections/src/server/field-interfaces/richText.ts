/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { faker } from '@faker-js/faker';

export const richText = {
  options: () => ({
    interface: 'richText',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'RichText',
    },
  }),
  mock: () => faker.lorem.paragraphs(),
};
