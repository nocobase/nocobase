/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Badge, Input, Segmented, Space } from 'antd';
import { css } from '@emotion/css';
import { useRequest } from '@nocobase/client';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { AIEmployee } from '../../types';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChat } from '../hooks/useChat';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { ModelRef, useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { ConversationsList } from './ConversationsList';
import { WorkflowTasksList } from './WorkflowTasksList';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';

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
  const showConversations = useChatBoxStore.use.showConversations();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const setModel = useChatBoxStore.use.setModel();
  const expanded = useChatBoxStore.use.expanded();

  const currentConversation = useChatConversationsStore.use.currentConversation?.();
  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const conversationSegmented = useChatConversationsStore.use.conversationSegmented();
  const setConversationSegmented = useChatConversationsStore.use.setConversationSegmented();
  const keyword = useChatConversationsStore.use.keyword();
  const setKeyword = useChatConversationsStore.use.setKeyword();

  const {
    unreadCount: unreadConversationCount,
    loadUnreadCounts,
    runSearch: runSearchConversations,
    refresh: refreshConversations,
  } = useChatConversationActions();
  const {
    unreadCount: unreadWorkTaskCount,
    runSearch: runSearchWorkflowTasks,
    refresh: refreshWorkflowTasks,
  } = useWorkflowTasks();

  const { loadMessages, getConversationLLMActiveState, resumeStream } = useChatMessageActions();
  const chat = useChat(currentConversation);

  const { clear } = useChatBoxActions();
  const latestOpenVersionRef = useRef(0);
  const hasActiveStream = useCallback(
    (sessionId: string) => {
      const sessionState = chat.for(sessionId).getState();
      return sessionState.responseLoading || !!sessionState.abortController;
    },
    [chat],
  );
  const resumeAfterLoad = useCallback(
    async (sessionId: string, aiEmployee?: AIEmployee) => {
      const openVersion = latestOpenVersionRef.current + 1;
      latestOpenVersionRef.current = openVersion;

      await loadMessages(sessionId);
      if (
        !aiEmployee ||
        hasActiveStream(sessionId) ||
        latestOpenVersionRef.current !== openVersion ||
        useChatConversationsStore.getState().currentConversation !== sessionId
      ) {
        return;
      }

      const llmActiveState = await getConversationLLMActiveState(sessionId);
      if (
        hasActiveStream(sessionId) ||
        latestOpenVersionRef.current !== openVersion ||
        useChatConversationsStore.getState().currentConversation !== sessionId ||
        llmActiveState !== 'streaming'
      ) {
        return;
      }

      await resumeStream({
        sessionId,
        aiEmployee,
      });
    },
    [getConversationLLMActiveState, hasActiveStream, loadMessages, resumeStream],
  );

  const openConversation = useCallback(
    (sessionId: string, username?: string, model?: ModelRef) => {
      if (sessionId === currentConversation) {
        setShowConversations(false);
        return;
      }
      setCurrentConversation(sessionId);
      const aiEmployee = username ? aiEmployeesMap[username] : undefined;
      if (username) {
        setCurrentEmployee(aiEmployee);
      } else {
        setCurrentEmployee(undefined);
      }
      const sessionChat = chat.for(sessionId);
      const sessionState = sessionChat.getState();
      const shouldReuseLocalSession = hasActiveStream(sessionId) && sessionState.messages.length > 0;
      if (shouldReuseLocalSession) {
        clear(
          {
            systemMessage: false,
            attachments: false,
            contextItems: false,
            skillSettings: false,
          },
          sessionId,
        );
      } else {
        sessionChat.setMessages([]);
        clear(undefined, sessionId);
      }
      if (model) {
        setModel(model);
      } else {
        setModel(null);
      }
      if (!shouldReuseLocalSession) {
        resumeAfterLoad(sessionId, aiEmployee).catch(console.error);
      }
      if (!expanded) {
        setShowConversations(false);
      }
    },
    [
      currentConversation,
      setCurrentConversation,
      setCurrentEmployee,
      aiEmployeesMap,
      chat,
      clear,
      hasActiveStream,
      setModel,
      resumeAfterLoad,
      expanded,
      setShowConversations,
    ],
  );

  useEffect(() => {
    void loadUnreadCounts();
  }, [loadUnreadCounts]);

  useEffect(() => {
    if (showConversations) {
      if (conversationSegmented === 'conversations') {
        refreshConversations();
      } else {
        refreshWorkflowTasks();
      }
    }
  }, [showConversations, conversationSegmented, refreshConversations, refreshWorkflowTasks]);

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
              runSearchConversations(val);
            } else {
              runSearchWorkflowTasks(val);
            }
          }}
          onClear={() => {
            if (conversationSegmented === 'conversations') {
              runSearchConversations('');
            } else {
              runSearchWorkflowTasks('');
            }
          }}
          allowClear={true}
        />
        <Segmented
          style={{ width: '100%', marginTop: 8 }}
          className={segmentedClassName}
          options={[
            {
              label: (
                <Space>
                  {t('Conversations')}
                  <Badge count={unreadConversationCount} size="small" />
                </Space>
              ),
              value: 'conversations',
            },
            {
              label: (
                <Space>
                  {t('Workflow tasks')}
                  <Badge count={unreadWorkTaskCount} size="small" />
                </Space>
              ),
              value: 'workflowTasks',
            },
          ]}
          value={conversationSegmented}
          onChange={setConversationSegmented}
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
          <ConversationsList onOpenConversation={openConversation} />
        ) : (
          <WorkflowTasksList onOpenConversation={openConversation} />
        )}
      </div>
    </div>
  );
});
