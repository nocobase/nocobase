/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { SchemaInitializer, useAPIClient, useRequest, useSchemaInitializer } from '@nocobase/client';
import { ReactComponent as DesignIcon } from '../design-icon.svg';
import { AIEmployee, AIEmployeesContext, useAIEmployeesContext } from '../AIEmployeesProvider';
import { Spin, Avatar } from 'antd';
import { avatars } from '../avatars';

export const configureAIEmployees = new SchemaInitializer({
  name: 'aiEmployees:configure',
  title: '{{t("AI employees")}}',
  icon: (
    <span
      style={{
        width: '20px',
        display: 'inline-flex',
        verticalAlign: 'top',
      }}
    >
      <DesignIcon />
    </span>
  ),
  style: {
    marginLeft: 8,
  },
  items: [
    {
      name: 'ai-employees',
      type: 'itemGroup',
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
              title: aiEmployee.nickname,
              icon: <Avatar src={avatars(aiEmployee.avatar)} />,
              type: 'item',
              useComponentProps() {
                const { insert } = useSchemaInitializer();
                const handleClick = () => {
                  insert({
                    type: 'void',
                    'x-component': 'AIEmployeeButton',
                    'x-toolbar': 'ActionSchemaToolbar',
                    'x-settings': 'aiEmployees:button',
                    'x-component-props': {
                      aiEmployee,
                    },
                  });
                };

                return {
                  onClick: handleClick,
                };
              },
            }));
      },
    },
  ],
});
