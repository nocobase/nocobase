/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tStr } from '../locale';

export const flowModelTemplatesCollection = {
  name: 'flowModelTemplates',
  filterTargetKey: 'uid',
  fields: [
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: tStr('Template name'),
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
        title: tStr('Template description'),
        'x-component': 'Input.TextArea',
        'x-component-props': {
          rows: 3,
        },
      },
    },
    {
      type: 'string',
      name: 'targetUid',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'targetUid',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      type: 'string',
      name: 'useModel',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'useModel',
        'x-component': 'Input',
        'x-disabled': true,
        'x-hidden': true,
      },
    },
    {
      type: 'string',
      name: 'dataSourceKey',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'dataSourceKey',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      type: 'string',
      name: 'collectionName',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'collectionName',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      type: 'string',
      name: 'associationName',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'associationName',
        'x-component': 'Input',
        'x-disabled': true,
        'x-hidden': true,
      },
    },
    {
      type: 'string',
      name: 'filterByTk',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'filterByTk',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      type: 'string',
      name: 'sourceId',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'sourceId',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      type: 'number',
      name: 'usageCount',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: tStr('Usage count'),
        'x-component': 'InputNumber',
        'x-disabled': true,
      },
    },
  ],
};
