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
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { Spin, Avatar, Flex } from 'antd';
import { avatars } from '../avatars';
import { tval } from '@nocobase/utils/client';

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
                <Flex align="center">
                  <Avatar
                    style={{
                      marginRight: '8px',
                    }}
                    src={avatars(aiEmployee.avatar)}
                  />
                  <Flex vertical={true}>
                    <div>{aiEmployee.nickname}</div>
                    <div
                      style={{
                        fontSize: token.fontSizeSM,
                        color: token.colorTextSecondary,
                      }}
                    >
                      {aiEmployee.position}
                    </div>
                  </Flex>
                </Flex>
              </SchemaInitializerItem>
            );
          },
        }));
  },
});

export const aiEmployeesInitializer = getAIEmployeesInitializer();
