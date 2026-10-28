/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Avatar, Dropdown, Flex, Popover, Typography, theme, type MenuProps } from 'antd';
import { CheckOutlined, DownOutlined } from '@ant-design/icons';
import { AIEmployeeProfileCard } from './ProfileCard';
import { avatars } from './avatars';
import type { AIEmployee } from './types';
import { useT } from '../locale';

export type AIEmployeeDropdownProps = {
  aiEmployees: AIEmployee[];
  currentEmployee?: AIEmployee;
  disabled?: boolean;
  block?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (aiEmployee: AIEmployee) => void;
};

const AIEmployeeListItem: React.FC<{
  aiEmployee: AIEmployee;
}> = ({ aiEmployee }) => {
  const { token } = theme.useToken();

  return (
    <Popover content={<AIEmployeeProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
      <Flex align="center" style={{ padding: '4px 2px' }} gap={8}>
        <Avatar shape="circle" size={36} src={avatars(aiEmployee.avatar)} />
        <Flex vertical>
          <Typography.Text style={{ fontSize: token.fontSizeSM, lineHeight: 1.4 }}>
            {aiEmployee.nickname}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, lineHeight: 1.4 }}>
            {aiEmployee.position}
          </Typography.Text>
        </Flex>
      </Flex>
    </Popover>
  );
};

export const AIEmployeeDropdown: React.FC<AIEmployeeDropdownProps> = ({
  aiEmployees,
  currentEmployee,
  disabled,
  block = false,
  open: controlledOpen,
  onOpenChange,
  onSelect,
}) => {
  const t = useT();
  const { token } = theme.useToken();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const visibleEmployees = aiEmployees.filter(
    (employee) => employee.category === 'business' && employee.deprecated !== true,
  );
  const hasEmployees = visibleEmployees.length > 0;

  const menuItems: MenuProps['items'] = !hasEmployees
    ? [
        {
          key: 'empty',
          label: (
            <span style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
              {t('Please choose an AI employee')}
            </span>
          ),
          disabled: true,
          style: {
            cursor: 'default',
            padding: '16px 12px',
            height: 'auto',
            minHeight: 0,
          },
        },
      ]
    : visibleEmployees.map((employee) => {
        const selected = currentEmployee?.username === employee.username;
        return {
          key: employee.username,
          style: block ? { minHeight: 44 } : undefined,
          label: (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <AIEmployeeListItem aiEmployee={employee} />
              {selected ? <CheckOutlined style={{ fontSize: 12, color: token.colorPrimary }} /> : null}
            </span>
          ),
          onClick: () => {
            onSelect(employee);
            setOpen(false);
          },
        };
      });

  const currentLabel = currentEmployee ? currentEmployee.nickname : `${t('Select an')} ${t('AI employee')}`;

  return (
    <Dropdown
      disabled={disabled}
      menu={{
        items: menuItems,
        style: {
          maxHeight: 400,
          overflow: 'auto',
        },
      }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      overlayStyle={{ zIndex: 1200 }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={t('AI employee')}
        onClick={(event) => event.stopPropagation()}
        style={{
          border: 0,
          minWidth: 0,
          maxWidth: '100%',
          width: block ? '100%' : undefined,
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: block ? token.fontSize : 12,
          backgroundColor: token.colorFillTertiary,
          borderRadius: 6,
          height: block ? 44 : 28,
          padding: '0 8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
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
            maxWidth: block ? undefined : 160,
            flex: block ? 1 : undefined,
            textAlign: 'start',
          }}
        >
          {currentLabel}
        </span>
        <DownOutlined style={{ fontSize: 10, color: hasEmployees ? token.colorTextSecondary : token.colorError }} />
      </button>
    </Dropdown>
  );
};

export default AIEmployeeDropdown;
