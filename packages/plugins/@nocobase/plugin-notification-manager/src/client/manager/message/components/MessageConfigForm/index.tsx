/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';

export const MessageConfigForm = ({ variableOptions }) => {
  const createMessageFormSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: 'title',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      channelId: {
        type: 'number',
        title: 'channel',
        'x-decorator': 'FormItem',
        'x-component': 'RemoteSelect',
        'x-component-props': {
          multiple: false,
          fieldNames: {
            label: 'title',
            value: 'id',
          },
          service: {
            resource: 'channels',
            action: 'list',
          },
          style: {
            width: '100%',
          },
        },
      },
      receivers: {
        type: 'array',
        name: 'receivers',
        title: 'Receivers',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems',
        items: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            input: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Variable.Input',
              'x-component-props': { scope: variableOptions },
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: 'Add entry',
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      content: {
        type: 'object',
        properties: {
          body: {
            type: 'string',
            title: 'contentd',
            'x-decorator': 'FormItem',
            'x-component': 'Variable.Input',
            'x-component-props': { scope: variableOptions },
          },
        },
      },
    },
  };
  return <SchemaComponent schema={createMessageFormSchema} />;
};
