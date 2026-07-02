/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Badge, theme } from 'antd';
import { observer, useFlowContext, type FlowRuntimeContext } from '@nocobase/flow-engine';
import { useLocation } from 'react-router-dom';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChat } from '../hooks/useChat';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { useChatBoxStore } from '../stores/chat-box';

const icon = new URL('../../icon.svg', import.meta.url).toString();

export const ChatButton: React.FC = observer(() => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const t = useT();
  const { pathname } = useLocation();
  const isV1Page = ctx?.pageInfo?.version === 'v1';
  const { token } = theme.useToken();
  const { unreadCount: unreadConversationCount } = useChatConversationActions();
  const { unreadCount: unreadWorkflowTaskCount } = useWorkflowTasks();
  const unreadCount = unreadConversationCount + unreadWorkflowTaskCount;
  const repository = useAIConfigRepository();
  const aiEmployees = repository.aiEmployees;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const open = useChatBoxStore.use.open();
  const chat = useChat();
  const setOpen = useChatBoxStore.use.setOpen();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const [badgeAnimating, setBadgeAnimating] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const badgeAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { switchAIEmployee } = useChatBoxActions();

  useEffect(() => {
    repository.getAIEmployees().catch(console.error);
  }, [repository]);

  useEffect(() => {
    if (badgeAnimationTimerRef.current) {
      clearTimeout(badgeAnimationTimerRef.current);
      badgeAnimationTimerRef.current = null;
    }

    if (unreadCount === 0) {
      setBadgeAnimating(false);
    } else if (unreadCount > prevUnreadCountRef.current) {
      setBadgeAnimating(false);
      badgeAnimationTimerRef.current = setTimeout(() => {
        setBadgeAnimating(true);
        badgeAnimationTimerRef.current = null;
      }, 800);
    }

    prevUnreadCountRef.current = unreadCount;
    return () => {
      if (badgeAnimationTimerRef.current) {
        clearTimeout(badgeAnimationTimerRef.current);
        badgeAnimationTimerRef.current = null;
      }
    };
  }, [unreadCount]);

  if (open || !aiEmployees?.length || isV1Page || !pathname.startsWith('/admin')) {
    return null;
  }

  const buttonActive = dropdownOpen || badgeAnimating;
  const openChatBox = () => {
    if (badgeAnimationTimerRef.current) {
      clearTimeout(badgeAnimationTimerRef.current);
      badgeAnimationTimerRef.current = null;
    }
    setBadgeAnimating(false);
    setDropdownOpen(false);
    setReadonly(false);
    chat.setResponseLoading(false);
    setOpen(true);
    const leaderEmployee = aiEmployees.find((employee) => employee.builtIn && employee.username === 'atlas');
    if (leaderEmployee) {
      switchAIEmployee(leaderEmployee);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('Open AI chat')}
      onMouseEnter={() => setDropdownOpen(true)}
      onMouseLeave={() => setDropdownOpen(false)}
      onFocus={() => setDropdownOpen(true)}
      onBlur={() => setDropdownOpen(false)}
      onClick={openChatBox}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openChatBox();
        }
      }}
      style={{
        zIndex: 1050,
        position: 'fixed',
        bottom: 42,
        insetInlineEnd: -8,
        padding: '9px 22px 9px 10px',
        borderRadius: '31px 0 0 31px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: buttonActive ? 1 : 0.7,
        background: token.colorBgElevated,
        boxShadow: token.boxShadowSecondary || token.boxShadow,
        transform: buttonActive ? 'translateX(-8px)' : 'translateX(0)',
        willChange: 'transform',
        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
      }}
    >
      <style>
        {`
@keyframes ai-chat-button-badge-shake {
  0%, 100% {
    transform: translate(50%, -50%) translate3d(0, 0, 0) rotate(0deg);
  }
  10%, 30%, 50% {
    transform: translate(50%, -50%) translate3d(-1px, 0, 0) rotate(-8deg);
  }
  20%, 40%, 60% {
    transform: translate(50%, -50%) translate3d(1px, 0, 0) rotate(8deg);
  }
  70% {
    transform: translate(50%, -50%) translate3d(-1px, 0, 0) rotate(-4deg);
  }
  80% {
    transform: translate(50%, -50%) translate3d(1px, 0, 0) rotate(4deg);
  }
  90% {
    transform: translate(50%, -50%) translate3d(0, 0, 0) rotate(0deg);
  }
}
.ai-chat-button-badge .ant-badge-count,
.ai-chat-button-badge .ant-badge-dot {
  transform-origin: center;
}
.ai-chat-button-badge-animating .ant-badge-count {
  animation: ai-chat-button-badge-shake 1.6s ease-in-out infinite;
}
`}
      </style>
      <Badge
        count={unreadCount}
        offset={[-5, 5]}
        className={`ai-chat-button-badge${badgeAnimating ? ' ai-chat-button-badge-animating' : ''}`}
      >
        <Avatar src={icon} size={42} shape="square" />
      </Badge>
    </div>
  );
});
