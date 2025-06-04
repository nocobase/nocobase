/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../constants';

export default {
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only'],
  name: 'workflowStats',
  shared: true,
  autoGenId: false,
  fields: [
    {
      name: 'key',
      type: 'uid',
      primaryKey: true,
    },
    {
      type: 'bigInt',
      name: 'executed',
      defaultValue: 0,
      interface: 'number',
      uiSchema: {
        title: `{{t("Executed", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
  ],
};
