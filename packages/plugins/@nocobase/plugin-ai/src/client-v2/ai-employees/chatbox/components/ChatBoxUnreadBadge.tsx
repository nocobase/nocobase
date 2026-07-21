/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Badge, type BadgeProps } from 'antd';
import { observer } from '@nocobase/flow-engine';
import { useChatBoxRuntime } from '../stores/runtime';

export type ChatBoxUnreadBadgeProps = {
  children?: React.ReactNode;
  className?: string;
  offset?: BadgeProps['offset'];
  showCount?: boolean;
};

export const ChatBoxUnreadBadge: React.FC<ChatBoxUnreadBadgeProps> = observer(
  ({ children, className, offset, showCount = false }) => {
    const runtime = useChatBoxRuntime();
    const unreadCount =
      runtime.mode === 'block'
        ? runtime.chatConversationModel.conversations.filter((conversation) => !conversation.read).length
        : runtime.chatConversationModel.unreadCount + runtime.workflowTaskModel.unreadCount;

    return (
      <Badge
        className={className}
        count={showCount ? unreadCount : undefined}
        dot={showCount ? false : unreadCount > 0}
        offset={offset}
      >
        {children}
      </Badge>
    );
  },
);
