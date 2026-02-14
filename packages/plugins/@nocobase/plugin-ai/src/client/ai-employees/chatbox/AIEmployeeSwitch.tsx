/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Button, Divider, Dropdown, Flex, Popover, Tag } from 'antd';
import { UserAddOutlined, CloseCircleOutlined, CheckOutlined, DownOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { avatars } from '../avatars';
import { ProfileCard } from '../ProfileCard';
import { AttachmentsHeader } from './AttachmentsHeader';
import { ContextItemsHeader } from './ContextItemsHeader';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { EditMessageHeader } from './EditMessageHeader';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';

export const AIEmployeeSwitcher: React.FC = () => {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const { aiEmployees } = useAIEmployeesData();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();
  const { token } = useToken();

  const menuItems = useMemo(() => {
    if (!aiEmployees.length) {
      return [
        {
          key: 'empty',
          label: (
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{t('Please choose an AI employee')}</span>
          ),
          disabled: true,
          style: { cursor: 'default', padding: '16px 12px', height: 'auto', minHeight: 0 },
        },
      ];
    }

    return aiEmployees.map((employee) => {
      const isSelected = currentEmployee?.username === employee.username;
      return {
        key: employee.username,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <AIEmployeeListItem aiEmployee={employee} />
            {isSelected && <CheckOutlined style={{ fontSize: 12, color: token.colorPrimary }} />}
          </span>
        ),
        onClick: () => switchAIEmployee(employee),
      };
    });
  }, [aiEmployees, currentEmployee?.username, switchAIEmployee, t, token.colorPrimary, token.colorTextSecondary]);

  const hasEmployees = aiEmployees.length > 0;
  const currentLabel = currentEmployee ? currentEmployee.nickname : `${t('Select an')} ${t('AI employee')}`;

  const dropdownContent = (
    <span
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        backgroundColor: token.colorFillTertiary,
        borderRadius: 6,
        height: 28,
        padding: '0 8px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {currentEmployee ? <Avatar shape="circle" size={20} src={avatars(currentEmployee.avatar)} /> : null}
      <span
        style={{
          color: hasEmployees ? token.colorText : token.colorError,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 160,
        }}
      >
        {currentLabel}
      </span>
      <DownOutlined style={{ fontSize: 10, color: hasEmployees ? token.colorTextSecondary : token.colorError }} />
    </span>
  );

  return (
    <Dropdown
      menu={{ items: menuItems, style: { maxHeight: 400, overflow: 'auto' } }}
      trigger={['hover']}
      open={isOpen}
      onOpenChange={setIsOpen}
      overlayStyle={{ zIndex: 1200 }}
    >
      {dropdownContent}
    </Dropdown>
  );
};

export const SenderHeader: React.FC = () => {
  const { aiEmployees } = useAIEmployeesData();
  const { token } = useToken();
  const t = useT();

  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();

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
  }, [aiEmployees, switchAIEmployee]);

  const avatar = useMemo(() => {
    if (!currentEmployee) {
      return null;
    }
    return avatars(currentEmployee.avatar);
  }, [currentEmployee]);

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
            <Dropdown menu={{ items }} placement="topLeft" overlayStyle={{ zIndex: 1200 }}>
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
                    margin: '4px 0',
                  }}
                  shape="circle"
                  size={35}
                  src={avatar}
                />
              </Popover>
              <Flex
                style={{
                  margin: '4px 12px',
                }}
                align="center"
              >
                <div>{currentEmployee.nickname}</div>
                <Divider type="vertical" />
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
