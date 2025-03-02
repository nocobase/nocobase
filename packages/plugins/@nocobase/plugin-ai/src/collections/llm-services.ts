/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'llmServices',
  fields: [
    {
      name: 'name',
      type: 'uid',
      primaryKey: true,
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'provider',
      type: 'string',
      interface: 'select',
      uiSchema: {
        title: '{{t("Provider")}}',
        'x-component': 'Select',
      },
    },
    {
      name: 'options',
      type: 'jsonb',
    },
  ],
};
