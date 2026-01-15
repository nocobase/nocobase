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
import { useMobileLayout } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';
import { FlowRuntimeContext, observer, useFlowContext } from '@nocobase/flow-engine';
import { isHide } from '../built-in/utils';
import { useChatConversationOptions } from './hooks/useChatConversationOptions';

export const ChatButton: React.FC = observer(() => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const { isMobileLayout } = useMobileLayout();
  const isV2Page = ctx.pageInfo.version === 'v2';

  const { aiEmployees } = useAIEmployeesData();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();

  const { switchAIEmployee } = useChatBoxActions();

  const { resetDefaultWebSearch } = useChatConversationOptions();

  const items = useMemo(() => {
    return aiEmployees
      ?.filter((employee) => !isHide(employee))
      .map((employee) => ({
        key: employee.username,
        label: (
          <AIEmployeeListItem
            aiEmployee={employee}
            onClick={() => {
              resetDefaultWebSearch();
              setOpen(true);
              switchAIEmployee(employee);
            }}
          />
        ),
      }));
  }, [aiEmployees]);

  if (!aiEmployees?.length) {
    return null;
  }

  return (
    !isMobileLayout &&
    isV2Page && (
      <Dropdown
        menu={{ items }}
        placement="topRight"
        trigger={['hover']}
        align={{ offset: [-36, -12] }}
        open={dropdownOpen}
        onOpenChange={(nextOpen) => setDropdownOpen(nextOpen)}
      >
        <div
          className={css`
            z-index: 1050;
            position: fixed;
            bottom: 42px;
            inset-inline-end: 0px;
            height: 62px;
            padding: 10px 14px 10px 10px;
            border-radius: 31px 0 0 31px;
            display: flex;
            align-items: center;
            justify-content: center;

            opacity: 0.7;
            background: rgba(255, 255, 255);
            box-shadow:
              0 3px 6px -4px rgba(0, 0, 0, 0.12),
              0 6px 16px 0px rgba(0, 0, 0, 0.08),
              0 9px 28px 8px rgba(0, 0, 0, 0.05);
            transition: opacity 0.2s ease;
            &:hover {
              opacity: 1;
            }

            ${dropdownOpen
              ? `
            opacity: 1;
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
