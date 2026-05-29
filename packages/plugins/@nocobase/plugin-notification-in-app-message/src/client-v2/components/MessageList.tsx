/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { dayjs } from '@nocobase/utils/client';
import { Button, Card, Descriptions, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInAppMessageTranslation, useT } from '../locale';
import {
  channelMapObs,
  channelStatusFilterObs,
  fetchMessages,
  inboxVisibleObs,
  isFetchingMessageObs,
  markAllMessagesAsRead,
  selectedChannelNameObs,
  selectedMessageListObs,
  showMsgLoadingMoreObs,
  updateMessage,
} from '../state';
import type { Message } from '../../types';

function stripBasenamePrefix(text: string, prefix: string): string {
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

const InnerMessageList = () => {
  const { t } = useInAppMessageTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const selectedChannelName = selectedChannelNameObs.value;
  const selectedChannel = selectedChannelName ? channelMapObs.value[selectedChannelName] : null;
  const messages = selectedMessageListObs.value;
  const isFetchingMessages = isFetchingMessageObs.value;
  const statusFilter = channelStatusFilterObs.value;

  const msgStatusDict: Record<'read' | 'unread', string> = {
    read: t('Read'),
    unread: t('Unread'),
  };

  const basename = (ctx.app?.router?.basename ?? '').replace(/\/+$/, '');

  const onItemClicked = useMemoizedFn(async (message: Message) => {
    // Await the read-status write *before* navigation — when the URL is an
    // external (non-router) target, `window.location.href = ...` aborts any
    // in-flight fetch, which would silently drop the "mark as read" call.
    try {
      await updateMessage({
        filterByTk: message.id,
        values: { status: 'read' },
      });
    } catch (error) {
      console.error('Failed to mark message as read', error);
    }
    if (message.options?.url) {
      inboxVisibleObs.value = false;
      const url = String(message.options.url);
      if (url.startsWith('/')) {
        navigate(stripBasenamePrefix(url, basename));
      } else {
        window.location.href = url;
      }
    }
  });

  const onMarkAllReadClick = useMemoizedFn(async () => {
    if (!selectedChannelName) return;
    try {
      await markAllMessagesAsRead(selectedChannelName);
    } catch (error) {
      console.error('Failed to mark all messages as read', error);
    }
  });

  const onToggleStatus = useMemoizedFn(async (message: Message) => {
    try {
      await updateMessage({
        filterByTk: message.id,
        values: { status: message.status === 'read' ? 'unread' : 'read' },
      });
    } catch (error) {
      console.error('Failed to toggle message status', error);
    }
  });

  const onLoadMessagesMore = useCallback(() => {
    if (!selectedChannelName) return;
    const filter: Record<string, any> = { channelName: selectedChannelName };
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      filter.receiveTimestamp = { $lt: lastMessage.receiveTimestamp };
    }
    fetchMessages({ filter, limit: 30 }).catch((error) => {
      console.error('Failed to load more messages', error);
    });
  }, [messages, selectedChannelName]);

  if (!selectedChannelName) return null;

  const title = selectedChannel ? compileT(selectedChannel.title || selectedChannel.name) : '';
  const markAllDisabled = (selectedChannel?.unreadMsgCnt ?? 0) === 0 || statusFilter === 'read';

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: token.marginLG,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Button disabled={markAllDisabled} onClick={onMarkAllReadClick}>
          {t('Mark all as read')}
        </Button>
      </div>

      {messages.length === 0 && isFetchingMessages ? (
        <Spin style={{ width: '100%', marginTop: token.marginXXL }} />
      ) : (
        messages.map((message) => (
          <Card
            key={message.id}
            size="small"
            variant="borderless"
            style={{ marginBottom: token.marginMD }}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
            title={
              <Tooltip title={message.title} mouseEnterDelay={0.5}>
                <div
                  onClick={() => onItemClicked(message)}
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
                  onClick={(event) => {
                    event.stopPropagation();
                    onItemClicked(message);
                  }}
                >
                  {t('View')}
                </Button>
              ) : null
            }
          >
            <Descriptions column={1}>
              <Descriptions.Item label={t('Content')}>
                <Tooltip
                  title={message.content && message.content.length > 100 ? message.content : ''}
                  mouseEnterDelay={0.5}
                >
                  {message.content?.slice(0, 100)}
                  {message.content && message.content.length > 100 ? '...' : ''}
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label={t('Datetime')}>
                {dayjs(Number.parseInt(String(message.receiveTimestamp), 10)).fromNow()}
              </Descriptions.Item>
              <Descriptions.Item label={t('Status')}>
                <div style={{ height: token.controlHeight }}>
                  {hoveredMessageId === message.id ? (
                    <Button
                      type="link"
                      size="small"
                      style={{ fontSize: token.fontSizeSM }}
                      onClick={() => onToggleStatus(message)}
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
        ))
      )}
      {showMsgLoadingMoreObs.value ? (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button onClick={onLoadMessagesMore} loading={isFetchingMessages}>
            {t('Loading more')}
          </Button>
        </div>
      ) : null}
    </>
  );
};

export const MessageList = observer(InnerMessageList, { displayName: 'MessageList' });
export default MessageList;
