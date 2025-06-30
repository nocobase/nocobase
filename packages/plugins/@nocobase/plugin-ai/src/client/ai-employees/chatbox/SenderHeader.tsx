/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Button, Dropdown, Tag, Avatar, Popover } from 'antd';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { useT } from '../../locale';
import { useChatBoxContext } from './ChatBoxContext';
import { useToken } from '@nocobase/client';
import { UserAddOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { avatars } from '../avatars';
import { ProfileCard } from '../ProfileCard';
import { AddContextButton } from './AddContextButton';
import { AttachmentsHeader } from './AttachmentsHeader';
import { ContextItemsHeader } from './ContextItemsHeader';

export const SenderHeader: React.FC = () => {
  const {
    service: { loading },
    aiEmployees,
  } = useAIEmployeesContext();
  const { token } = useToken();
  const t = useT();
  const switchAIEmployee = useChatBoxContext('switchAIEmployee');
  const currentEmployee = useChatBoxContext('currentEmployee');
  const items = useMemo(() => {
    return aiEmployees?.map((employee) => ({
      key: employee.username,
      label: (
        <AIEmployeeListItem
          aiEmployee={employee}
          onClick={() => {
            switchAIEmployee(employee);
          }}
        />
      ),
    }));
  }, [aiEmployees]);

  return (
    <div
      style={{
        padding: '8px 8px 0 8px',
      }}
    >
      <div>
        {!currentEmployee ? (
          <Button variant="dashed" color="default" size="small">
            <span
              style={{
                color: token.colorTextDescription,
              }}
            >
              <UserAddOutlined />
              {t('Select an')}
            </span>
            <Dropdown menu={{ items }} placement="topLeft">
              {t('AI employee')}
            </Dropdown>
          </Button>
        ) : (
          <Tag
            closeIcon={<CloseCircleOutlined />}
            onClose={() => {
              switchAIEmployee(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: token.colorBgContainer,
            }}
          >
            <Popover content={<ProfileCard aiEmployee={currentEmployee} />} placement="leftTop">
              <Avatar
                src={avatars(currentEmployee.avatar)}
                size={21}
                shape="circle"
                style={{
                  boxShadow: token.boxShadowSecondary,
                  margin: '2px 0',
                }}
              />
            </Popover>
            <span
              style={{
                fontSize: token.fontSize,
                margin: '0 4px',
              }}
            >
              {currentEmployee.nickname}
            </span>
            {currentEmployee.position ? (
              <span
                style={{
                  color: token.colorTextDescription,
                }}
              >
                {currentEmployee.position}
              </span>
            ) : null}
          </Tag>
        )}
      </div>
      {currentEmployee ? <ContextItemsHeader /> : null}
      {currentEmployee ? <AttachmentsHeader /> : null}
    </div>
  );
};
