/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, useFlowContext } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { useMemoizedFn } from 'ahooks';
import { Badge, Button, Empty, Flex, List, Spin, theme, Typography } from 'antd';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Channel, Message } from '../../types';
import { useInAppMessageTranslation, useT } from '../locale';
import {
  channelListObs,
  channelStatusFilterObs,
  fetchChannels,
  fetchMessages,
  isFetchingChannelsObs,
  isFetchingMessageObs,
  selectedChannelNameObs,
  selectedMessageListObs,
  showChannelLoadingMoreObs,
  showMsgLoadingMoreObs,
  updateMessage,
  userIdObs,
  type ChannelStatus,
} from '../state';

dayjs.extend(relativeTime);

type LoadMoreStatus = 'success' | 'loading' | 'failure';
type MobileNotificationView = 'channels' | 'messages';
const MOBILE_NOTIFICATION_TAB_HEIGHT = 42;
type MobileNotificationFlowContext = {
  app?: {
    router?: {
      basename?: string;
    };
  };
  user?: {
    id?: unknown;
  };
  view?: {
    close?: unknown;
    preventClose?: boolean;
    navigation?: {
      back?: unknown;
    };
  };
};

function normalizeUserId(value: unknown) {
  if (value == null || value === '') return null;
  const userId = Number(value);
  return Number.isFinite(userId) ? userId : null;
}

function getEmbeddedViewBack(ctx: MobileNotificationFlowContext) {
  const view = ctx.view;
  if (view?.preventClose) {
    return undefined;
  }
  if (view && typeof view.close === 'function') {
    return () => (view.close as () => void).call(view);
  }
  const navigation = view?.navigation;
  if (navigation && typeof navigation.back === 'function') {
    return () => (navigation.back as () => void).call(navigation);
  }
  return undefined;
}

function handleKeyboardActivation(event: React.KeyboardEvent<HTMLElement>, onActivate: () => void | Promise<void>) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onActivate();
}

function stripBasenamePrefix(text: string, prefix: string): string {
  if (!prefix) return text;
  const suffix = text.slice(prefix.length);
  if (!text.startsWith(prefix)) return text;
  if (!suffix) return '/';
  if (suffix.startsWith('/')) return suffix;
  if (suffix.startsWith('?') || suffix.startsWith('#')) return `/${suffix}`;
  return text;
}

function formatRelativeTime(value?: string | number) {
  if (!value) return '';
  const timestamp = Number.parseInt(String(value), 10);
  return dayjs(Number.isNaN(timestamp) ? value : timestamp).fromNow(true);
}

function getMessageTargetUrl(message: Message) {
  const options = message.options ?? {};
  const mobileUrl = typeof options.mobileUrl === 'string' ? options.mobileUrl : undefined;
  const optionUrl = typeof options.url === 'string' ? options.url : undefined;
  const messageUrl = typeof message.url === 'string' ? message.url : undefined;
  return mobileUrl || optionUrl || messageUrl;
}

function MobileLoadMore({
  hasMore,
  loading,
  status,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  status: LoadMoreStatus;
  onLoadMore: () => void;
}) {
  const { t } = useInAppMessageTranslation();
  const { token } = theme.useToken();

  if (status === 'failure') {
    return (
      <Flex align="center" gap={token.marginXS} justify="center" style={{ padding: token.paddingSM }}>
        <Typography.Text type="secondary">{t('Loading failed,')}</Typography.Text>
        <Button size="small" type="link" onClick={onLoadMore}>
          {t('please reload')}
        </Button>
      </Flex>
    );
  }

  if (hasMore) {
    return (
      <Flex justify="center" style={{ padding: token.paddingSM }}>
        <Button loading={loading} size="small" type="link" onClick={onLoadMore}>
          {t('Loading more')}
        </Button>
      </Flex>
    );
  }

  return (
    <Flex justify="center" style={{ padding: token.paddingSM }}>
      <Typography.Text type="secondary">{t('No more')}</Typography.Text>
    </Flex>
  );
}

function MobileNotificationContentInner() {
  const { t } = useInAppMessageTranslation();
  const compileT = useT();
  const ctx = useFlowContext() as MobileNotificationFlowContext;
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const currentUserId = normalizeUserId(ctx.user?.id);
  const embeddedViewBack = getEmbeddedViewBack(ctx);
  const [view, setView] = useState<MobileNotificationView>('channels');
  const [channelLoadStatus, setChannelLoadStatus] = useState<LoadMoreStatus>('success');
  const [messageLoadStatus, setMessageLoadStatus] = useState<LoadMoreStatus>('success');
  const channelListRef = useRef<HTMLDivElement>(null);
  const statusTabRefs = useRef(new Map<ChannelStatus, HTMLButtonElement>());
  const channelLoadMoreRequestSeqRef = useRef(0);
  const messageLoadMoreRequestSeqRef = useRef(0);

  const channels = channelListObs.value;
  const messages = selectedMessageListObs.value;
  const selectedChannelName = selectedChannelNameObs.value;
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.name === selectedChannelName),
    [channels, selectedChannelName],
  );
  const basename = (ctx.app?.router?.basename ?? '').replace(/\/+$/, '');
  const headerClassName = useMemo(
    () => css`
      display: flex;
      align-items: center;
      min-height: ${MOBILE_NOTIFICATION_TAB_HEIGHT}px;
      background: ${token.colorBgContainer};
      border-bottom: ${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary};

      .mobile-notification-tabs {
        display: flex;
        flex: 1;
        align-items: center;
        min-width: 0;
        min-height: ${MOBILE_NOTIFICATION_TAB_HEIGHT}px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }

      .mobile-notification-tabs::-webkit-scrollbar {
        display: none;
      }

      .mobile-notification-tab {
        position: relative;
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        height: ${MOBILE_NOTIFICATION_TAB_HEIGHT}px;
        padding: 0 ${token.paddingSM}px;
        color: ${token.colorText};
        font: inherit;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: 0;
      }

      .mobile-notification-tab-active,
      .mobile-notification-tab:hover,
      .mobile-notification-tab:focus-visible {
        color: ${token.colorPrimary};
      }

      .mobile-notification-tab-active::after {
        position: absolute;
        right: ${token.paddingXS}px;
        bottom: 0;
        left: ${token.paddingXS}px;
        height: 2px;
        background: ${token.colorPrimary};
        content: '';
      }
    `,
    [
      token.colorBgContainer,
      token.colorBorderSecondary,
      token.colorPrimary,
      token.colorText,
      token.lineType,
      token.lineWidth,
      token.paddingSM,
      token.paddingXS,
    ],
  );
  const backButtonClassName = useMemo(
    () => css`
      &.ant-btn {
        width: 40px;
        min-width: 40px;
        height: 40px;
        padding: 0;
        color: ${token.colorTextSecondary};
        border-radius: ${token.borderRadiusLG}px;
        font-size: 20px;
        line-height: 1;
      }

      &.ant-btn .anticon {
        font-size: 20px;
      }

      &.ant-btn:hover,
      &.ant-btn:focus-visible,
      &.ant-btn:active {
        color: ${token.colorText};
        background: ${token.colorFillTertiary};
      }
    `,
    [token.borderRadiusLG, token.colorFillTertiary, token.colorText, token.colorTextSecondary],
  );
  const listItemClassName = useMemo(
    () => css`
      &.ant-list-item {
        min-height: 76px;
        padding: ${token.paddingSM}px ${token.paddingMD}px;
        background: ${token.colorBgContainer};
        border-block-end: ${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary};
        cursor: pointer;
      }

      &.ant-list-item:hover {
        background: ${token.colorFillQuaternary};
      }

      &.ant-list-item:focus-visible {
        outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
        outline-offset: -${token.lineWidthFocus}px;
      }
    `,
    [
      token.colorBgContainer,
      token.colorBorderSecondary,
      token.colorFillQuaternary,
      token.colorPrimaryBorder,
      token.lineType,
      token.lineWidth,
      token.lineWidthFocus,
      token.paddingMD,
      token.paddingSM,
    ],
  );

  useEffect(() => {
    userIdObs.value = currentUserId ?? null;
  }, [currentUserId]);

  useEffect(() => {
    fetchChannels({ limit: 30 }).catch((error) => {
      console.error('Failed to fetch mobile notification channels', error);
    });
  }, []);

  const statusTabs = useMemo(
    () => [
      { label: t('All'), key: 'all' as ChannelStatus },
      { label: t('Unread'), key: 'unread' as ChannelStatus },
      { label: t('Read'), key: 'read' as ChannelStatus },
    ],
    [t],
  );

  const onStatusChange = useMemoizedFn((key: ChannelStatus) => {
    channelListRef.current?.scrollTo?.({ top: 0 });
    if (channelListRef.current) {
      channelListRef.current.scrollTop = 0;
    }
    channelLoadMoreRequestSeqRef.current += 1;
    channelStatusFilterObs.value = key;
    selectedChannelNameObs.value = null;
    setChannelLoadStatus('success');
    setView('channels');
    fetchChannels({ limit: 30 }).catch((error) => {
      console.error('Failed to fetch mobile notification channels by status', error);
    });
  });

  const onStatusKeyDown = useMemoizedFn((event: React.KeyboardEvent<HTMLButtonElement>, currentKey: ChannelStatus) => {
    const currentIndex = statusTabs.findIndex(({ key }) => key === currentKey);
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % statusTabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + statusTabs.length) % statusTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = statusTabs.length - 1;
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextKey = statusTabs[nextIndex].key;
    onStatusChange(nextKey);
    statusTabRefs.current.get(nextKey)?.focus();
  });

  const onChannelClick = useMemoizedFn((channel: Channel) => {
    messageLoadMoreRequestSeqRef.current += 1;
    selectedChannelNameObs.value = channel.name;
    setMessageLoadStatus('success');
    setView('messages');
  });

  const navigateToMessageTarget = useMemoizedFn((url?: string) => {
    if (!url) return;
    if (url.startsWith('/m/')) {
      navigate(url.substring(2));
      return;
    }
    if (url.startsWith('/')) {
      navigate(stripBasenamePrefix(url, basename));
      return;
    }
    window.location.href = url;
  });

  const onMessageClick = useMemoizedFn(async (message: Message) => {
    try {
      await updateMessage({
        filterByTk: message.id,
        values: { status: 'read' },
      });
    } catch (error) {
      console.error('Failed to mark in-app message as read', error);
    }
    navigateToMessageTarget(getMessageTargetUrl(message));
  });

  const onLoadChannelsMore = useCallback(async () => {
    const requestSeq = ++channelLoadMoreRequestSeqRef.current;
    const filter: Record<string, unknown> = {};
    const lastChannel = channels[channels.length - 1];
    if (lastChannel?.latestMsgReceiveTimestamp) {
      filter.latestMsgReceiveTimestamp = {
        $lt: lastChannel.latestMsgReceiveTimestamp,
      };
    }
    try {
      setChannelLoadStatus('loading');
      await fetchChannels({ filter, limit: 30 });
      if (requestSeq !== channelLoadMoreRequestSeqRef.current) return;
      setChannelLoadStatus('success');
    } catch (error) {
      if (requestSeq !== channelLoadMoreRequestSeqRef.current) return;
      setChannelLoadStatus('failure');
      console.error('Failed to load more mobile notification channels', error);
    }
  }, [channels]);

  const onLoadMessagesMore = useCallback(async () => {
    if (!selectedChannelName) return;
    const requestSeq = ++messageLoadMoreRequestSeqRef.current;
    const filter: Record<string, unknown> = { channelName: selectedChannelName };
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      filter.receiveTimestamp = {
        $lt: lastMessage.receiveTimestamp,
      };
    }
    try {
      setMessageLoadStatus('loading');
      await fetchMessages({ filter, limit: 30 });
      if (requestSeq !== messageLoadMoreRequestSeqRef.current) return;
      setMessageLoadStatus('success');
    } catch (error) {
      if (requestSeq !== messageLoadMoreRequestSeqRef.current) return;
      setMessageLoadStatus('failure');
      console.error('Failed to load more mobile notification messages', error);
    }
  }, [messages, selectedChannelName]);

  const renderChannelList = () => (
    <>
      <div className={headerClassName}>
        {embeddedViewBack ? (
          <Button
            aria-label={t('Back')}
            className={backButtonClassName}
            icon={<LeftOutlined />}
            onClick={embeddedViewBack}
            type="text"
          />
        ) : null}
        <div aria-label={t('Notification')} className="mobile-notification-tabs" role="tablist">
          {statusTabs.map(({ key, label }) => {
            const active = channelStatusFilterObs.value === key;
            return (
              <button
                aria-controls="mobile-notification-channel-panel"
                aria-selected={active}
                className={`mobile-notification-tab${active ? ' mobile-notification-tab-active' : ''}`}
                id={`mobile-notification-tab-${key}`}
                key={key}
                onClick={() => onStatusChange(key)}
                onKeyDown={(event) => onStatusKeyDown(event, key)}
                ref={(element) => {
                  if (element) {
                    statusTabRefs.current.set(key, element);
                    return;
                  }
                  statusTabRefs.current.delete(key);
                }}
                role="tab"
                tabIndex={active ? 0 : -1}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        aria-labelledby={`mobile-notification-tab-${channelStatusFilterObs.value}`}
        id="mobile-notification-channel-panel"
        ref={channelListRef}
        role="tabpanel"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        tabIndex={0}
      >
        {channels.length === 0 && isFetchingChannelsObs.value ? (
          <Flex justify="center" style={{ paddingTop: token.paddingXXL }}>
            <Spin />
          </Flex>
        ) : channels.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: token.marginXL }} />
        ) : (
          <List
            dataSource={channels}
            split={false}
            renderItem={(channel) => {
              const title = compileT(channel.title || channel.name);
              const ariaLabel =
                channelStatusFilterObs.value !== 'read' && channel.unreadMsgCnt > 0
                  ? `${title}, ${t('Unread')}: ${channel.unreadMsgCnt}`
                  : title;
              return (
                <List.Item
                  aria-label={ariaLabel}
                  className={listItemClassName}
                  key={channel.name}
                  onClick={() => onChannelClick(channel)}
                  onKeyDown={(event) => handleKeyboardActivation(event, () => onChannelClick(channel))}
                  role="button"
                  tabIndex={0}
                >
                  <Flex align="center" gap={token.marginSM} style={{ width: '100%' }}>
                    <Flex gap={token.marginXXS} vertical style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                        <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
                          {title}
                        </Typography.Text>
                        <Typography.Text
                          style={{ fontSize: token.fontSizeSM, marginLeft: token.marginSM, whiteSpace: 'nowrap' }}
                          type="secondary"
                        >
                          {formatRelativeTime(channel.latestMsgReceiveTimestamp)}
                        </Typography.Text>
                      </Flex>
                      <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                        <Typography.Text
                          ellipsis
                          style={{ flex: 1, fontSize: token.fontSizeSM, minWidth: 0 }}
                          type="secondary"
                        >
                          {channel.latestMsgTitle}
                        </Typography.Text>
                        {channelStatusFilterObs.value !== 'read' && channel.unreadMsgCnt > 0 ? (
                          <Badge
                            count={channel.unreadMsgCnt}
                            overflowCount={99}
                            size="small"
                            style={{ marginLeft: token.marginSM }}
                          />
                        ) : null}
                      </Flex>
                    </Flex>
                    <RightOutlined
                      aria-hidden="true"
                      style={{ color: token.colorTextQuaternary, flex: 'none', fontSize: token.fontSizeSM }}
                    />
                  </Flex>
                </List.Item>
              );
            }}
          />
        )}
        {channels.length > 0 ? (
          <MobileLoadMore
            hasMore={showChannelLoadingMoreObs.value}
            loading={isFetchingChannelsObs.value || channelLoadStatus === 'loading'}
            status={channelLoadStatus}
            onLoadMore={onLoadChannelsMore}
          />
        ) : null}
      </div>
    </>
  );

  const renderMessageList = () => {
    const title = selectedChannel ? compileT(selectedChannel.title || selectedChannel.name) : t('Message');
    return (
      <>
        <Flex align="center" className={headerClassName}>
          <Button
            aria-label={t('Back')}
            className={backButtonClassName}
            icon={<LeftOutlined />}
            type="text"
            onClick={() => {
              setView('channels');
            }}
          />
          <Typography.Text strong ellipsis style={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Typography.Text>
          <span aria-hidden="true" style={{ display: 'inline-block', width: 40 }} />
        </Flex>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {messages.length === 0 && isFetchingMessageObs.value ? (
            <Flex justify="center" style={{ paddingTop: token.paddingXXL }}>
              <Spin />
            </Flex>
          ) : messages.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: token.marginXL }} />
          ) : (
            <List
              dataSource={messages}
              split={false}
              renderItem={(message) => {
                const targetUrl = getMessageTargetUrl(message);
                const ariaLabel = message.status === 'unread' ? `${t('Unread')}: ${message.title}` : message.title;
                return (
                  <List.Item
                    aria-label={ariaLabel}
                    className={listItemClassName}
                    key={message.id}
                    onClick={() => {
                      onMessageClick(message);
                    }}
                    onKeyDown={(event) => handleKeyboardActivation(event, () => onMessageClick(message))}
                    role="button"
                    tabIndex={0}
                  >
                    <Flex align="flex-start" gap={token.marginSM} style={{ width: '100%' }}>
                      <Badge dot={message.status === 'unread'} style={{ marginTop: token.marginXS }} />
                      <Flex gap={token.marginXXS} vertical style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="flex-start" justify="space-between" style={{ width: '100%' }}>
                          <Typography.Paragraph
                            ellipsis={{ rows: 2 }}
                            strong={message.status === 'unread'}
                            style={{
                              color: token.colorText,
                              flex: 1,
                              margin: 0,
                              minWidth: 0,
                            }}
                          >
                            {message.title}
                          </Typography.Paragraph>
                          <Typography.Text
                            style={{ fontSize: token.fontSizeSM, marginLeft: token.marginSM, whiteSpace: 'nowrap' }}
                            type="secondary"
                          >
                            {formatRelativeTime(message.receiveTimestamp)}
                          </Typography.Text>
                        </Flex>
                        <Typography.Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: token.fontSizeSM, margin: 0 }}
                          type="secondary"
                        >
                          {message.content}
                        </Typography.Paragraph>
                      </Flex>
                      {targetUrl ? (
                        <RightOutlined
                          aria-hidden="true"
                          style={{ color: token.colorTextQuaternary, flex: 'none', marginTop: token.marginXS }}
                        />
                      ) : null}
                    </Flex>
                  </List.Item>
                );
              }}
            />
          )}
          {messages.length > 0 ? (
            <MobileLoadMore
              hasMore={showMsgLoadingMoreObs.value}
              loading={isFetchingMessageObs.value || messageLoadStatus === 'loading'}
              status={messageLoadStatus}
              onLoadMore={onLoadMessagesMore}
            />
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div
      style={{
        background: token.colorBgContainer,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {view === 'channels' ? renderChannelList() : renderMessageList()}
    </div>
  );
}

export const MobileNotificationContent = observer(MobileNotificationContentInner, {
  displayName: 'MobileNotificationContent',
});

export default MobileNotificationContent;
