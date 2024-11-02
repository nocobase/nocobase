/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef, useEffect } from 'react';
import { observer } from '@formily/reactive-react';
import { reaction } from '@formily/reactive';
import { List, Badge, InfiniteScroll, ListRef } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { channelListObs, channelStatusFilterObs, showChannelLoadingMoreObs, fetchChannels } from '../../observables';
const InternalChannelList = () => {
  const navigate = useNavigate();
  const channels = channelListObs.value;
  const listRef = useRef<ListRef>(null);
  useEffect(() => {
    const dispose = reaction(
      () => channelStatusFilterObs.value,
      () => {
        const ele = document.querySelector('.mobile-page-content');
        if (ele) ele.scrollTop = 0;
      },
    );
    return dispose;
  }, []);
  const onLoadChannelsMore = async () => {
    const filter: Record<string, any> = {};
    const lastChannel = channels[channels.length - 1];
    if (lastChannel?.latestMsgReceiveTimestamp) {
      filter.latestMsgReceiveTimestamp = {
        $lt: lastChannel.latestMsgReceiveTimestamp,
      };
    }
    return fetchChannels({ filter, limit: 30 });
  };
  return (
    <>
      <List
        ref={listRef}
        style={{
          '--border-top': 'none',
        }}
      >
        {channelListObs.value.map((item) => {
          return (
            <List.Item
              key={item.name}
              onClick={() => {
                navigate(`/page/in-app-message/messages?channel=${item.name}`);
              }}
              description={item.latestMsgTitle}
              extra={
                <Badge
                  style={{ border: 'none' }}
                  content={channelStatusFilterObs.value !== 'read' && item.unreadMsgCnt > 0 ? item.unreadMsgCnt : null}
                ></Badge>
              }
            >
              {item.title}
            </List.Item>
          );
        })}
        <InfiniteScroll loadMore={onLoadChannelsMore} hasMore={showChannelLoadingMoreObs.value}></InfiniteScroll>
      </List>
    </>
  );
};

export const ChannelList = observer(InternalChannelList, { displayName: 'ChannelList' });
