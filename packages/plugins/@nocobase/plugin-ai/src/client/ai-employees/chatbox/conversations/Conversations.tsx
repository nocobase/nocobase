/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useCallback } from 'react';
import { Badge, Input, Segmented, Space } from 'antd';
import { css } from '@emotion/css';
import { useRequest } from '@nocobase/client';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { AIEmployee } from '../../types';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { ModelRef, useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessagesStore } from '../stores/chat-messages';
import { ConversationsList, useConversationsList } from './ConversationsList';
import { WorkflowTasksList, useWorkflowTasksList } from './WorkflowTasksList';

const segmentedClassName = css`
  .ant-segmented-item,
  .ant-segmented-item-selected {
    width: 100%;
    justify-content: center;
  }
`;

export const Conversations: React.FC = memo(() => {
  const t = useT();
  const aiConfigRepository = useAIConfigRepository();
  useRequest<AIEmployee[]>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const aiEmployeesMap = aiConfigRepository.getAIEmployeesMap();

  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const setModel = useChatBoxStore.use.setModel();
  const expanded = useChatBoxStore.use.expanded();

  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const conversationSegmented = useChatConversationsStore.use.conversationSegmented();
  const setConversationSegmented = useChatConversationsStore.use.setConversationSegmented();
  const keyword = useChatConversationsStore.use.keyword();
  const setKeyword = useChatConversationsStore.use.setKeyword();

  const setMessages = useChatMessagesStore.use.setMessages();

  const { messagesService } = useChatMessageActions();

  const { clear } = useChatBoxActions();

  const openConversation = useCallback(
    (sessionId: string, username?: string, model?: ModelRef) => {
      if (sessionId === currentConversation) {
        setShowConversations(false);
        return;
      }
      setCurrentConversation(sessionId);
      if (username) {
        setCurrentEmployee(aiEmployeesMap[username]);
      } else {
        setCurrentEmployee(undefined);
      }
      setMessages([]);
      clear();
      if (model) {
        setModel(model);
      } else {
        setModel(null);
      }
      messagesService.run(sessionId);
      if (!expanded) {
        setShowConversations(false);
      }
    },
    [
      currentConversation,
      setCurrentConversation,
      setCurrentEmployee,
      aiEmployeesMap,
      setMessages,
      clear,
      setModel,
      messagesService,
      expanded,
      setShowConversations,
    ],
  );

  const conversationsController = useConversationsList({
    onOpenConversation: openConversation,
  });

  const workflowTasksController = useWorkflowTasksList({
    onOpenConversation: openConversation,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          flexShrink: 0,
        }}
      >
        <Input.Search
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          placeholder={t('Search')}
          onSearch={(val) => {
            if (conversationSegmented === 'conversations') {
              conversationsController.runSearch(val);
            } else {
              workflowTasksController.runSearch(val);
            }
          }}
          onClear={() => {
            if (conversationSegmented === 'conversations') {
              conversationsController.runSearch('');
            } else {
              workflowTasksController.runSearch('');
            }
          }}
          allowClear={true}
        />
        <Segmented
          style={{ width: '100%', marginTop: 8 }}
          className={segmentedClassName}
          options={[
            { label: t('Conversations'), value: 'conversations' },
            {
              label: (
                <Space>
                  {t('Workflow tasks')}
                  <Badge count={workflowTasksController.unreadCount} size="small" />
                </Space>
              ),
              value: 'workflowTasks',
            },
          ]}
          value={conversationSegmented}
          onChange={(value) => {
            setConversationSegmented(value);
            if (value === 'conversations') {
              conversationsController.refresh();
            } else {
              workflowTasksController.refresh();
            }
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {conversationSegmented === 'conversations' ? (
          <ConversationsList controller={conversationsController} />
        ) : (
          <WorkflowTasksList controller={workflowTasksController} />
        )}
      </div>
    </div>
  );
});
