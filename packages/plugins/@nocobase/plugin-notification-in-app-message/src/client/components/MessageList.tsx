/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback } from 'react';
import { observer } from '@formily/reactive-react';

import { Card, Descriptions, Button, Spin, Tag, ConfigProvider, Typography, Tooltip, theme } from 'antd';
import { dayjs } from '@nocobase/utils/client';
import { useNavigate } from 'react-router-dom';
import { useLocalTranslation } from '../../locale';

import {
  selectedChannelNameObs,
  channelMapObs,
  fetchMessages,
  isFecthingMessageObs,
  selectedMessageListObs,
  showMsgLoadingMoreObs,
  updateMessage,
  inboxVisible,
} from '../observables';

const MessageList = observer(() => {
  const { t } = useLocalTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const selectedChannelName = selectedChannelNameObs.value;
  const isFetchingMessages = isFecthingMessageObs.value;
  const messages = selectedMessageListObs.value;
  const msgStatusDict = {
    read: t('Read'),
    unread: t('Unread'),
  };
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
      if (url.startsWith('/')) navigate(url);
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

  return (
    <ConfigProvider
      theme={{
        components: { Badge: { dotSize: 8 } },
      }}
    >
      <Typography.Title level={4} style={{ marginBottom: token.marginLG }}>
        {channelMapObs.value[selectedChannelName].title}
      </Typography.Title>

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
                      width: '100%',
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
                    {hoveredMessageId === message.id && message.status === 'unread' ? (
                      <Button
                        type="link"
                        size="small"
                        style={{ fontSize: token.fontSizeSM }}
                        onClick={() => {
                          updateMessage({
                            filterByTk: message.id,
                            values: {
                              status: 'read',
                            },
                          });
                        }}
                      >
                        {t('Mark as read')}
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
