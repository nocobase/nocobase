/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AttachmentsHeader } from './AttachmentsHeader';
import { ContextItemsHeader } from './ContextItemsHeader';
import { EditMessageHeader } from './EditMessageHeader';
import { useChatBoxStore } from './stores/chat-box';
import { useChat } from './hooks/useChat';
import { HintMessageHeader } from './HintMessageHeader';
import { useChatConversationsStore } from './stores/chat-conversations';

export const SenderHeader: React.FC = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const isShowSenderHint = useChatBoxStore.use.isShowSenderHint();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const contextItems = chat.use.contextItems();
  const attachments = chat.use.attachments();

  const hasContextItems = !!contextItems?.length;
  const hasAttachments = !!attachments?.length;

  if (!isShowSenderHint && !isEditingMessage && (!currentEmployee || (!hasContextItems && !hasAttachments))) {
    return null;
  }

  return (
    <div
      style={{
        padding: '8px 8px 0 8px',
      }}
    >
      {isShowSenderHint ? <HintMessageHeader /> : null}
      {isEditingMessage ? (
        <div>
          <EditMessageHeader />
        </div>
      ) : null}
      {currentEmployee ? <ContextItemsHeader /> : null}
      {currentEmployee ? <AttachmentsHeader /> : null}
    </div>
  );
};
