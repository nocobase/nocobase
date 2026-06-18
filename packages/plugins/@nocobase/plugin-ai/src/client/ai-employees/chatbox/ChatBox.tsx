/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Avatar, Button, Card, Flex, notification, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useMobileLayout } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import { ChatBox } from '../../../client-v2/ai-employees/chatbox/components/ChatBox';
import { useT } from '../../locale';
import { avatars } from '../avatars';
import { CodeHistory } from '../ai-coding/CodeHistory';
import { dialogController } from '../stores/dialog-controller';
import { useChatBoxStore } from './stores/chat-box';

const { Text } = Typography;

export { ChatBox };

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
        left: 0,
        top: 0,
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
  const key = useRef(`ai-chat-box-minimize--control-${Date.now()}`);
  const currentEmployeeAvatar = currentEmployee?.avatar;

  useEffect(() => {
    const notificationKey = key.current;
    if (minimize === true && currentEmployeeAvatar) {
      api.open({
        key: notificationKey,
        closeIcon: false,
        message: (
          <Flex justify="space-between" align="center">
            <Avatar shape="circle" size={35} src={avatars(currentEmployeeAvatar)} />
            <Text ellipsis>{t('Conversation')}</Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                setMinimize(false);
              }}
            />
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
      api.destroy(notificationKey);
    }

    return () => {
      api.destroy(notificationKey);
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
