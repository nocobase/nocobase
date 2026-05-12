/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css } from '@emotion/css';
import { ContextItem } from './ContextItem';
import { useChat } from './hooks/useChat';
import { useChatConversationsStore } from './stores/chat-conversations';

export const ContextItemsHeader: React.FC = () => {
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const contextItems = chat.use.contextItems();
  const removeContextItem = chat.removeContextItem;
  if (!contextItems?.length) {
    return null;
  }
  return (
    <div
      className={css`
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 2px 0;
        margin-top: 4px;
      `}
    >
      {contextItems.map((item) => (
        <ContextItem
          within="sender"
          key={`${item.type}:${item.uid}`}
          item={item}
          closable={true}
          onRemove={removeContextItem}
        />
      ))}
    </div>
  );
};
