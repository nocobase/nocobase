/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/reactive-react';

import { Layout, List, Badge, Button, Flex, Tabs, ConfigProvider, theme } from 'antd';
import { css } from '@emotion/css';
import { dayjs } from '@nocobase/utils/client';
import { useLocalTranslation } from '../../locale';

import {
  fetchChannels,
  selectedChannelNameObs,
  channelListObs,
  isFetchingChannelsObs,
  showChannelLoadingMoreObs,
  selectedMessageListObs,
  channelStatusFilterObs,
  ChannelStatus,
} from '../observables';

import MessageList from './MessageList';
import FilterTab from './FilterTab';

const InnerInboxContent = () => {
  const { token } = theme.useToken();
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

  return (
    <Layout style={{ height: '100%' }}>
      <Layout.Sider
        width={350}
        style={{
          height: '100%',
          overflowY: 'auto',
          background: token.colorBgContainer,
          padding: '0 15px',
          border: 'none',
        }}
      >
        <FilterTab />
        <List
          itemLayout="horizontal"
          dataSource={channels}
          loadMore={loadChannelsMore}
          style={{ paddingBottom: '20px' }}
          loading={channels.length === 0 && isFetchingChannelsObs.value}
          renderItem={(item) => {
            const titleColor = selectedChannelName === item.name ? token.colorPrimaryText : token.colorText;
            const textColor = selectedChannelName === item.name ? token.colorPrimaryText : token.colorTextTertiary;
            return (
              <List.Item
                className={css`
                &:hover {
                  background-color: ${token.colorBgTextHover}};
                }
              `}
                style={{
                  padding: '10px 10px',
                  color: titleColor,
                  ...(selectedChannelName === item.name ? { backgroundColor: token.colorPrimaryBg } : {}),
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
                      width: '120px',
                      fontWeight: 400,
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      color: textColor,
                    }}
                  >
                    {dayjs(item.latestMsgReceiveTimestamp).fromNow()}
                  </div>
                </Flex>
                <Flex justify="space-between" style={{ width: '100%', marginTop: token.margin }}>
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
                  {channelStatusFilterObs.value !== 'read' ? (
                    <Badge style={{ border: 'none' }} count={item.unreadMsgCnt}></Badge>
                  ) : null}
                </Flex>
              </List.Item>
            );
          }}
        />
      </Layout.Sider>
      <Layout.Content style={{ padding: token.paddingLG, height: '100%', overflowY: 'auto' }}>
        {selectedChannelName ? <MessageList /> : null}
      </Layout.Content>
    </Layout>
  );
};

export const InboxContent = observer(InnerInboxContent);
