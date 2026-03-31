/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent, css } from '@nocobase/client';
import { useLocalTranslation, NAMESPACE } from '../../locale';
import { UsersSelect } from './UsersSelect';
import { UsersAddition } from './UsersAddition';
import { tval } from '@nocobase/utils/client';
import { getConfigFormCommonFieldset } from './configFormCommonFieldset';

export const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ UsersSelect, UsersAddition }}
      schema={{
        type: 'void',
        properties: {
          receivers: {
            type: 'array',
            title: `{{t("Receivers")}}`,
            description: tval(
              'When select receivers from node result, only support ID of user (or IDs array of users). Others will not match any user.',
              { ns: NAMESPACE },
            ),
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                className: css`
                  width: 100%;
                  &.ant-space.ant-space-horizontal {
                    flex-wrap: nowrap;
                  }
                  > .ant-space-item:nth-child(2) {
                    flex-grow: 1;
                  }
                `,
              },
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'UsersSelect',
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            required: true,
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add receiver")}}`,
                'x-component': 'UsersAddition',
              },
            },
          },
          ...getConfigFormCommonFieldset({ variableOptions }),
        },
      }}
    />
  );
};
