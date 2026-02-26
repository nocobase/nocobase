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
import { useChatMessagesStore } from './stores/chat-messages';

export const SenderHeader: React.FC = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const contextItems = useChatMessagesStore.use.contextItems();
  const attachments = useChatMessagesStore.use.attachments();

  const hasContextItems = !!contextItems?.length;
  const hasAttachments = !!attachments?.length;

  if (!isEditingMessage && (!currentEmployee || (!hasContextItems && !hasAttachments))) {
    return null;
  }

  return (
    <div
      style={{
        padding: '8px 8px 0 8px',
      }}
    >
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
