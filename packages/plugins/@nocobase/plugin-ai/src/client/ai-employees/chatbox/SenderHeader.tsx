/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Button, Dropdown, Tag, Avatar, Popover, Flex } from 'antd';
import { useT } from '../../locale';
import { useToken } from '@nocobase/client';
import { UserAddOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { avatars } from '../avatars';
import { ProfileCard } from '../ProfileCard';
import { AttachmentsHeader } from './AttachmentsHeader';
import { ContextItemsHeader } from './ContextItemsHeader';
import { useChatBoxStore } from './stores/chat-box';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { EditMessageHeader } from './EditMessageHeader';
import { useAIEmployeesData } from '../useAIEmployeesData';

export const SenderHeader: React.FC = () => {
  const { aiEmployees } = useAIEmployeesData();
  const { token } = useToken();
  const t = useT();

  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();

  const responseLoading = useChatMessagesStore.use.responseLoading();

  const { switchAIEmployee } = useChatBoxActions();

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

  const avatar = useMemo(() => {
    if (!currentEmployee) {
      return null;
    }
    return !responseLoading
      ? avatars(currentEmployee.avatar)
      : avatars(currentEmployee.avatar, {
          brows: ['variant10'],
          gesture: ['pointLongArm'],
          gestureProbability: 100,
          translateX: -15,
        });
  }, [responseLoading, currentEmployee]);

  return (
    <div
      style={{
        padding: '8px 8px 0 8px',
      }}
    >
      <div>
        {isEditingMessage ? (
          <div style={{ marginBottom: 8 }}>
            <EditMessageHeader />
          </div>
        ) : null}
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
            closeIcon={
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '4px',
                }}
              >
                <CloseCircleOutlined />
              </div>
            }
            onClose={() => {
              switchAIEmployee(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: token.colorBgContainer,
            }}
          >
            <Flex align="center">
              <Popover content={<ProfileCard aiEmployee={currentEmployee} />} placement="leftTop">
                <Avatar
                  style={{
                    margin: '4px 8px 4px 0',
                  }}
                  shape="square"
                  size={48}
                  src={avatar}
                />
              </Popover>
              <Flex vertical={true}>
                <div>{currentEmployee.nickname}</div>
                <div
                  style={{
                    fontSize: token.fontSizeSM,
                    color: token.colorTextSecondary,
                  }}
                >
                  {currentEmployee.position}
                </div>
              </Flex>
            </Flex>
          </Tag>
        )}
      </div>
      {currentEmployee ? <ContextItemsHeader /> : null}
      {currentEmployee ? <AttachmentsHeader /> : null}
    </div>
  );
};
