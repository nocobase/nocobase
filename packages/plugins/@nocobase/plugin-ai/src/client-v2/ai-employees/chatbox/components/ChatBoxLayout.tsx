/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect } from 'react';
import { Avatar, Button, Card, Flex, notification, theme, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useApp, useMobileLayout } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { ChatBox } from './ChatBox';
import { ChatButton } from './ChatButton';
import { DebugPanel } from './DebugPanel';
import { ToolModal } from './ToolModal';
import { AISelection } from '../../AISelection';
import { AISelectionControl } from '../../AISelectionControl';
import { avatars } from '../../avatars';
import { dialogController } from '../../stores/dialog-controller';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { AI_EMPLOYEE_TRIGGER_TASK_EVENT } from '../../../manager/ai-manager';
import { useT } from '../../../locale';
import type { PluginAIClientV2 } from '../../../plugin';
import { normalizeTriggerTaskOptions, type RunJSAIEmployeeTriggerTaskOptions } from '../utils';
import { getMountedChatBox } from '../stores/mounted-chat-boxes';
import { ChatBoxRuntimeProvider, getGlobalChatBoxRuntime, useChatBoxRuntime } from '../stores/runtime';

const { Text } = Typography;

export const ChatBoxLayout: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <ChatBoxRuntimeProvider runtime={getGlobalChatBoxRuntime()}>
      <ChatBoxLayoutContent>{children}</ChatBoxLayoutContent>
    </ChatBoxRuntimeProvider>
  );
};

const ChatBoxLayoutContent: React.FC<{
  children?: React.ReactNode;
}> = observer(({ children }) => {
  const app = useApp();
  const { isMobileLayout } = useMobileLayout();
  const { chatBoxModel, chatToolModel } = useChatBoxRuntime();
  const open = chatBoxModel.open;
  const expanded = chatBoxModel.expanded;
  const showDebugPanel = chatBoxModel.showDebugPanel;
  const activeTool = chatToolModel.activeTool;
  const { loadUnreadCounts } = useChatConversationActions();
  const { triggerTask } = useChatBoxActions();
  const aiConfigRepository = useAIConfigRepository();
  const t = useT();

  const refreshUnreadCounts = useCallback(() => {
    loadUnreadCounts().catch(console.error);
  }, [loadUnreadCounts]);

  useEffect(() => {
    refreshUnreadCounts();
    app.eventBus.addEventListener('ws:message:ai-employee-tasks:status', refreshUnreadCounts);
    app.eventBus.addEventListener('ws:message:ai-conversations:read', refreshUnreadCounts);
    return () => {
      app.eventBus.removeEventListener('ws:message:ai-employee-tasks:status', refreshUnreadCounts);
      app.eventBus.removeEventListener('ws:message:ai-conversations:read', refreshUnreadCounts);
    };
  }, [app.eventBus, refreshUnreadCounts]);

  useEffect(() => {
    const plugin = app.pm.get('ai') as PluginAIClientV2 | undefined;
    const aiManager = plugin?.aiManager;
    const handler = (event: Event) => {
      const options = (event as CustomEvent<RunJSAIEmployeeTriggerTaskOptions>).detail;

      normalizeTriggerTaskOptions(options, {
        aiConfigRepository,
        apiClient: app.apiClient,
      })
        .then((normalized) => {
          if (!normalized) {
            return undefined;
          }
          const targetChatBoxUid = normalized.chatBoxUid;
          const targetChatBox = targetChatBoxUid ? getMountedChatBox(targetChatBoxUid) : undefined;
          if (targetChatBoxUid && !targetChatBox) {
            notification.error({
              message: t('AI chat box not found', { uid: targetChatBoxUid }),
            });
            return undefined;
          }
          if (targetChatBox) {
            return targetChatBox.triggerTask(normalized);
          }
          return triggerTask(normalized);
        })
        .catch(console.error);
    };

    app.eventBus.addEventListener(AI_EMPLOYEE_TRIGGER_TASK_EVENT, handler);
    aiManager?.onChatBoxMounted();
    return () => {
      aiManager?.onChatBoxUnmounted();
      app.eventBus.removeEventListener(AI_EMPLOYEE_TRIGGER_TASK_EVENT, handler);
    };
  }, [aiConfigRepository, app.apiClient, app.eventBus, app.pm, t, triggerTask]);

  const panelWidth = 450;
  const zIndex = 1100;

  return (
    <>
      {children}
      <ChatButton />
      {open && !expanded && !isMobileLayout ? (
        <style>
          {`
html {
  padding-left: 450px;
}
html body {
  position: relative;
  overflow: hidden;
  transform: translateX(-450px);
}
.ant-dropdown-placement-topLeft,
.ant-dropdown-placement-bottomLeft,
.ant-dropdown-menu-submenu-placement-rightTop,
.ant-dropdown-menu-submenu-placement-rightBottom,
.ant-select-dropdown-placement-bottomLeft,
.ant-select-dropdown-placement-topLeft,
.ant-select-dropdown-placement-bottomRight,
.ant-select-dropdown-placement-topRight {
  transform: translateX(450px) !important;
}
`}
        </style>
      ) : null}
      {open ? (
        <ChatBoxWrapper
          expanded={expanded}
          isMobileLayout={isMobileLayout}
          panelWidth={panelWidth}
          zIndex={zIndex}
          onClose={() => {
            chatBoxModel.setOpen(false);
          }}
        />
      ) : null}
      {activeTool ? <ToolModal /> : null}
      <AISelection />
      <AISelectionControl />
      {showDebugPanel ? <DebugPanel /> : null}
    </>
  );
});

const ChatBoxWrapper: React.FC<{
  expanded: boolean;
  isMobileLayout: boolean;
  panelWidth: number;
  zIndex: number;
  onClose: () => void;
}> = observer(({ expanded, isMobileLayout, panelWidth, zIndex, onClose }) => {
  const { token } = theme.useToken();
  const { chatBoxModel } = useChatBoxRuntime();
  const minimize = chatBoxModel.minimize;
  const dialogZIndex = dialogController.shouldHide ? -1 : zIndex;

  if (isMobileLayout) {
    return <MobileLayoutChatBox minimize={minimize} zIndex={dialogZIndex} />;
  }

  if (expanded) {
    return (
      <Card
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
          width: '95%',
          height: '95%',
          zIndex: dialogZIndex,
        }}
        styles={{
          body: {
            height: '100%',
            padding: 0,
          },
        }}
      >
        <ChatBox onClose={onClose} />
      </Card>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        right: -panelWidth,
        top: 0,
        width: panelWidth,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 1,
        borderInlineStart: '1px solid rgba(5, 5, 5, 0.06)',
        background: token.colorBgContainer,
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <ChatBox onClose={onClose} />
    </div>
  );
});

const MobileLayoutChatBox: React.FC<{
  minimize: boolean;
  zIndex: number;
}> = observer(({ minimize, zIndex }) => {
  const { token } = theme.useToken();

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: token.colorBgContainer,
        display: minimize ? 'none' : 'block',
      }}
    >
      <ChatBox />
      <ChatBoxMinimizeControl />
    </div>
  );
});

const ChatBoxMinimizeControl: React.FC = () => {
  const { chatBoxModel } = useChatBoxRuntime();
  const currentEmployee = chatBoxModel.currentEmployee;
  const minimize = chatBoxModel.minimize;
  const t = useT();
  const [api, contextHolder] = notification.useNotification();
  const key = React.useRef(`ai-chat-box-minimize-control-${Date.now()}`);
  const currentEmployeeAvatar = currentEmployee?.avatar;

  useEffect(() => {
    const notificationKey = key.current;
    if (minimize && currentEmployeeAvatar) {
      api.open({
        key: notificationKey,
        closeIcon: false,
        message: (
          <Flex justify="space-between" align="center" gap="small">
            <Avatar shape="circle" size={35} src={avatars(currentEmployeeAvatar)} />
            <Text ellipsis>{t('Conversation')}</Text>
            <Button
              aria-label={t('Close')}
              icon={<CloseOutlined />}
              type="text"
              onClick={(event) => {
                event.stopPropagation();
                chatBoxModel.setOpen(false);
                chatBoxModel.setMinimize(false);
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
          chatBoxModel.setMinimize(false);
        },
      });
    } else {
      api.destroy(notificationKey);
    }

    return () => {
      api.destroy(notificationKey);
    };
  }, [api, chatBoxModel, currentEmployeeAvatar, minimize, t]);

  return <>{contextHolder}</>;
};
