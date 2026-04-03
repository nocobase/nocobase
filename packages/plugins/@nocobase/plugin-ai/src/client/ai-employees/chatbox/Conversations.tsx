/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Input, Empty, Spin, App, Segmented } from 'antd';
import { Conversations as AntConversations } from '@ant-design/x';
import { SchemaComponent, useAPIClient, useActionContext, useRequest } from '@nocobase/client';
import { css } from '@emotion/css';
import { useT } from '../../locale';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { ConversationsProps } from '@ant-design/x';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useChatConversationActions } from './hooks/useChatConversationActions';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useChatBoxStore } from './stores/chat-box';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { AIEmployee } from '../types';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    onClick: () => {
      setVisible(false);
      form.reset();
    },
  };
};

const useSubmitActionProps = (conversationKey: string) => {
  const { setVisible } = useActionContext();
  const api = useAPIClient();
  const form = useForm();
  const { conversationsService } = useChatConversationActions();
  return {
    onClick: async () => {
      await form.submit();
      await api.resource('aiConversations').update({
        filterByTk: conversationKey,
        values: {
          title: form.values.title,
        },
      });
      setVisible(false);
      form.reset();
      conversationsService.run();
    },
  };
};

const Rename: React.FC<{
  conversation: {
    key: string;
    title?: string;
  };
}> = ({ conversation }) => {
  const t = useT();
  return (
    <SchemaComponent
      scope={{ useCloseActionProps, useSubmitActionProps: () => useSubmitActionProps(conversation.key) }}
      schema={{
        name: 'rename',
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: (props) => <div {...props}>{t('Rename')}</div>,
        },
        title: t('Rename'),
        properties: {
          [uid()]: {
            type: 'void',
            'x-component': 'Action.Modal',
            'x-component-props': {
              styles: {
                mask: {
                  zIndex: 1100,
                },
                wrapper: {
                  zIndex: 1100,
                },
              },
            },
            title: t('Rename conversation'),
            'x-decorator': 'FormV2',
            properties: {
              title: {
                type: 'string',
                title: t('Title'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                default: conversation.title || '',
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Modal.Footer',
                properties: {
                  close: {
                    title: t('Cancel'),
                    'x-component': 'Action',
                    'x-use-component-props': 'useCloseActionProps',
                  },
                  submit: {
                    title: t('Submit'),
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                    },
                    'x-use-component-props': 'useSubmitActionProps',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

export const Conversations: React.FC = memo(() => {
  const t = useT();
  const api = useAPIClient();
  const { modal, message } = App.useApp();
  const aiConfigRepository = useAIConfigRepository();
  useRequest<AIEmployee[]>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const aiEmployeesMap = aiConfigRepository.getAIEmployeesMap();

  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const setModel = useChatBoxStore.use.setModel();
  const expanded = useChatBoxStore.use.expanded();

  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const conversations = useChatConversationsStore.use.conversations();
  const keyword = useChatConversationsStore.use.keyword();
  const setKeyword = useChatConversationsStore.use.setKeyword();

  const setMessages = useChatMessagesStore.use.setMessages();

  const { messagesService } = useChatMessageActions();

  const { conversationsService, lastConversationRef } = useChatConversationActions();
  const { loading: conversationsLoading } = conversationsService;

  const { startNewConversation, clear } = useChatBoxActions();
  const [currentList, setCurrentList] = useState<'conversations' | 'workflowTasks'>('conversations');

  type WorkflowTask = {
    id: string;
    sessionId: string;
    workflowTitle: string;
    nodeTitle: string;
    status: string;
    read?: boolean;
    updatedAt?: string;
  };

  const workflowTasksService = useRequest<{ data: WorkflowTask[] }>(
    (search = '') => {
      const filter: any = {};
      if (search) {
        filter.$or = [
          { workflowTitle: { $includes: search } },
          { nodeTitle: { $includes: search } },
          { status: { $includes: search } },
        ];
      }

      return api
        .resource('aiWorkflowTasks')
        .list({
          sort: ['-updatedAt'],
          pageSize: 50,
          filter,
        })
        .then((res) => res?.data);
    },
    {
      manual: false,
    },
  );

  const conversationItems = useMemo(() => {
    const result: ConversationsProps['items'] = conversations.map((item) => {
      const title = item.title || t('New conversation');
      return {
        key: item.sessionId,
        title,
        timestamp: new Date(item.updatedAt).getTime(),
        label: title,
      };
    });
    if (conversationsLoading) {
      result.push({
        key: 'loading',
        label: (
          <Spin
            style={{
              display: 'block',
              margin: '8px auto',
            }}
          />
        ),
      });
    }
    return result;
  }, [conversations, conversationsLoading, t]);

  const workflowTaskItems = useMemo(() => {
    const tasks = workflowTasksService.data?.data || [];
    const result: ConversationsProps['items'] = tasks.map((item) => ({
      key: item.sessionId,
      timestamp: item.updatedAt ? new Date(item.updatedAt).getTime() : undefined,
      label: (
        <div style={{ maxWidth: '100%' }}>
          <div
            style={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.workflowTitle}
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 12,
              color: 'rgba(0, 0, 0, 0.45)',
            }}
          >
            {item.nodeTitle} · {item.status} · {item.read ? t('Read') : t('Unread')}
          </div>
        </div>
      ),
    }));

    if (workflowTasksService.loading) {
      result.push({
        key: 'workflow-task-loading',
        label: (
          <Spin
            style={{
              display: 'block',
              margin: '8px auto',
            }}
          />
        ),
      });
    }

    return result;
  }, [workflowTasksService.data?.data, workflowTasksService.loading, t]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!listRef.current || !conversations.length || currentList !== 'conversations') return;
    const lastLi = listRef.current.querySelector('.ant-conversations-item:last-child');
    if (lastLi) {
      lastConversationRef(lastLi as HTMLElement);
    }
  }, [conversations, currentList, lastConversationRef]);

  const deleteConversation = async (sessionId: string) => {
    await api.resource('aiConversations').destroy({
      filterByTk: sessionId,
    });
    message.success(t('Deleted successfully'));
    conversationsService.run();
    if (currentEmployee) {
      startNewConversation();
    }
  };

  const openConversation = (sessionId: string, username?: string) => {
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
  };

  const selectConversation = (sessionId: string) => {
    const conversation = conversations.find((item) => item.sessionId === sessionId);
    openConversation(sessionId, conversation?.aiEmployee?.username);
  };

  const selectWorkflowTask = (sessionId: string) => {
    openConversation(sessionId);
  };

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
              conversationsService.run(1, val);
            } else {
              workflowTasksService.run(val);
            }
          }}
          onClear={() => {
            if (currentList === 'conversations') {
              conversationsService.run(1);
            } else {
              workflowTasksService.run('');
            }
          }}
          allowClear={true}
        />
        <Segmented
          style={{ width: '100%', marginTop: 8 }}
          options={[
            { label: t('Conversations'), value: 'conversations' },
            { label: t('Workflow tasks'), value: 'workflowTasks' },
          ]}
          value={currentList}
          onChange={(value) => {
            const nextList = value as 'conversations' | 'workflowTasks';
            setCurrentList(nextList);
            if (nextList === 'workflowTasks') {
              workflowTasksService.run(keyword || '');
            }
          }}
        />
      </div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {(currentList === 'conversations' && conversationItems.length) ||
        (currentList === 'workflowTasks' && workflowTaskItems.length) ? (
          <AntConversations
            className={css`
              .ant-conversations-item {
                .ant-conversations-label {
                  display: block !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  white-space: nowrap !important;
                  max-width: calc(100% - 30px);
                }
              }
            `}
            activeKey={currentConversation}
            onActiveChange={currentList === 'conversations' ? selectConversation : selectWorkflowTask}
            items={currentList === 'conversations' ? conversationItems : workflowTaskItems}
            menu={
              currentList === 'conversations'
                ? (conversation) => ({
                    items: [
                      {
                        // @ts-ignore
                        label: <Rename conversation={conversation} />,
                        key: 'rename',
                        icon: <EditOutlined />,
                      },
                      {
                        label: t('Delete'),
                        key: 'delete',
                        icon: <DeleteOutlined />,
                      },
                    ],
                    onClick: ({ key, domEvent }) => {
                      domEvent.stopPropagation();
                      switch (key) {
                        case 'delete':
                          modal.confirm({
                            title: t('Delete conversation'),
                            content: t('Are you sure you want to delete it?'),
                            onOk: () => deleteConversation(conversation.key),
                          });
                          break;
                      }
                    },
                  })
                : undefined
            }
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
});
