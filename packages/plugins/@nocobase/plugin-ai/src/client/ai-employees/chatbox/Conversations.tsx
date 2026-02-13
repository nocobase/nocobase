/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Input, Empty, Spin, App } from 'antd';
import { Conversations as AntConversations } from '@ant-design/x';
import { SchemaComponent, useAPIClient, useActionContext } from '@nocobase/client';
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
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';

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
  const { aiEmployeesMap } = useAIEmployeesData();

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

  const items = useMemo(() => {
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
  }, [conversations, conversationsLoading]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!listRef.current || !conversations.length) return;
    const lastLi = listRef.current.querySelector('.ant-conversations-item:last-child');
    if (lastLi) {
      lastConversationRef(lastLi as HTMLElement);
    }
  }, [conversations, lastConversationRef]);

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

  const selectConversation = (sessionId: string) => {
    if (sessionId === currentConversation) {
      return;
    }
    setCurrentConversation(sessionId);
    const conversation = conversations.find((item) => item.sessionId === sessionId);
    setCurrentEmployee(aiEmployeesMap[conversation?.aiEmployee?.username]);
    setMessages([]);
    clear();
    setModel(null);
    messagesService.run(sessionId);
    if (!expanded) {
      setShowConversations(false);
    }
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
          onSearch={(val) => conversationsService.run(1, val)}
          onClear={() => conversationsService.run(1)}
          allowClear={true}
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
        {conversations && conversations.length ? (
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
            onActiveChange={selectConversation}
            items={items}
            menu={(conversation) => ({
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
            })}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
});
