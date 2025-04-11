/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useMemo } from 'react';
import { Layout, Input, Empty, Spin, App } from 'antd';
import { Conversations as AntConversations } from '@ant-design/x';
import { useAPIClient, useToken } from '@nocobase/client';
import { useChatBoxContext } from './ChatBoxContext';
import { useT } from '../../locale';
import { DeleteOutlined } from '@ant-design/icons';
import { useChatConversations } from './ChatConversationsProvider';
import { useChatMessages } from './ChatMessagesProvider';
const { Header, Content } = Layout;
import { ConversationsProps } from '@ant-design/x';

export const Conversations: React.FC = memo(() => {
  const t = useT();
  const api = useAPIClient();
  const { modal, message } = App.useApp();
  const { token } = useToken();
  const { currentConversation, setCurrentConversation, conversationsService, conversations, lastConversationRef } =
    useChatConversations();
  const { messagesService } = useChatMessages();
  const startNewConversation = useChatBoxContext('startNewConversation');
  const setCurrentEmployee = useChatBoxContext('setCurrentEmployee');
  const setSenderValue = useChatBoxContext('setSenderValue');
  const setSenderPlaceholder = useChatBoxContext('setSenderPlaceholder');
  const { loading: conversationsLoading } = conversationsService;

  const items = useMemo(() => {
    const result: ConversationsProps['items'] = conversations.map((item, index) => ({
      key: item.sessionId,
      timestamp: new Date(item.updatedAt).getTime(),
      label: index === conversations.length - 1 ? <div ref={lastConversationRef}>{item.title}</div> : item.title,
    }));
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
  }, [conversations, conversationsLoading, lastConversationRef]);

  const deleteConversation = async (sessionId: string) => {
    await api.resource('aiConversations').destroy({
      filterByTk: sessionId,
    });
    message.success(t('Deleted successfully'));
    conversationsService.refresh();
    startNewConversation();
  };

  const selectConversation = (sessionId: string) => {
    if (sessionId === currentConversation) {
      return;
    }
    setCurrentConversation(sessionId);
    const conversation = conversations.find((item) => item.sessionId === sessionId);
    setCurrentEmployee(conversation?.aiEmployee);
    setSenderValue('');
    setSenderPlaceholder(conversation?.aiEmployee?.chatSettings?.senderPlaceholder);
    messagesService.run(sessionId);
  };

  return (
    <Layout
      style={{
        height: '100%',
      }}
    >
      <Header
        style={{
          backgroundColor: token.colorBgContainer,
          height: '48px',
          lineHeight: '48px',
          padding: '0 5px',
        }}
      >
        <Input.Search style={{ verticalAlign: 'middle' }} />
      </Header>
      <Content
        style={{
          height: '100%',
          overflow: 'auto',
        }}
      >
        {conversations && conversations.length ? (
          <AntConversations
            activeKey={currentConversation}
            onActiveChange={selectConversation}
            items={items}
            menu={(conversation) => ({
              items: [
                {
                  label: 'Delete',
                  key: 'delete',
                  icon: <DeleteOutlined />,
                },
              ],
              onClick: ({ key }) => {
                switch (key) {
                  case 'delete':
                    modal.confirm({
                      title: t('Delete this conversation?'),
                      content: t('Are you sure to delete this conversation?'),
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
      </Content>
    </Layout>
  );
});
