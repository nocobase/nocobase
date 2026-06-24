/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Dropdown, Flex, Popover, Space, Typography, theme } from 'antd';
import { CheckOutlined, DownOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { AIEmployeeProfileCard } from '../../../../ai-employees/ProfileCard';
import { avatars } from '../../../../ai-employees/avatars';
import type { AIEmployee } from '../../../../ai-employees/types';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';
import { useT } from '../../../../locale';

type AIEmployeeSelectProps = {
  value?: string;
  onChange?: (value?: string) => void;
};

function AIEmployeeListItem({ aiEmployee }: { aiEmployee: AIEmployee }) {
  const { token } = theme.useToken();

  return (
    <Popover content={<AIEmployeeProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
      <Flex align="center" gap={token.marginXS} style={{ paddingBlock: token.paddingXXS }}>
        <Avatar
          shape="circle"
          size={token.controlHeightLG}
          src={aiEmployee.avatar ? avatars(aiEmployee.avatar) : undefined}
        />
        <Flex vertical>
          <Typography.Text>{aiEmployee.nickname}</Typography.Text>
          <Typography.Text type="secondary">{aiEmployee.position}</Typography.Text>
        </Flex>
      </Flex>
    </Popover>
  );
}

export const AIEmployeeSelect: React.FC<AIEmployeeSelectProps> = observer(({ value, onChange }) => {
  const t = useT();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const currentEmployee = useMemo(
    () => aiEmployees.find((employee) => employee.username === value),
    [aiEmployees, value],
  );

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const menuItems = aiEmployees.length
    ? aiEmployees.map((employee) => {
        const selected = employee.username === value;
        return {
          key: employee.username,
          label: (
            <Flex align="center" justify="space-between" gap={token.marginXS}>
              <AIEmployeeListItem aiEmployee={employee} />
              {selected ? <CheckOutlined style={{ color: token.colorPrimary }} /> : null}
            </Flex>
          ),
          onClick: () => {
            onChange?.(employee.username);
            setOpen(false);
          },
        };
      })
    : [
        {
          key: 'empty',
          disabled: true,
          label: <Typography.Text type="secondary">{t('Please choose an AI employee')}</Typography.Text>,
        },
      ];

  const label = currentEmployee?.nickname ?? `${t('Select an')} ${t('AI employee')}`;

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['hover']}
      open={open}
      onOpenChange={setOpen}
      disabled={!aiEmployees.length}
    >
      <Button
        icon={
          currentEmployee?.avatar ? (
            <Avatar shape="circle" size={token.controlHeightSM} src={avatars(currentEmployee.avatar)} />
          ) : undefined
        }
      >
        <Space size={token.marginXXS}>
          <span>{label}</span>
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
});

export default AIEmployeeSelect;
