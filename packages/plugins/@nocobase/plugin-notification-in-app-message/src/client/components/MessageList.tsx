/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { observer } from '@formily/reactive-react';
import { dayjs } from '@nocobase/utils/client';
import { Button, Card, ConfigProvider, Descriptions, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalTranslation } from '../../locale';

import { useApp } from '@nocobase/client';
import {
  channelMapObs,
  channelStatusFilterObs,
  fetchMessages,
  inboxVisible,
  isFecthingMessageObs,
  markAllMessagesAsRead,
  selectedChannelNameObs,
  selectedMessageListObs,
  showMsgLoadingMoreObs,
  updateMessage,
} from '../observables';

function removeStringIfStartsWith(text: string, prefix: string): string {
  if (text.startsWith(prefix)) {
    return text.slice(prefix.length);
  }
  return text;
}

const MessageList = observer(() => {
  const app = useApp();
  const basename = app.router.basename.replace(/\/+$/, '');
  const { t } = useLocalTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const selectedChannelName = selectedChannelNameObs.value;
  const selectedChannel = selectedChannelName ? channelMapObs.value[selectedChannelName] : null;
  const isFetchingMessages = isFecthingMessageObs.value;
  const messages = selectedMessageListObs.value;
  const msgStatusDict = {
    read: t('Read'),
    unread: t('Unread'),
  };

  const onMarkAllReadClick = useCallback(() => {
    if (selectedChannelName) {
      markAllMessagesAsRead({ channelName: selectedChannelName });
    }
  }, [selectedChannelName]);

  if (!selectedChannelName) return null;

  const onItemClicked = (message) => {
    updateMessage({
      filterByTk: message.id,
      values: {
        status: 'read',
      },
    });
    if (message.options?.url) {
      inboxVisible.value = false;
      const url = message.options.url;
      if (url.startsWith('/')) navigate(removeStringIfStartsWith(url, basename));
      else {
        window.location.href = url;
      }
    }
  };

  const onLoadMessagesMore = useCallback(() => {
    const filter: Record<string, any> = {};
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      filter.receiveTimestamp = {
        $lt: lastMessage.receiveTimestamp,
      };
    }
    if (selectedChannelName) {
      filter.channelName = selectedChannelName;
    }
    fetchMessages({ filter, limit: 30 });
  }, [messages, selectedChannelName]);

  const title = Schema.compile(channelMapObs.value[selectedChannelName].title, { t: app.i18n.t });

  return (
    <ConfigProvider
      theme={{
        components: { Badge: { dotSize: 8 } },
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: token.marginLG }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Button
          disabled={selectedChannel?.unreadMsgCnt === 0 || channelStatusFilterObs.value === 'read'}
          onClick={onMarkAllReadClick}
        >
          {t('Mark all as read')}
        </Button>
      </div>

      {messages.length === 0 && isFecthingMessageObs.value ? (
        <Spin style={{ width: '100%', marginTop: token.marginXXL }} />
      ) : (
        messages.map((message, index) => (
          <>
            <Card
              size={'small'}
              bordered={false}
              style={{ marginBottom: token.marginMD }}
              onMouseEnter={() => {
                setHoveredMessageId(message.id);
              }}
              onMouseLeave={() => {
                setHoveredMessageId(null);
              }}
              title={
                <Tooltip title={message.title} mouseEnterDelay={0.5}>
                  <div
                    onClick={() => {
                      onItemClicked(message);
                    }}
                    style={{
                      fontWeight: message.status === 'unread' ? 'bold' : 'normal',
                      cursor: 'pointer',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {message.title}
                  </div>
                </Tooltip>
              }
              extra={
                message.options?.url ? (
                  <Button
                    type="link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClicked(message);
                    }}
                  >
                    {t('View')}
                  </Button>
                ) : null
              }
              key={message.id}
            >
              <Descriptions key={index} column={1}>
                <Descriptions.Item label={t('Content')}>
                  {' '}
                  <Tooltip title={message.content?.length > 100 ? message.content : ''} mouseEnterDelay={0.5}>
                    {message.content?.slice(0, 100) + (message.content?.length > 100 ? '...' : '')}{' '}
                  </Tooltip>
                </Descriptions.Item>
                <Descriptions.Item label={t('Datetime')}>{dayjs(message.receiveTimestamp).fromNow()}</Descriptions.Item>
                <Descriptions.Item label={t('Status')}>
                  <div style={{ height: token.controlHeight }}>
                    {hoveredMessageId === message.id ? (
                      <Button
                        type="link"
                        size="small"
                        style={{ fontSize: token.fontSizeSM }}
                        onClick={() => {
                          updateMessage({
                            filterByTk: message.id,
                            values: {
                              status: message.status === 'read' ? 'unread' : 'read',
                            },
                          });
                        }}
                      >
                        {t(message.status === 'unread' ? 'Mark as read' : 'Mark as unread')}
                      </Button>
                    ) : (
                      <Tag color={message.status === 'unread' ? 'red' : 'green'}>{msgStatusDict[message.status]}</Tag>
                    )}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        ))
      )}
      {showMsgLoadingMoreObs.value && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button onClick={onLoadMessagesMore} loading={isFetchingMessages}>
            {t('Loading more')}
          </Button>
        </div>
      )}
    </ConfigProvider>
  );
});

export default MessageList;
