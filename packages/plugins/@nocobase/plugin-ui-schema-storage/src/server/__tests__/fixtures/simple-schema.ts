/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'root-name',
  'x-uid': 'root',
  properties: {
    p1: {
      'x-uid': 'p1',
      'x-component-props': {
        title: "alias's",
      },
    },
    p2: {
      'x-uid': 'p2',
      properties: {
        p21: {
          'x-uid': 'p21',
          properties: {
            p211: {
              'x-uid': 'p211',
            },
          },
        },
      },
    },
  },
  items: [
    {
      name: 'i1',
      'x-uid': 'i1',
    },
    {
      name: 'i2',
      'x-uid': 'i2',
    },
  ],
};
