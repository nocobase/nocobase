/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Flex, Popover } from 'antd';
import { AIEmployee } from './types';
import { avatars } from './avatars';
import { useToken } from '@nocobase/client';
import { ProfileCard } from './ProfileCard';

export const AIEmployeeListItem: React.FC<{
  aiEmployee: AIEmployee;
  onClick?: () => void;
}> = ({ aiEmployee, onClick }) => {
  const { token } = useToken();

  return (
    <Popover content={<ProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
      <Flex align="center" onClick={onClick}>
        <Avatar
          style={{
            marginRight: '8px',
          }}
          shape="square"
          size="large"
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
    </Popover>
  );
};
