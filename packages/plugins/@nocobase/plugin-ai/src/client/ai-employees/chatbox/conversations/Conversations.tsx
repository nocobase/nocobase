/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useCallback, useState } from 'react';
import { Badge, Input, Segmented } from 'antd';
import { css } from '@emotion/css';
import { useRequest } from '@nocobase/client';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { AIEmployee } from '../../types';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessagesStore } from '../stores/chat-messages';
import { ConversationsList, useConversationsList } from './ConversationsList';
import { WorkflowTasksList, useWorkflowTasksList } from './WorkflowTasksList';

type CurrentList = 'conversations' | 'workflowTasks';

const segmentedClassName = css`
  .ant-segmented-group {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  const keyword = useChatConversationsStore.use.keyword();
  const setKeyword = useChatConversationsStore.use.setKeyword();

  const setMessages = useChatMessagesStore.use.setMessages();

  const { messagesService } = useChatMessageActions();

  const { clear } = useChatBoxActions();
  const [currentList, setCurrentList] = useState<CurrentList>('conversations');

  const openConversation = useCallback(
    (sessionId: string, username?: string) => {
      if (sessionId === currentConversation) {
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
      setModel(null);
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
    onOpenConversation: (sessionId, username) => openConversation(sessionId, username),
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
            if (currentList === 'conversations') {
              conversationsController.runSearch(val);
            } else {
              workflowTasksController.runSearch(val);
            }
          }}
          onClear={() => {
            if (currentList === 'conversations') {
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
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <span>{t('Workflow tasks')}</span>
                  {workflowTasksController.unreadCount > 0 ? (
                    <Badge count={workflowTasksController.unreadCount} size="small" style={{ boxShadow: 'none' }} />
                  ) : null}
                </span>
              ),
              value: 'workflowTasks',
            },
          ]}
          value={currentList}
          onChange={(value) => {
            const nextList = value as CurrentList;
            setCurrentList(nextList);
            if (nextList === 'workflowTasks') {
              workflowTasksController.refresh();
            } else {
              conversationsController.refresh();
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
        {currentList === 'conversations' ? (
          <ConversationsList controller={conversationsController} />
        ) : (
          <WorkflowTasksList controller={workflowTasksController} />
        )}
      </div>
    </div>
  );
});
