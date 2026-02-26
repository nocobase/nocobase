/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Dropdown, FloatButton } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { useMobileLayout, useToken } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { FlowRuntimeContext, observer, useFlowContext } from '@nocobase/flow-engine';
import { isHide } from '../built-in/utils';
import { useChatConversationsStore } from './stores/chat-conversations';

export const ChatButton: React.FC = observer(() => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const { isMobileLayout } = useMobileLayout();
  const isV1Page = ctx?.pageInfo?.version === 'v1';
  const { token } = useToken();

  const { aiEmployees } = useAIEmployeesData();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const { switchAIEmployee } = useChatBoxActions();

  const setWebSearch = useChatConversationsStore.use.setWebSearch();

  const items = useMemo(() => {
    return aiEmployees
      ?.filter((employee) => !isHide(employee))
      .map((employee) => ({
        key: employee.username,
        label: (
          <AIEmployeeListItem
            aiEmployee={employee}
            onClick={() => {
              setWebSearch(true);
              setOpen(true);
              switchAIEmployee(employee);
            }}
          />
        ),
      }));
  }, [aiEmployees]);

  if (open || !aiEmployees?.length || isV1Page) {
    return null;
  }

  const buttonShadow = token.boxShadowSecondary || token.boxShadow;

  return (
    !isMobileLayout && (
      <Dropdown
        menu={{ items }}
        placement="topRight"
        trigger={['hover']}
        align={{ offset: [-16, -6] }}
        open={dropdownOpen}
        onOpenChange={(nextOpen) => setDropdownOpen(nextOpen)}
      >
        <div
          onClick={() => {
            setDropdownOpen(false);
            setOpen(true);
          }}
          className={css`
            z-index: 1050;
            position: fixed;
            bottom: 42px;
            inset-inline-end: -8px;
            padding: 9px 22px 9px 10px;
            border-radius: 31px 0 0 31px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;

            opacity: 0.7;
            background: ${token.colorBgElevated};
            box-shadow: ${buttonShadow};
            transform: translateX(0);
            will-change: transform;
            transition:
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.2s ease;
            &:hover {
              opacity: 1;
              transform: translateX(-8px);
            }

            ${dropdownOpen
              ? `
              opacity: 1;
              transform: translateX(-8px);
            `
              : ''}
          `}
        >
          <Avatar src={icon} size={42} shape="square" />
        </div>
      </Dropdown>
    )
  );
});
