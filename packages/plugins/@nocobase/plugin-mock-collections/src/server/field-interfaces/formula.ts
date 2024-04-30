/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const formula = {
  options: () => ({
    type: 'formula',
    dataType: 'double',
    engine: 'math.js',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Formula.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-read-pretty': true,
    },
  }),
};
