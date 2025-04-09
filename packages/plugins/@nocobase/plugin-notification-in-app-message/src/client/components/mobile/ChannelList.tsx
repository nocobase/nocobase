/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { useApp } from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';
import { Badge, InfiniteScroll, List, ListRef } from 'antd-mobile';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { channelListObs, channelStatusFilterObs, fetchChannels, showChannelLoadingMoreObs } from '../../observables';
import InfiniteScrollContent from './InfiniteScrollContent';

const InternalChannelList = (props: { onClickItem?: (item: any) => void }) => {
  const app = useApp();
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
  const [fetctChannelsStatus, setFetchChannelsStatus] = useState<'success' | 'loading' | 'failure'>('success');

  const onLoadChannelsMore = async () => {
    try {
      setFetchChannelsStatus('loading');
      const filter: Record<string, any> = {};
      const lastChannel = channels[channels.length - 1];
      if (lastChannel?.latestMsgReceiveTimestamp) {
        filter.latestMsgReceiveTimestamp = {
          $lt: lastChannel.latestMsgReceiveTimestamp,
        };
      }
      const res = await fetchChannels({ filter, limit: 30 });
      setFetchChannelsStatus('success');
      return res;
    } catch {
      setFetchChannelsStatus('failure');
    }
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
          const channelTitle = Schema.compile(item.title, { t: app.i18n.t });
          return (
            <List.Item
              key={item.name}
              onClick={() => {
                if (props.onClickItem) {
                  props.onClickItem(item);
                } else {
                  navigate(`/page/in-app-message/messages?channel=${item.name}`);
                }
              }}
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>{item.latestMsgTitle}</div>
                  <div>
                    <Badge
                      style={{ border: 'none' }}
                      content={
                        channelStatusFilterObs.value !== 'read' && item.unreadMsgCnt > 0 ? item.unreadMsgCnt : null
                      }
                    ></Badge>
                  </div>
                </div>
              }
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div> {channelTitle}</div>
                <div style={{ color: 'var(--adm-color-weak)', fontSize: 'var(--adm-font-size-main)' }}>
                  {dayjs(item.latestMsgReceiveTimestamp).fromNow(true)}
                </div>
              </div>
            </List.Item>
          );
        })}
        <InfiniteScroll
          loadMore={onLoadChannelsMore}
          hasMore={fetctChannelsStatus !== 'failure' && showChannelLoadingMoreObs.value}
        >
          <InfiniteScrollContent
            loadMoreStatus={fetctChannelsStatus}
            hasMore={showChannelLoadingMoreObs.value}
            retry={onLoadChannelsMore}
          />
        </InfiniteScroll>
      </List>
    </>
  );
};

export const ChannelList = observer(InternalChannelList, { displayName: 'ChannelList' });
