/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer, useToken } from '@nocobase/client';
import { useAIEmployeesContext } from '../../AIEmployeesProvider';
import { Spin } from 'antd';
import { tval } from '@nocobase/utils/client';
import { AIEmployeeListItem } from '../../AIEmployeeListItem';

const getAIEmployeesInitializer = () => ({
  name: 'aiEmployees',
  title: tval('AI employees', { ns: 'ai' }),
  type: 'subMenu',
  useChildren() {
    const {
      aiEmployees,
      service: { loading },
    } = useAIEmployeesContext();
    const { token } = useToken();

    return loading
      ? [
          {
            name: 'spin',
            Component: () => <Spin />,
          },
        ]
      : aiEmployees.map((aiEmployee) => ({
          name: aiEmployee.username,
          style: {
            height: 'fit-content',
            lineHeight: token.lineHeight,
          },
          Component: () => {
            const { insert } = useSchemaInitializer();
            const handleClick = () => {
              insert({
                type: 'void',
                'x-component': 'AIEmployeeButton',
                'x-toolbar': 'ActionSchemaToolbar',
                'x-settings': 'aiEmployees:button',
                'x-component-props': {
                  username: aiEmployee.username,
                },
              });
            };
            return (
              <SchemaInitializerItem onClick={handleClick}>
                <AIEmployeeListItem aiEmployee={aiEmployee} />
              </SchemaInitializerItem>
            );
          },
        }));
  },
});

export const aiEmployeesInitializer = getAIEmployeesInitializer();
