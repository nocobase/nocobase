/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { FloatButton, Avatar, Dropdown, Popover, Flex } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { useChatBoxContext } from './ChatBoxContext';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { avatars } from '../avatars';
import { ProfileCard } from '../ProfileCard';
import { useToken } from '@nocobase/client';

export const ChatButton: React.FC = () => {
  const { aiEmployees } = useAIEmployeesContext();
  const open = useChatBoxContext('open');
  const setOpen = useChatBoxContext('setOpen');
  const switchAIEmployee = useChatBoxContext('switchAIEmployee');
  const { token } = useToken();

  const items = useMemo(() => {
    return aiEmployees?.map((employee) => ({
      key: employee.username,
      label: (
        <Popover content={<ProfileCard aiEmployee={employee} />} placement="leftTop">
          <div
            className={css`
              display: flex;
              align-items: center;
              min-width: 150px;
            `}
            onClick={() => {
              setOpen(true);
              switchAIEmployee(employee);
            }}
          >
            <Avatar
              src={avatars(employee.avatar)}
              size={28}
              style={{
                marginRight: '8px',
              }}
            />
            <Flex vertical={true}>
              <div>{employee.nickname}</div>
              <div
                style={{
                  fontSize: token.fontSizeSM,
                  color: token.colorTextSecondary,
                }}
              >
                {employee.position}
              </div>
            </Flex>
          </div>
        </Popover>
      ),
    }));
  }, [aiEmployees]);
  if (!aiEmployees?.length) {
    return null;
  }
  return (
    <div
      className={css`
        .ant-float-btn {
          width: 40px;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content {
          padding: 0;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
          width: 36px;
        }
      `}
    >
      <Dropdown menu={{ items }} placement="topRight">
        <FloatButton
          icon={
            <Avatar
              src={icon}
              size={36}
              style={{
                marginBottom: '4px',
              }}
            />
          }
          onClick={() => {
            setOpen(!open);
          }}
          shape="square"
        />
      </Dropdown>
    </div>
  );
};
