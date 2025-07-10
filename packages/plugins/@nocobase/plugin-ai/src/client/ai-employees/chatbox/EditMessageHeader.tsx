import React from 'react';
import { Alert } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatConversations } from './ChatConversationsProvider';
import { useChatBoxContext } from './ChatBoxContext';
export const EditMessageHeader: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const { messagesService, setMessages, finishEditingMessage } = useChatMessages();
  const { currentConversation } = useChatConversations();
  const setSenderValue = useChatBoxContext('setSenderValue');

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
