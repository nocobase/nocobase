/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar, Dropdown } from 'antd';
import { CheckOutlined, DownOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../locale';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { avatars } from '../avatars';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';

export const AIEmployeeSwitcher: React.FC = observer(() => {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();
  const { token } = useToken();

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const menuItems = !aiEmployees.length
    ? [
        {
          key: 'empty',
          label: (
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{t('Please choose an AI employee')}</span>
          ),
          disabled: true,
          style: { cursor: 'default', padding: '16px 12px', height: 'auto', minHeight: 0 },
        },
      ]
    : aiEmployees.map((employee) => {
        const isSelected = currentEmployee?.username === employee.username;
        return {
          key: employee.username,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <AIEmployeeListItem aiEmployee={employee} />
              {isSelected && <CheckOutlined style={{ fontSize: 12, color: token.colorPrimary }} />}
            </span>
          ),
          onClick: () =>
            switchAIEmployee(employee, {
              clear: {
                sender: false,
                attachments: false,
                contextItems: false,
              },
            }),
        };
      });

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
});
