/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxStore } from './stores/chat-box';
import { useChatConversationsStore } from './stores/chat-conversations';

export const EditMessageHeader: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  const setSenderValue = useChatBoxStore.use.setSenderValue();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const setMessages = useChatMessagesStore.use.setMessages();

  const { messagesService, finishEditingMessage } = useChatMessageActions();

  return (
    <Alert
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        color: token.colorText,
      }}
      icon={<EditOutlined style={{ color: token.colorText }} />}
      message={t('Editing message for AI employee')}
      type="info"
      showIcon
      closable
      onClose={() => {
        finishEditingMessage();
        setSenderValue('');
        setMessages([]);
        messagesService.run(currentConversation);
      }}
    />
  );
};
