/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar, Badge } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { useMobileLayout, useToken } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { FlowRuntimeContext, observer, useFlowContext } from '@nocobase/flow-engine';
import { isLeader } from '../built-in/utils';
import { useLocation } from 'react-router-dom';
import { useWorkflowTasks } from './hooks/useWorkflowTasks';
import { useChatMessagesStore } from './stores/chat-messages';

export const ChatButton: React.FC = observer(() => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const { pathname } = useLocation();
  const { isMobileLayout } = useMobileLayout();
  const isV1Page = ctx?.pageInfo?.version === 'v1';
  const { token } = useToken();
  const { unreadCount } = useWorkflowTasks();

  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  React.useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const open = useChatBoxStore.use.open();
  const setOpen = useChatBoxStore.use.setOpen();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setResponseLoading = useChatMessagesStore.use.setResponseLoading();

  const { switchAIEmployee } = useChatBoxActions();

  if (open || !aiEmployees?.length || isV1Page || !pathname.startsWith('/admin')) {
    return null;
  }

  const buttonShadow = token.boxShadowSecondary || token.boxShadow;

  return (
    !isMobileLayout && (
      <div
        onClick={() => {
          setDropdownOpen(false);
          setReadonly(false);
          setResponseLoading(false);
          setOpen(true);
          const leaderEmployee = aiEmployees.find(isLeader);
          if (leaderEmployee) {
            switchAIEmployee(leaderEmployee);
          }
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
        <Badge count={unreadCount} offset={[-5, 5]}>
          <Avatar src={icon} size={42} shape="square" />
        </Badge>
      </div>
    )
  );
});
