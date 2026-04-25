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
import { useField, useForm } from '@formily/react';
import { Field } from '@formily/core';
import { useToken } from '@nocobase/client';
import { observer, useFlowContext } from '@nocobase/flow-engine';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';
import { useT } from '../../../../locale';
import { AIEmployeeListItem } from '../../../../ai-employees/AIEmployeeListItem';
import { avatars } from '../../../../ai-employees/avatars';

export const AIEmployeeSelect: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const field = useField<Field>();
  const [isOpen, setIsOpen] = useState(false);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const { token } = useToken();
  const disabled = form.disabled || field.disabled || field.pattern === 'disabled' || field.pattern === 'readPretty';
  const ctx = useFlowContext();
  const currentEmployee = aiEmployees.find((employee) => employee.username === field.value);

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  useEffect(() => {
    ctx.model.props.aiEmployee.username = field.value;
  }, []);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

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
          onClick: () => {
            if (disabled) {
              return;
            }
            const defaultSkills = employee.skillSettings?.skills?.map((name: string) => name) ?? [];
            const defaultTools = employee.skillSettings?.tools?.map(({ name }: { name: string }) => name) ?? [];
            const shouldUpdateSkills = Array.isArray(form.values?.skillSettings?.skills);
            const shouldUpdateTools = Array.isArray(form.values?.skillSettings?.tools);
            ctx.model.props.aiEmployee.username = employee.username;
            field.setValue(employee.username);
            if (shouldUpdateSkills) {
              form.setValuesIn('skillSettings.skills', defaultSkills);
            }
            if (shouldUpdateTools) {
              form.setValuesIn('skillSettings.tools', defaultTools);
            }
            setIsOpen(false);
          },
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {currentEmployee?.avatar ? <Avatar shape="circle" size={20} src={avatars(currentEmployee.avatar)} /> : null}
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
      disabled={disabled}
      menu={{ items: menuItems, style: { maxHeight: 400, overflow: 'auto' } }}
      trigger={['hover']}
      open={disabled ? false : isOpen}
      onOpenChange={(open) => {
        if (!disabled) {
          setIsOpen(open);
        }
      }}
      overlayStyle={{ zIndex: 1200 }}
    >
      {dropdownContent}
    </Dropdown>
  );
});
