/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { SchemaComponent } from '@nocobase/client';
import { ChannelTypeMapContext } from '../../../../hooks';
import { observer, useField } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
const ContentConfigForm = () => {
  const { typeMap } = useContext(ChannelTypeMapContext);
};
export const MessageConfigForm = observer<{ variableOptions: any }>(
  ({ variableOptions }) => {
    const field = useField();
    // const mapOptions = (_, option) => {
    //   return { ...option, value: `${option.id}|${option.NotificationType}` };
    // };
    // const api = useAPIClient();
    // api.request({
    //   url: '/channels:get',
    // });

    const createMessageFormSchema = {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          title: 'title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        channel: {
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
              title: 'content',
              'x-decorator': 'FormItem',
              'x-component': 'Variable.RawTextArea',
              'x-component-props': {
                scope: variableOptions,
                placeholder: 'Hi,',
                autoSize: {
                  minRows: 10,
                },
              },
            },
            config: {},
          },
        },
      },
    };
    return <SchemaComponent schema={createMessageFormSchema} />;
  },
  { displayName: 'MessageConfigForm' },
);
