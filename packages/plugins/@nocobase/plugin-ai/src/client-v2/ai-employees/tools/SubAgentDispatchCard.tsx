/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar, Flex, Spin, theme, Typography } from 'antd';
import { LoadingOutlined, RightOutlined, RobotOutlined, UpOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { avatars } from '../avatars';
import type { AIEmployee } from '../types';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';

type SubAgentDispatchArgs = {
  username?: string;
  question?: string;
};

type SubAgentDisplayInfo = {
  username: string;
  nickname: string;
  position?: string;
  avatar?: string;
};

export const SubAgentDispatchCard: React.FC<ToolsUIProperties<SubAgentDispatchArgs>> = observer(
  ({ messageId, toolCall }) => {
    const { token } = theme.useToken();
    const aiConfigRepository = useAIConfigRepository();
    const currentConversation = useChatConversationsStore.use.currentConversation();
    const chat = useChat(currentConversation);
    const responseLoading = chat.use.responseLoading();
    const messages = chat.use.messages();
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      aiConfigRepository.getAIEmployees().catch(console.error);
    }, [aiConfigRepository]);

    const latestMessage = messages[messages.length - 1];
    const generating = responseLoading && latestMessage?.content?.messageId === messageId;
    const username = typeof toolCall.args?.username === 'string' ? toolCall.args.username : '';
    const question = typeof toolCall.args?.question === 'string' ? toolCall.args.question : '';
    const employee = resolveSubAgentDisplayInfo(aiConfigRepository.aiEmployees, username);
    const avatarSrc = employee.avatar ? avatars(employee.avatar) : undefined;
    const canExpand = !!question;
    const toggleExpanded = () => {
      if (canExpand) {
        setExpanded((value) => !value);
      }
    };

    return (
      <div
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (!canExpand) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
          }
        }}
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        style={{
          margin: `${token.marginXS}px 0`,
          padding: `${token.paddingXXS}px ${token.paddingSM}px`,
          borderRadius: token.borderRadiusLG,
          background: token.colorFillTertiary,
          cursor: canExpand ? 'pointer' : 'default',
        }}
      >
        <Flex align="center" justify="space-between" gap={token.marginXS}>
          <Flex align="center" gap={token.marginXS} style={{ minWidth: 0, flex: 1 }}>
            <Avatar
              size={28}
              src={avatarSrc}
              icon={!avatarSrc ? <RobotOutlined /> : undefined}
              style={{
                flexShrink: 0,
                background: avatarSrc ? undefined : token.colorFillSecondary,
                color: token.colorTextSecondary,
              }}
            />
            <Flex vertical gap={0} style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text
                strong
                ellipsis
                style={{ color: token.colorText, fontSize: token.fontSizeSM + 1, minWidth: 0 }}
              >
                {`@${employee.nickname}`}
              </Typography.Text>
              {employee.position ? (
                <Typography.Text
                  type="secondary"
                  ellipsis
                  style={{ fontSize: token.fontSizeSM, minWidth: 0, lineHeight: 1.4 }}
                >
                  {employee.position}
                </Typography.Text>
              ) : null}
            </Flex>
          </Flex>
          <Flex align="center" gap={token.marginXXS}>
            {generating ? <Spin indicator={<LoadingOutlined spin />} size="small" /> : null}
            {canExpand ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: token.colorTextTertiary,
                }}
              >
                {expanded ? <UpOutlined /> : <RightOutlined />}
              </span>
            ) : null}
          </Flex>
        </Flex>
        {expanded && question ? (
          <div
            style={{
              marginTop: token.marginXS,
              paddingTop: token.paddingXS,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Typography.Text
              type="secondary"
              style={{
                display: 'block',
                fontSize: token.fontSizeSM,
                whiteSpace: 'pre-wrap',
              }}
            >
              {question}
            </Typography.Text>
          </div>
        ) : null}
      </div>
    );
  },
);

SubAgentDispatchCard.displayName = 'SubAgentDispatchCard';

const resolveSubAgentDisplayInfo = (
  aiEmployees: AIEmployee[] | undefined,
  username: string | undefined,
): SubAgentDisplayInfo => {
  const normalizedUsername = username || '';
  const employee = aiEmployees?.find((item) => item.username === normalizedUsername);

  return {
    username: normalizedUsername,
    nickname: employee?.nickname || normalizedUsername,
    position: employee?.position,
    avatar: employee?.avatar,
  };
};
