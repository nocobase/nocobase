/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tStr } from '../locale';

export const lightComponentsCollection = {
  name: 'lightComponents',
  filterTargetKey: 'key',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: tStr('Title'),
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'key',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Key")}}',
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: tStr('Description'),
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'date',
      name: 'updatedAt',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: tStr('Updated At'),
        'x-component': 'DatePicker',
        'x-read-pretty': true,
      },
    },
  ],
};
