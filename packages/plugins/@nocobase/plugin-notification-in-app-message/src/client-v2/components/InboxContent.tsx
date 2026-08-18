/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { dayjs } from '@nocobase/utils/client';
import { Badge, Button, Flex, Layout, List, theme } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { useInAppMessageTranslation, useT } from '../locale';
import {
  channelListObs,
  channelStatusFilterObs,
  fetchChannels,
  inboxVisibleObs,
  isFetchingChannelsObs,
  selectedChannelNameObs,
  showChannelLoadingMoreObs,
} from '../state';
import FilterTab from './FilterTab';
import MessageList from './MessageList';

const InnerInboxContent = () => {
  const { t } = useInAppMessageTranslation();
  const compileT = useT();
  const { token } = theme.useToken();
  const channels = channelListObs.value;
  const selectedChannelName = selectedChannelNameObs.value;
  const visible = inboxVisibleObs.value;

  const onLoadChannelsMore = useCallback(() => {
    const filter: Record<string, any> = {};
    const lastChannel = channels[channels.length - 1];
    if (lastChannel?.latestMsgReceiveTimestamp) {
      filter.latestMsgReceiveTimestamp = { $lt: lastChannel.latestMsgReceiveTimestamp };
    }
    fetchChannels({ filter, limit: 30 }).catch((error) => {
      console.error('Failed to load more channels', error);
    });
  }, [channels]);

  const onSelectChannel = useMemoizedFn((name: string) => {
    selectedChannelNameObs.value = name;
  });

  useEffect(() => {
    if (!visible) return;
    fetchChannels({ limit: 30 }).catch((error) => {
      console.error('Failed to fetch channels on inbox open', error);
    });
  }, [visible]);

  const loadMoreNode = showChannelLoadingMoreObs.value ? (
    <div
      style={{
        textAlign: 'center',
        marginTop: token.marginSM,
        height: token.controlHeight,
        lineHeight: `${token.controlHeight}px`,
      }}
    >
      <Button loading={isFetchingChannelsObs.value} onClick={onLoadChannelsMore}>
        {t('Loading more')}
      </Button>
    </div>
  ) : null;

  return (
    <Layout style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Layout.Sider
        width={350}
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          background: token.colorBgContainer,
          padding: `0 ${token.paddingSM}px`,
          border: 'none',
        }}
      >
        <div
          data-testid="channel-list-panel"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
        >
          <FilterTab />
          <List
            itemLayout="horizontal"
            dataSource={channels}
            loadMore={loadMoreNode}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: token.paddingLG }}
            loading={channels.length === 0 && isFetchingChannelsObs.value}
            renderItem={(item) => {
              const title = compileT(item.title || item.name);
              const isActive = selectedChannelName === item.name;
              const titleColor = isActive ? token.colorPrimaryText : token.colorText;
              const textColor = isActive ? token.colorPrimaryText : token.colorTextTertiary;
              return (
                <List.Item
                  style={{
                    padding: `${token.paddingSM}px ${token.paddingSM}px`,
                    color: titleColor,
                    ...(isActive ? { backgroundColor: token.colorPrimaryBg } : {}),
                    cursor: 'pointer',
                    marginTop: token.marginSM,
                    border: 'none',
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => onSelectChannel(item.name)}
                >
                  <Flex justify="space-between" style={{ width: '100%' }}>
                    <div
                      style={{
                        flex: 1,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                      }}
                      title={title}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontWeight: 400,
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        color: textColor,
                        marginLeft: token.marginSM,
                      }}
                    >
                      {dayjs(Number.parseInt(String(item.latestMsgReceiveTimestamp), 10)).fromNow()}
                    </div>
                  </Flex>
                  <Flex justify="space-between" style={{ width: '100%', marginTop: token.marginXS }}>
                    <div
                      style={{
                        flex: 1,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        color: textColor,
                      }}
                    >
                      {item.latestMsgTitle}
                    </div>
                    {channelStatusFilterObs.value !== 'read' ? (
                      <Badge style={{ border: 'none' }} count={item.unreadMsgCnt} />
                    ) : null}
                  </Flex>
                </List.Item>
              );
            }}
          />
        </div>
      </Layout.Sider>
      <Layout.Content
        style={{
          padding: token.paddingLG,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          backgroundColor: token.colorBgLayout,
        }}
      >
        {selectedChannelName ? <MessageList /> : null}
      </Layout.Content>
    </Layout>
  );
};

export const InboxContent = observer(InnerInboxContent, { displayName: 'InboxContent' });
export default InboxContent;
