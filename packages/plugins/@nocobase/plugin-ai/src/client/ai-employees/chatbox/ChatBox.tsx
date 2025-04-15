/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Layout, Card, Button } from 'antd';
import { CloseOutlined, ExpandOutlined, EditOutlined, LayoutOutlined, ShrinkOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
const { Header, Footer, Sider } = Layout;
import { useChatBoxContext } from './ChatBoxContext';
import { Conversations } from './Conversations';
import { Messages } from './Messages';
import { Sender } from './Sender';
import { useAISelectionContext } from '../selector/AISelectorProvider';

export const ChatBox: React.FC = () => {
  const setOpen = useChatBoxContext('setOpen');
  const startNewConversation = useChatBoxContext('startNewConversation');
  const currentEmployee = useChatBoxContext('currentEmployee');
  const { token } = useToken();
  const [showConversations, setShowConversations] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { selectable } = useAISelectionContext();

  return (
    <div
      style={
        !expanded
          ? {
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              width: '90%',
              maxWidth: '760px',
              height: '90%',
              maxHeight: '560px',
              zIndex: selectable ? -1 : 1000,
            }
          : {
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              width: '95%',
              height: '95%',
              zIndex: selectable ? -1 : 1000,
            }
      }
    >
      <Card
        style={{ height: '100%' }}
        styles={{
          body: { height: '100%', paddingTop: 0, boxShadow: token.boxShadow },
        }}
      >
        <Layout style={{ height: '100%' }}>
          <Sider
            width={!expanded ? '30%' : '15%'}
            style={{
              display: showConversations ? 'block' : 'none',
              backgroundColor: token.colorBgContainer,
              marginRight: '5px',
              minWidth: '200px',
            }}
          >
            <Conversations />
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
                {currentEmployee ? <Button icon={<EditOutlined />} type="text" onClick={startNewConversation} /> : null}
              </div>
              <div
                style={{
                  float: 'right',
                }}
              >
                <Button
                  icon={!expanded ? <ExpandOutlined /> : <ShrinkOutlined />}
                  type="text"
                  onClick={() => setExpanded(!expanded)}
                />
                <Button icon={<CloseOutlined />} type="text" onClick={() => setOpen(false)} />
              </div>
            </Header>
            <Messages />
            <Footer
              style={{
                backgroundColor: token.colorBgContainer,
                padding: 0,
              }}
            >
              <Sender />
            </Footer>
          </Layout>
        </Layout>
      </Card>
    </div>
  );
};
