/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Spin, theme } from 'antd';
import { DatabaseOutlined, ExclamationCircleTwoTone, LoadingOutlined } from '@ant-design/icons';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';
import { useChatToolsStore } from '../chatbox/stores/chat-tools';
import type { CollectionDataType, DataModelingArgs } from './data-modeling/types';

function normalizeCollections(collections: DataModelingArgs['collections']): CollectionDataType[] | null {
  if (Array.isArray(collections)) {
    return collections;
  }
  if (typeof collections !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(collections) as unknown;
    return Array.isArray(parsed) ? (parsed as CollectionDataType[]) : null;
  } catch {
    return null;
  }
}

export const DataModelingCard: React.FC<ToolsUIProperties<DataModelingArgs>> = ({ messageId, toolCall }) => {
  const t = useT();
  const { token } = theme.useToken();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const responseLoading = chat.use.responseLoading();
  const messages = chat.use.messages();
  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const toolsByMessageId = useChatToolsStore.use.toolsByMessageId();
  const version = toolsByMessageId[messageId]?.[toolCall.id]?.version;
  const generating = responseLoading && messages[messages.length - 1]?.content?.messageId === messageId;
  const collections = normalizeCollections(toolCall.args?.collections);

  let description = <>{t('Please review and finish the process')}</>;
  if (generating) {
    description = (
      <>
        <Spin indicator={<LoadingOutlined spin />} size="small" /> {t('Generating...')}
      </>
    );
  } else if (!collections) {
    console.error('Invalid definition', toolCall.args);
    description = (
      <>
        <ExclamationCircleTwoTone twoToneColor={token.colorError} /> {t('Invalid definition')}
      </>
    );
  }

  return (
    <Card
      style={{
        margin: `${token.margin}px 0`,
        cursor: generating || !collections ? 'default' : 'pointer',
      }}
      onClick={() => {
        if (generating || !collections) {
          return;
        }
        setActiveTool(toolCall);
        setActiveMessageId(messageId);
        setOpen(true);
      }}
    >
      <Card.Meta
        avatar={<DatabaseOutlined />}
        title={
          <>
            {t('Data modeling')}
            {version && version > 1 ? (
              <span
                style={{
                  marginLeft: token.marginXS,
                  color: token.colorTextDescription,
                  fontWeight: token.fontWeightStrong - 200,
                  fontStyle: 'italic',
                }}
              >
                {t('Version')} {version}
              </span>
            ) : null}
          </>
        }
        description={description}
      />
    </Card>
  );
};
