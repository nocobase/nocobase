/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { FloatButton, Avatar, Dropdown } from 'antd';
import icon from '../icon.svg';
import { css } from '@emotion/css';
import { useChatBoxContext } from './ChatBoxContext';
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { avatars } from '../avatars';
import { useT } from '../../locale';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatConversations } from './ChatConversationsProvider';
import { AIEmployee } from '../types';
import { uid } from '@formily/shared';

export const ChatButton: React.FC = () => {
  const t = useT();
  const { aiEmployees } = useAIEmployeesContext();
  const setOpen = useChatBoxContext('setOpen');
  const setCurrentEmployee = useChatBoxContext('setCurrentEmployee');
  const { setMessages, addMessage } = useChatMessages();
  const { currentConversation } = useChatConversations();
  const setSenderPlaceholder = useChatBoxContext('setSenderPlaceholder');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const senderRef = useChatBoxContext('senderRef');
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
      senderRef.current?.focus();
      if (!currentConversation) {
        setMessages([greetingMsg]);
      } else {
        addMessage(greetingMsg);
        setSenderValue('');
      }
    },
    [currentConversation],
  );
  const items = useMemo(() => {
    return aiEmployees?.map((employee) => ({
      key: employee.username,
      label: (
        <div
          className={css`
            display: flex;
            align-items: center;
            min-width: 150px;
          `}
          onClick={() => {
            setOpen(true);
            switchAIEmployee(employee);
          }}
        >
          <Avatar
            src={avatars(employee.avatar)}
            size={28}
            style={{
              marginRight: '8px',
            }}
          />
          {employee.nickname}
        </div>
      ),
    }));
  }, [aiEmployees]);
  return (
    <div
      className={css`
        .ant-float-btn {
          width: 40px;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content {
          padding: 0;
        }
        .ant-float-btn .ant-float-btn-body .ant-float-btn-content .ant-float-btn-icon {
          width: 40px;
        }
      `}
    >
      <Dropdown menu={{ items }} placement="topRight">
        <FloatButton
          icon={
            <Avatar
              src={icon}
              size={40}
              style={{
                marginBottom: '4px',
              }}
            />
          }
          // onClick={() => {
          //   setOpen(false);
          // }}
          shape="square"
        />
      </Dropdown>
    </div>
  );
};
