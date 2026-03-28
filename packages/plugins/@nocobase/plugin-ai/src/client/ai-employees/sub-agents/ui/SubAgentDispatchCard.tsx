/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar, Flex, Spin, Typography } from 'antd';
import { LoadingOutlined, RightOutlined, RobotOutlined, UpOutlined } from '@ant-design/icons';
import { ToolsUIProperties, useToken } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { avatars } from '../../avatars';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { AIEmployee } from '../../types';

export const SubAgentDispatchCard: React.FC<
  ToolsUIProperties<{
    username?: string;
    question?: string;
  }>
> = observer(({ messageId, toolCall }) => {
  const t = useT();
  const { token } = useToken();
  const aiConfigRepository = useAIConfigRepository();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  const messages = useChatMessagesStore.use.messages();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const lastMessage = messages[messages.length - 1];
  const generating = responseLoading && lastMessage?.content?.messageId === messageId;
  const username = typeof toolCall.args?.username === 'string' ? toolCall.args.username : '';
  const question = typeof toolCall.args?.question === 'string' ? toolCall.args.question : '';
  const employee = resolveSubAgentDisplayInfo(aiConfigRepository.aiEmployees, username);
  const showLoading = generating;
  const avatarSrc = employee.avatar ? avatars(employee.avatar) : undefined;
  const canExpand = !!question;
  const toggleExpanded = () => {
    if (!canExpand) {
      return;
    }
    setExpanded((value) => !value);
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
        margin: '8px 0',
        padding: '6px 10px',
        borderRadius: token.borderRadiusLG,
        background: token.colorFillTertiary,
        cursor: canExpand ? 'pointer' : 'default',
      }}
    >
      <Flex align="center" justify="space-between" gap={8}>
        <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
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
        <Flex align="center" gap={4}>
          {showLoading ? <Spin indicator={<LoadingOutlined spin />} size="small" /> : null}
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
            marginTop: 8,
            paddingTop: 8,
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
});

export type SubAgentDisplayInfo = {
  username: string;
  nickname: string;
  position?: string;
  avatar?: string;
  matched: boolean;
};

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
    matched: !!employee,
  };
};
