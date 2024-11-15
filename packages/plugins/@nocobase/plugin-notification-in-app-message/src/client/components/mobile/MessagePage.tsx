/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Badge, InfiniteScroll, NavBar, DotLoading } from 'antd-mobile';
import { observer } from '@formily/reactive-react';
import { useCurrentUserContext, css } from '@nocobase/client';
import { useSearchParams } from 'react-router-dom';
import { dayjs } from '@nocobase/utils/client';

import {
  MobilePageHeader,
  MobilePageProvider,
  MobilePageContentContainer,
  useMobileTitle,
} from '@nocobase/plugin-mobile/client';
import {
  userIdObs,
  selectedChannelNameObs,
  selectedChannelObs,
  selectedMessageListObs,
  fetchChannels,
  updateMessage,
  fetchMessages,
  showMsgLoadingMoreObs,
} from '../../observables';
import { useLocalTranslation } from '../../../locale';
import InfiniteScrollContent from './InfiniteScrollContent';
const MobileMessagePageInner = () => {
  const { t } = useLocalTranslation();
  const navigate = useNavigate();
  const ctx = useCurrentUserContext();
  const [searchParams] = useSearchParams();
  const channelName = searchParams.get('channel');
  useEffect(() => {
    const effect = async () => {
      if (channelName) {
        await fetchChannels({ filter: { name: channelName } });
        selectedChannelNameObs.value = channelName;
      }
    };
    effect();
  }, [channelName]);

  const currUserId = ctx.data?.data?.id;
  useEffect(() => {
    userIdObs.value = currUserId ?? null;
  }, [currUserId]);
  const messages = selectedMessageListObs.value;
  const viewMessageDetail = (message) => {
    const url = message.options?.mobileUrl;
    if (url) {
      if (url.startsWith('/m/')) navigate(url.substring(2));
      else if (url.startsWith('/')) navigate(url);
      else {
        window.location.href = url;
      }
    }
  };
  const onMessageClick = (message) => {
    updateMessage({
      filterByTk: message.id,
      values: {
        status: 'read',
      },
    });
    viewMessageDetail(message);
  };
  const [fetchMsgStatus, setFecthMsgStatus] = useState<'success' | 'loading' | 'failure'>('success');

  const onLoadMessagesMore = useCallback(async () => {
    const filter: Record<string, any> = {};
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      filter.receiveTimestamp = {
        $lt: lastMessage.receiveTimestamp,
      };
    }
    if (selectedChannelNameObs.value) {
      filter.channelName = selectedChannelNameObs.value;
    }
    try {
      setFecthMsgStatus('loading');
      const res = await fetchMessages({ filter, limit: 30 });
      setFecthMsgStatus('success');
      return res;
    } catch {
      setFecthMsgStatus('failure');
    }
  }, [messages]);
  const title = selectedChannelObs.value?.title || t('Message');

  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <NavBar onBack={() => navigate('/page/in-app-message')}>{title}</NavBar>
      </MobilePageHeader>
      <MobilePageContentContainer>
        <div
          style={{ height: '100%', overflowY: 'auto' }}
          className={css({
            '.adm-list-item-content-main': {
              overflow: 'hidden',
              wordWrap: 'break-word',
            },
          })}
        >
          <List
            style={{
              '--border-top': 'none',
            }}
          >
            {messages.map((item) => {
              return (
                <List.Item
                  key={item.id}
                  prefix={
                    <div style={{ width: '15px' }}>
                      <Badge key={item.id} content={item.status === 'unread' ? Badge.dot : null} />
                    </div>
                  }
                  description={item.content}
                  extra={dayjs(item.receiveTimestamp).fromNow(true)}
                  onClick={() => {
                    onMessageClick(item);
                  }}
                  arrowIcon={item.options?.mobileUrl ? true : false}
                >
                  {item.title}
                </List.Item>
              );
            })}
            <InfiniteScroll
              loadMore={onLoadMessagesMore}
              hasMore={fetchMsgStatus !== 'failure' && showMsgLoadingMoreObs.value}
            >
              <InfiniteScrollContent
                loadMoreStatus={fetchMsgStatus}
                hasMore={showMsgLoadingMoreObs.value}
                retry={onLoadMessagesMore}
              />
            </InfiniteScroll>
          </List>
        </div>
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
};

export const MobileMessagePage = observer(MobileMessagePageInner, { displayName: 'MobileMessagePage' });
