/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { List, Popover, Button, Avatar, Divider } from 'antd';
import { useToken } from '@nocobase/client';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { useT } from '../../locale';
import { useChatBoxContext } from './ChatBoxContext';
import { avatars } from '../avatars';
import { css } from '@emotion/css';
import { Sender } from '@ant-design/x';
import { ProfileCard } from '../ProfileCard';
import { AIEmployee } from '../types';
import { uid } from '@formily/shared';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatConversations } from './ChatConversationsProvider';

export const AIEmployeeHeader: React.FC = () => {
  const {
    service: { loading },
    aiEmployees,
  } = useAIEmployeesContext();
  const t = useT();
  const { setMessages, addMessage } = useChatMessages();
  const { currentConversation } = useChatConversations();
  const setCurrentEmployee = useChatBoxContext('setCurrentEmployee');
  const setSenderPlaceholder = useChatBoxContext('setSenderPlaceholder');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderRef = useChatBoxContext('senderRef');
  const infoForm = useChatBoxContext('infoForm');
  const switchAIEmployee = useCallback(
    (aiEmployee: AIEmployee) => {
      const greetingMsg = {
        key: uid(),
        role: aiEmployee.username,
        content: {
          type: 'greeting' as const,
          content: aiEmployee.greeting || t('Default greeting message', { nickname: aiEmployee.nickname }),
        },
      };
      setCurrentEmployee(aiEmployee);
      setSenderPlaceholder(aiEmployee.chatSettings?.senderPlaceholder);
      infoForm.reset();
      senderRef.current?.focus();
      if (!currentConversation) {
        setMessages([greetingMsg]);
      } else {
        addMessage(greetingMsg);
        setSenderValue('');
      }
    },
    [currentConversation, infoForm],
  );

  return (
    <Sender.Header closable={false}>
      <List
        locale={{
          emptyText: t('No AI employees available'),
        }}
        loading={loading}
        dataSource={aiEmployees || []}
        split={false}
        itemLayout="horizontal"
        renderItem={(aiEmployee) => {
          return (
            <Popover content={<ProfileCard aiEmployee={aiEmployee} />}>
              <Button
                className={css`
                  width: 36px;
                  height: 36px;
                  line-height: 36px;
                  padding: 0;
                  margin-right: 3px;
                `}
                shape="circle"
                onClick={() => switchAIEmployee(aiEmployee)}
              >
                <Avatar src={avatars(aiEmployee.avatar)} size={36} />
              </Button>
            </Popover>
          );
        }}
      />
    </Sender.Header>
  );
};
