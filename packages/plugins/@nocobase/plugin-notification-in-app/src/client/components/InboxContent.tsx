/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { observer } from '@formily/reactive-react';
import {
  Layout,
  List,
  Card,
  Descriptions,
  Badge,
  Button,
  Flex,
  Spin,
  Tag,
  Tabs,
  ConfigProvider,
  Typography,
  Tooltip,
} from 'antd';
import { css } from '@emotion/css';
import { dayjs } from '@nocobase/utils/client';
import { useNavigate } from 'react-router-dom';
import { useLocalTranslation } from '../../locale';

import {
  fetchChannels,
  selectedChannelNameObs,
  channelListObs,
  isFetchingChannelsObs,
  channelMapObs,
  showChannelLoadingMoreObs,
  fetchMessages,
  isFecthingMessageObs,
  selectedMessageListObs,
  showMsgLoadingMoreObs,
  updateMessage,
  inboxVisible,
  channelStatusFilterObs,
  ChannelStatus,
} from '../observables';

const InnerInboxContent = () => {
  const { t } = useLocalTranslation();
  const channels = channelListObs.value;
  const messages = selectedMessageListObs.value;
  const selectedChannelName = selectedChannelNameObs.value;

  const onLoadChannelsMore = () => {
    const filter: Record<string, any> = {};
    const lastChannel = channels[channels.length - 1];
    if (lastChannel?.latestMsgReceiveTimestamp) {
      filter.latestMsgReceiveTimestamp = {
        $lt: lastChannel.latestMsgReceiveTimestamp,
      };
    }
    fetchChannels({ filter, limit: 30 });
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

  const loadChannelsMore = showChannelLoadingMoreObs.value ? (
    <div
      style={{
        textAlign: 'center',
        marginTop: 12,
        height: 32,
        lineHeight: '32px',
      }}
    >
      <Button loading={isFetchingChannelsObs.value} onClick={onLoadChannelsMore}>
        {t('Loading more')}
      </Button>
    </div>
  ) : null;

  const MessageList = observer(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const navigate = useNavigate();
    const isFetchingMessages = isFecthingMessageObs.value;
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
    return (
      <ConfigProvider
        theme={{
          components: { Badge: { dotSize: 8 } },
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 12 }}>
          {channelMapObs.value[selectedChannelName].title}
        </Typography.Title>

        {messages.length === 0 && isFecthingMessageObs.value ? (
          <Spin style={{ width: '100%', marginTop: '80px' }} />
        ) : (
          messages.map((message, index) => (
            <>
              <Card
                size={'small'}
                bordered={false}
                style={{ marginTop: 24, cursor: 'pointer' }}
                title={
                  <Tooltip title={message.title} mouseEnterDelay={0.5}>
                    <span style={{ fontWeight: message.status === 'unread' ? 'bold' : 'normal' }}>{message.title}</span>
                  </Tooltip>
                }
                onClick={() => {
                  onItemClicked(message);
                }}
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
                    <Tooltip title={message.content.length > 100 ? message.content : ''} mouseEnterDelay={0.5}>
                      {message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '')}{' '}
                    </Tooltip>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Datetime')}>
                    {dayjs(message.receiveTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('Status')}>
                    <Tag color={message.status === 'unread' ? 'red' : 'green'}>{msgStatusDict[message.status]}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          ))
        )}
        {showMsgLoadingMoreObs.value && (
          <Button style={{ margin: '20px auto 0 auto' }} onClick={onLoadMessagesMore} loading={isFetchingMessages}>
            {t('Loading more')}
          </Button>
        )}
      </ConfigProvider>
    );
  });

  const FilterTab = () => {
    interface TabItem {
      label: string;
      key: ChannelStatus;
    }
    const items: Array<TabItem> = [
      { label: t('All'), key: 'all' },
      { label: t('Unread'), key: 'unread' },
      { label: t('Read'), key: 'read' },
    ];
    return (
      <ConfigProvider
        theme={{
          components: { Tabs: { horizontalItemMargin: '20px' } },
        }}
      >
        <Tabs
          activeKey={channelStatusFilterObs.value}
          items={items}
          onChange={(key: ChannelStatus) => {
            channelStatusFilterObs.value = key;
            fetchChannels({});
          }}
        />
      </ConfigProvider>
    );
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Sider
        width={300}
        style={{ height: '100%', overflowY: 'auto', background: '#fff', padding: '0 15px', border: 'none' }}
      >
        <FilterTab />
        <List
          itemLayout="horizontal"
          dataSource={channels}
          loadMore={loadChannelsMore}
          style={{ paddingBottom: '20px' }}
          loading={channels.length === 0 && isFetchingChannelsObs.value}
          renderItem={(item) => {
            const titleColor = selectedChannelName === item.name ? '#1677ff' : 'black';
            const textColor = selectedChannelName === item.name ? '#1677ff' : 'rgba(0, 0, 0, 0.45)';
            return (
              <List.Item
                className={css`
                &:hover {
                  background-color: #e4e5e6};
                }
              `}
                style={{
                  padding: '10px 10px',
                  color: titleColor,
                  ...(selectedChannelName === item.name ? { backgroundColor: 'rgb(230, 244, 255)' } : {}),
                  height: '70px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onClick={() => {
                  selectedChannelNameObs.value = item.name;
                }}
              >
                <Flex justify="space-between" style={{ width: '100%' }}>
                  <div
                    style={{
                      width: '150px',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      width: '80px',
                      fontWeight: 400,
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      color: textColor,
                    }}
                  >
                    {dayjs(item.latestMsgReceiveTimestamp).format('MM-DD')}
                  </div>
                </Flex>
                <Flex justify="space-between" style={{ width: '100%' }}>
                  <div
                    style={{
                      width: '80%',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: textColor,
                    }}
                  >
                    {' '}
                    {item.latestMsgTitle}
                  </div>
                  <Badge count={item.unreadMsgCnt}></Badge>
                </Flex>
              </List.Item>
            );
          }}
        />
      </Layout.Sider>
      <Layout.Content style={{ padding: '0 24px 30px 24px', height: '100%', overflowY: 'auto' }}>
        {selectedChannelName ? <MessageList /> : null}
      </Layout.Content>
    </Layout>
  );
};

export const InboxContent = observer(InnerInboxContent);
