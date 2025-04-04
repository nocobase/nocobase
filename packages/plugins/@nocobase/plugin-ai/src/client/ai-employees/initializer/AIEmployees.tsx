/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaInitializerItem, useSchemaInitializer } from '@nocobase/client';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { Spin, Avatar } from 'antd';
import { avatars } from '../avatars';

const getAIEmployeesInitializer = (dynamicChatContextHook: string) => ({
  name: 'aiEmployees',
  title: 'AI employees',
  type: 'subMenu',
  useChildren() {
    const {
      aiEmployees,
      service: { loading },
    } = useAIEmployeesContext();

    return loading
      ? [
          {
            name: 'spin',
            Component: () => <Spin />,
          },
        ]
      : aiEmployees.map((aiEmployee) => ({
          name: aiEmployee.username,
          Component: () => {
            const { insert } = useSchemaInitializer();
            const handleClick = () => {
              insert({
                type: 'void',
                'x-decorator': 'AIEmployeeChatProvider',
                'x-use-decorator-props': dynamicChatContextHook,
                'x-component': 'AIEmployeeButton',
                'x-toolbar': 'ActionSchemaToolbar',
                'x-settings': 'aiEmployees:button',
                'x-component-props': {
                  aiEmployee,
                },
              });
            };
            return (
              <SchemaInitializerItem
                onClick={handleClick}
                title={aiEmployee.nickname}
                icon={
                  <Avatar
                    style={{
                      marginBottom: '5px',
                    }}
                    src={avatars(aiEmployee.avatar)}
                  />
                }
              />
            );
          },
        }));
  },
});

export const detailsAIEmployeesInitializer = getAIEmployeesInitializer('useDetailsAIEmployeeChatContext');
export const formAIEmployeesInitializer = getAIEmployeesInitializer('useFormAIEmployeeChatContext');
