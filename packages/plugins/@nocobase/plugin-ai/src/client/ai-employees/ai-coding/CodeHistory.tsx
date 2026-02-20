/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarProps, Button, Flex, Layout, List } from 'antd';
import { css, useToken } from '@nocobase/client';
import { LeftOutlined, UserOutlined } from '@ant-design/icons';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatMessagesStore } from '../chatbox/stores/chat-messages';
import { ContextItem, Message } from '../types';
import { CodeBasic } from '../chatbox/markdown/Code';
import { avatars } from '../avatars';
import { Typography } from 'antd';
import { useT } from '../../locale';

const { Header, Content } = Layout;
const { Title } = Typography;

type WorkContent = {
  scene: string;
  language: string;
  code: string;
};

export const CodeHistory: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const setShowCodeHistory = useChatBoxStore.use.setShowCodeHistory();
  return (
    <Layout
      style={{
        padding: '0 16px 16px',
        height: '100%',
      }}
    >
      <Header
        style={{
          backgroundColor: token.colorBgContainer,
          height: '48px',
          lineHeight: '48px',
          padding: 0,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Flex
          style={{
            height: '100%',
          }}
          justify="flex-start"
          align="center"
          gap="middle"
        >
          <Button
            icon={<LeftOutlined />}
            type="text"
            onClick={() => {
              setShowCodeHistory(false);
            }}
          />
          <Title level={5} style={{ margin: 0 }}>
            {t('Code history')}
          </Title>
        </Flex>
      </Header>
      <Content>
        <CodeHistoryList />
      </Content>
    </Layout>
  );
};

const CodeHistoryList: React.FC = () => {
  const language = 'javascript';
  const workContextType = 'code-editor';
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const messages = useChatMessagesStore.use.messages();
  const [dataSource, setDataSource] = useState<{ message: Message; workContext: ContextItem }[]>([]);

  useEffect(() => {
    if (!currentEmployee || !messages?.length) {
      return;
    }
    const pattern = new RegExp('```' + language + '([\\s\\S]*?)```', 's');
    const userMessages = messages
      .filter((msg) => msg.role === 'user')
      .filter((msg) => msg.content?.workContext?.length !== 0)
      .filter((msg) => msg.content.workContext.some((item) => item.type === workContextType))
      .flatMap((msg) => msg.content.workContext.map((contextItem) => ({ message: msg, workContext: contextItem })))
      .filter((item) => item.workContext.type === workContextType);
    const agentMessages = messages
      .filter((msg) => msg.role === currentEmployee.username)
      .filter((msg) => msg.content?.type === 'text')
      .filter((msg) => pattern.test(msg.content.content))
      .map((msg) => {
        const match = pattern.exec(msg.content.content);
        return {
          message: msg,
          workContext: {
            type: workContextType,
            uid: msg.key,
            content: {
              language,
              code: match[1],
            },
          } as ContextItem,
        };
      });
    const mergedMessages = [...userMessages, ...agentMessages];
    mergedMessages.sort((a, b) => Number(a.message.key) - Number(b.message.key));
    setDataSource(mergedMessages);
  }, [messages, currentEmployee]);

  return (
    <List
      style={{ height: '100%', overflowY: 'auto' }}
      dataSource={dataSource}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <CodeHistoryListItem {...item} />
        </List.Item>
      )}
    />
  );
};

const CodeHistoryListItem: React.FC<{ message: Message; workContext: ContextItem }> = ({ message, workContext }) => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const content = workContext.content as WorkContent;
  const avatarProps: AvatarProps = {
    size: 33,
    shape: 'circle',
    style: {
      border: '1px solid #eee',
    },
  };
  return (
    <Flex justify="space-around" style={{ width: '100%' }}>
      {message.role === 'user' ? (
        <Avatar {...avatarProps} icon={<UserOutlined />} />
      ) : (
        <Avatar {...avatarProps} src={avatars(currentEmployee.avatar)} />
      )}
      <div
        className={css`
          width: 350px;
          margin-bottom: -1em;
        `}
      >
        <CodeBasic className={`language-${content.language}`}>{content.code}</CodeBasic>
      </div>
    </Flex>
  );
};
