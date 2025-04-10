/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Layout, Input, Empty, Spin, App } from 'antd';
import { Conversations as AntConversations } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import { useAPIClient, useToken } from '@nocobase/client';
import { useChatBoxContext } from './ChatBoxContext';
import { useT } from '../../locale';
import { DeleteOutlined } from '@ant-design/icons';
const { Header, Content } = Layout;

export const Conversations: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const { modal, message } = App.useApp();
  const { token } = useToken();
  const conversationsService = useChatBoxContext('conversations');
  const currentConversation = useChatBoxContext('currentConversation');
  const setCurrentConversation = useChatBoxContext('setCurrentConversation');
  const setMessages = useChatBoxContext('setMessages');
  const startNewConversation = useChatBoxContext('startNewConversation');
  const { loading: ConversationsLoading, data: conversationsRes } = conversationsService;
  const conversations: ConversationsProps['items'] = (conversationsRes || []).map((conversation) => ({
    key: conversation.sessionId,
    label: conversation.title,
    timestamp: new Date(conversation.updatedAt).getTime(),
  }));

  const deleteConversation = async (sessionId: string) => {
    await api.resource('aiConversations').destroy({
      filterByTk: sessionId,
    });
    message.success(t('Deleted successfully'));
    conversationsService.refresh();
    startNewConversation();
  };

  const getMessages = async (sessionId: string) => {
    const res = await api.resource('aiConversations').getMessages({
      sessionId,
    });
    const messages = res?.data?.data;
    if (!messages) {
      return;
    }
    setMessages(messages.reverse());
  };

  return (
    <Layout>
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
      <Content>
        <Spin spinning={ConversationsLoading}>
          {conversations && conversations.length ? (
            <AntConversations
              activeKey={currentConversation}
              onActiveChange={(sessionId) => {
                if (sessionId === currentConversation) {
                  return;
                }
                setCurrentConversation(sessionId);
                getMessages(sessionId);
              }}
              items={conversations}
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
        </Spin>
      </Content>
    </Layout>
  );
};
