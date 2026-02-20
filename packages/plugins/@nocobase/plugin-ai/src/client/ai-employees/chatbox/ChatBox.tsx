/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Layout, Card, Button, Divider, Tooltip, notification, Avatar, Flex, Typography } from 'antd';
import {
  CloseOutlined,
  FullscreenOutlined,
  PlusCircleOutlined,
  FullscreenExitOutlined,
  CodeOutlined,
  CompressOutlined,
  BugOutlined, // [AI_DEBUG]
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { useMobileLayout, useToken } from '@nocobase/client';
const { Header, Footer, Sider } = Layout;
import { Conversations } from './Conversations';
import { Messages } from './Messages';
import { Sender } from './Sender';
import { useT } from '../../locale';
import { UserPrompt } from './UserPrompt';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { observer } from '@nocobase/flow-engine';
import { dialogController } from '../stores/dialog-controller';
import { CodeHistory } from '../ai-coding/CodeHistory';
import { isEngineer } from '../built-in/utils';
import { avatars } from '../avatars';

const { Text } = Typography;

export const ChatBox: React.FC = () => {
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const setChatBoxRef = useChatBoxStore.use.setChatBoxRef();
  const setOpen = useChatBoxStore.use.setOpen();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const expanded = useChatBoxStore.use.expanded();
  const setExpanded = useChatBoxStore.use.setExpanded();
  const setMinimize = useChatBoxStore.use.setMinimize();
  const showConversations = useChatBoxStore.use.showConversations();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const setShowCodeHistory = useChatBoxStore.use.setShowCodeHistory();
  // [AI_DEBUG]
  const showDebugPanel = useChatBoxStore.use.showDebugPanel();
  const setShowDebugPanel = useChatBoxStore.use.setShowDebugPanel();

  const { startNewConversation } = useChatBoxActions();

  const { token } = useToken();
  const t = useT();

  useEffect(() => {
    setChatBoxRef(chatBoxRef);
  }, []);

  const { isMobileLayout } = useMobileLayout();

  return (
    <Layout style={{ height: '100%', position: 'relative' }} ref={chatBoxRef}>
      {showConversations && !expanded && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={() => setShowConversations(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '300px',
              height: '100%',
              backgroundColor: token.colorBgContainer,
              zIndex: 11,
              borderRight: `1px solid ${token.colorBorder}`,
              overflow: 'hidden',
            }}
          >
            <Conversations />
          </div>
        </>
      )}
      {showConversations && expanded && (
        <Sider
          width={300}
          style={{
            backgroundColor: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorder}`,
            overflow: 'hidden',
          }}
        >
          <Conversations />
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            backgroundColor: token.colorBgContainer,
            height: '48px',
            lineHeight: '48px',
            padding: '0 16px',
            borderBottom: `1px solid ${token.colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Button
              icon={showConversations ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                setShowConversations(!showConversations);
              }}
            />
          </div>
          <div>
            {currentEmployee ? (
              <>
                <Tooltip arrow={false} title={t('New conversation')}>
                  <Button icon={<PlusCircleOutlined />} type="text" onClick={startNewConversation} />
                </Tooltip>
                <UserPrompt />
                {isEngineer(currentEmployee) && (
                  <Tooltip arrow={false} title={t('Code history')}>
                    <Button
                      icon={<CodeOutlined />}
                      type="text"
                      onClick={() => {
                        setShowCodeHistory(true);
                      }}
                    />
                  </Tooltip>
                )}
                {/* [AI_DEBUG] Debug panel button */}
                {!expanded && (
                  <Tooltip arrow={false} title={t('Debug Panel')}>
                    <Button icon={<BugOutlined />} type="text" onClick={() => setShowDebugPanel(!showDebugPanel)} />
                  </Tooltip>
                )}
                <Divider type="vertical" />
              </>
            ) : null}
            {isMobileLayout ? (
              <Button
                icon={<CompressOutlined />}
                type="text"
                onClick={() => {
                  setMinimize(true);
                }}
              />
            ) : (
              <Button
                icon={!expanded ? <FullscreenOutlined /> : <FullscreenExitOutlined />}
                type="text"
                onClick={() => {
                  if (!expanded) {
                    setShowDebugPanel(false);
                  }
                  setExpanded(!expanded);
                }}
              />
            )}
            <Tooltip arrow={false} title={t('Collapse panel')}>
              <Button icon={<CloseOutlined />} type="text" onClick={() => setOpen(false)} />
            </Tooltip>
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
          <div
            style={{
              textAlign: 'center',
              margin: '10px 0',
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {t('AI disclaimer')}
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

const ExpandChatBox: React.FC = observer(() => {
  return (
    <Card
      style={{
        position: 'fixed',
        transform: 'translate(-50%, -50%)',
        left: '50%',
        top: '50%',
        width: '95%',
        height: '95%',
        zIndex: dialogController.shouldHide ? -1 : 1100,
      }}
      styles={{
        body: {
          height: '100%',
          padding: 0,
        },
      }}
    >
      <ChatBox />
    </Card>
  );
});

const MobileLayoutChatBox: React.FC<{ minimize: boolean }> = observer(({ minimize }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        zIndex: dialogController.shouldHide ? -1 : 1100,
        backgroundColor: 'white',
        display: minimize ? 'none' : 'block',
      }}
    >
      <ChatBox />
      <ChatBoxMinimizeControl />
    </div>
  );
});

export const ChatBoxMinimizeControl: React.FC = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const minimize = useChatBoxStore.use.minimize();
  const setMinimize = useChatBoxStore.use.setMinimize();
  const setOpen = useChatBoxStore.use.setOpen();

  const t = useT();
  const [api, contextHolder] = notification.useNotification();
  const key = useRef(`ai-chat-box-minimize--control-${new Date().getTime()}`);

  const currentEmployeeAvatar = currentEmployee?.avatar;

  useEffect(() => {
    if (minimize === true && currentEmployeeAvatar) {
      api.open({
        key: key.current,
        closeIcon: false,
        message: (
          <Flex justify="space-between" align="center">
            <Avatar shape="circle" size={35} src={avatars(currentEmployeeAvatar)} />
            <Text ellipsis>{t('Conversation')}</Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                setMinimize(false);
              }}
            ></Button>
          </Flex>
        ),
        duration: 0,
        placement: 'top',
        style: {
          width: 200,
        },
        onClick() {
          setMinimize(false);
        },
      });
    } else {
      api.destroy(key.current);
    }

    return () => {
      api.destroy(key.current);
    };
  }, [api, currentEmployeeAvatar, minimize, setMinimize, setOpen, t]);

  return <>{contextHolder}</>;
};

export const ChatBoxWrapper: React.FC = () => {
  const expanded = useChatBoxStore.use.expanded();
  const minimize = useChatBoxStore.use.minimize();
  const showCodeHistory = useChatBoxStore.use.showCodeHistory();
  const { isMobileLayout } = useMobileLayout();

  if (isMobileLayout) {
    return <MobileLayoutChatBox minimize={minimize} />;
  }

  if (expanded) {
    return <ExpandChatBox />;
  }

  return (
    <div
      style={{
        position: 'fixed',
        transform: 'translateX(0px) !important',
        right: '-450px',
        zIndex: 1,
        top: 0,
        width: '450px',
        height: '100vh',
        overflow: 'hidden',
        borderInlineStart: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      {showCodeHistory ? <CodeHistory /> : <ChatBox />}
    </div>
  );
};
