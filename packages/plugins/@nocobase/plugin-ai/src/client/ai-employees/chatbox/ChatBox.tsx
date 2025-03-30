/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useState } from 'react';
import { Layout, Card, Divider, Button, Avatar, List, Input, Popover, Empty, Spin, Modal, Tag } from 'antd';
import { Conversations, Sender, Attachments, Bubble } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import {
  CloseOutlined,
  ExpandOutlined,
  EditOutlined,
  LayoutOutlined,
  DeleteOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useAPIClient, useRequest, useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { ChatBoxContext } from './ChatBoxProvider';
const { Header, Footer, Sider, Content } = Layout;
import { avatars } from '../avatars';
import { AIEmployee, AIEmployeesContext, useAIEmployeesContext } from '../AIEmployeesProvider';
import { css } from '@emotion/css';
import { ReactComponent as EmptyIcon } from '../empty-icon.svg';
import { Attachment } from './Attachment';

export const ChatBox: React.FC = () => {
  const api = useAPIClient();
  const {
    send,
    setOpen,
    filterEmployee,
    setFilterEmployee,
    conversations: conversationsService,
    currentConversation,
    setCurrentConversation,
    messages,
    setMessages,
    roles,
    attachments,
    setAttachments,
    responseLoading,
    senderRef,
  } = useContext(ChatBoxContext);
  const { loading: ConversationsLoading, data: conversationsRes } = conversationsService;
  const {
    aiEmployees,
    service: { loading },
  } = useAIEmployeesContext();
  const t = useT();
  const { token } = useToken();
  const [showConversations, setShowConversations] = useState(true);
  const aiEmployeesList = [{ username: 'all' } as AIEmployee, ...(aiEmployees || [])];
  const conversations: ConversationsProps['items'] = (conversationsRes || []).map((conversation) => ({
    key: conversation.sessionId,
    label: conversation.title,
    timestamp: new Date(conversation.updatedAt).getTime(),
  }));

  const deleteConversation = async (sessionId: string) => {
    await api.resource('aiConversations').destroy({
      filterByTk: sessionId,
    });
    conversationsService.refresh();
    setCurrentConversation(undefined);
    setMessages([]);
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
    <div
      style={{
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        width: '90%',
        maxWidth: '760px',
        height: '90%',
        maxHeight: '560px',
        zIndex: 1000,
      }}
    >
      <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', paddingTop: 0 }}>
        <Layout style={{ height: '100%' }}>
          <Sider
            width="42px"
            style={{
              backgroundColor: token.colorBgContainer,
              marginRight: '5px',
            }}
          >
            <List
              loading={loading}
              dataSource={aiEmployeesList}
              split={false}
              itemLayout="horizontal"
              renderItem={(aiEmployee) => {
                const highlight =
                  aiEmployee.username === filterEmployee
                    ? `color: ${token.colorPrimary};
                        border-color: ${token.colorPrimary};`
                    : '';
                return aiEmployee.username === 'all' ? (
                  <Button
                    onClick={() => setFilterEmployee(aiEmployee.username)}
                    className={css`
                      width: 40px;
                      height: 40px;
                      line-height: 40px;
                      font-weight: ${token.fontWeightStrong};
                      margin-top: 10px;
                      margin-bottom: 8px;
                      ${highlight}
                    `}
                  >
                    ALL
                  </Button>
                ) : (
                  <Popover
                    placement="bottomLeft"
                    content={
                      <div
                        style={{
                          width: '300px',
                          padding: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            textAlign: 'center',
                          }}
                        >
                          <Avatar
                            src={avatars(aiEmployee.avatar)}
                            size={60}
                            className={css``}
                            style={{
                              boxShadow: `0px 0px 2px ${token.colorBorder}`,
                            }}
                          />
                          <div
                            style={{
                              fontSize: token.fontSizeLG,
                              fontWeight: token.fontWeightStrong,
                              margin: '8px 0',
                            }}
                          >
                            {aiEmployee.nickname}
                          </div>
                        </div>
                        <Divider
                          orientation="left"
                          plain
                          style={{
                            fontStyle: 'italic',
                          }}
                        >
                          {t('Bio')}
                        </Divider>
                        <p>{aiEmployee.bio}</p>
                      </div>
                    }
                  >
                    <Button
                      className={css`
                        width: 40px;
                        height: 40px;
                        line-height: 40px;
                        padding: 0;
                        ${highlight}
                      `}
                      onClick={() => setFilterEmployee(aiEmployee.username)}
                    >
                      <Avatar src={avatars(aiEmployee.avatar)} shape="square" size={40} />
                    </Button>
                  </Popover>
                );
              }}
            />
          </Sider>
          <Sider
            width="30%"
            style={{
              display: showConversations ? 'block' : 'none',
              backgroundColor: token.colorBgContainer,
              marginRight: '5px',
            }}
          >
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
                    <Conversations
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
                              Modal.confirm({
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
          </Sider>
          <Layout>
            <Header
              style={{
                backgroundColor: token.colorBgContainer,
                height: '48px',
                lineHeight: '48px',
                padding: 0,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  float: 'left',
                }}
              >
                <Button
                  icon={<LayoutOutlined />}
                  type="text"
                  onClick={() => setShowConversations(!showConversations)}
                />
                {filterEmployee !== 'all' ? (
                  <Button
                    icon={<EditOutlined />}
                    type="text"
                    onClick={() => {
                      setCurrentConversation(undefined);
                      setMessages([]);
                      senderRef.current?.focus({
                        cursor: 'start',
                      });
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  float: 'right',
                }}
              >
                <Button icon={<ExpandOutlined />} type="text" />
                <Button icon={<CloseOutlined />} type="text" onClick={() => setOpen(false)} />
              </div>
            </Header>
            <Content
              style={{
                margin: '16px 0',
                overflow: 'auto',
              }}
            >
              {messages?.length ? (
                <Bubble.List
                  style={{
                    marginRight: '8px',
                  }}
                  roles={roles}
                  items={messages}
                />
              ) : (
                <div
                  style={{
                    width: '64px',
                    margin: '0 auto',
                    marginTop: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <EmptyIcon />
                </div>
              )}
            </Content>
            <Footer
              style={{
                backgroundColor: token.colorBgContainer,
                padding: 0,
              }}
            >
              <Sender
                ref={senderRef}
                onSubmit={(content) =>
                  send({
                    sessionId: currentConversation,
                    aiEmployee: { username: filterEmployee },
                    messages: [
                      {
                        type: 'text',
                        content,
                      },
                    ],
                  })
                }
                header={
                  attachments.length ? (
                    <div
                      style={{
                        padding: '8px 8px 0',
                      }}
                    >
                      {attachments.map((attachment, index) => {
                        return (
                          <Attachment
                            key={index}
                            closeable={true}
                            onClose={() => {
                              setAttachments(attachments.filter((_, i) => i !== index));
                            }}
                            {...attachment}
                          />
                        );
                      })}
                    </div>
                  ) : null
                }
                disabled={filterEmployee === 'all' && !currentConversation}
                placeholder={filterEmployee === 'all' && !currentConversation ? t('Please choose an AI employee.') : ''}
                loading={responseLoading}
              />
            </Footer>
            {/* </Layout> */}
            {/* <Sider */}
            {/*   width="25%" */}
            {/*   style={{ */}
            {/*     backgroundColor: token.colorBgContainer, */}
            {/*   }} */}
            {/* > */}
            {/*   <Conversations items={employees} /> */}
            {/* </Sider> */}
            {/* </Layout> */}
          </Layout>
        </Layout>
      </Card>
    </div>
  );
};
