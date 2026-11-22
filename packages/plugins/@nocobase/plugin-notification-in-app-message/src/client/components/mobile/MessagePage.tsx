/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { css, useApp, useCurrentUserContext } from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';
import { Badge, InfiniteScroll, List, NavBar } from 'antd-mobile';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Schema } from '@formily/react';
import { MobilePageContentContainer, MobilePageHeader, MobilePageProvider } from '@nocobase/plugin-mobile/client';
import { useLocalTranslation } from '../../../locale';
import {
  channelMapObs,
  channelStatusFilterObs,
  fetchChannels,
  fetchMessages,
  getChannelMessages,
  hasMoreChannelMessages,
  inboxVisible,
  selectedChannelNameObs,
  updateMessage,
  userIdObs,
} from '../../observables';
import InfiniteScrollContent from './InfiniteScrollContent';

function removeStringIfStartsWith(text: string, prefix: string): string {
  if (text.startsWith(prefix)) {
    return text.slice(prefix.length);
  }
  return text;
}

const MobileMessagePageInner = (props: { displayPageHeader?: boolean; channelName?: string }) => {
  const app = useApp();
  const basename = app.router.basename.replace(/\/+$/, '');
  const { t } = useLocalTranslation();
  const navigate = useNavigate();
  const ctx = useCurrentUserContext();
  const [searchParams] = useSearchParams();
  const routeChannelName = props.channelName ? null : searchParams.get('channel');
  useEffect(() => {
    const effect = async () => {
      if (routeChannelName) {
        await fetchChannels({ filter: { name: routeChannelName } });
        selectedChannelNameObs.value = routeChannelName;
      }
    };
    effect();
  }, [routeChannelName]);

  const currUserId = ctx.data?.data?.id;
  useEffect(() => {
    userIdObs.value = currUserId ?? null;
  }, [currUserId]);
  const channelName = props.channelName ?? selectedChannelNameObs.value;
  const messages = getChannelMessages(channelName);
  const hasMore = hasMoreChannelMessages(channelName, messages.length);
  const viewMessageDetail = (message) => {
    const url = message.options?.mobileUrl || message.options?.url;
    if (url) {
      if (url.startsWith('/m/')) navigate(url.substring(2));
      else if (url.startsWith('/')) {
        navigate(removeStringIfStartsWith(url, basename));
        inboxVisible.value = false;
      } else {
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
  const [fetchMsgStatus, setFetchMsgStatus] = useState<'success' | 'loading' | 'failure'>(
    props.channelName ? 'loading' : 'success',
  );
  const [failedBefore, setFailedBefore] = useState<string | number>();
  const loadMessages = useCallback(
    async (before?: string | number) => {
      if (!channelName) return;
      const filter = before === undefined ? { channelName } : { channelName, receiveTimestamp: { $lt: before } };
      try {
        setFetchMsgStatus('loading');
        await fetchMessages({ filter, limit: 30 });
        setFetchMsgStatus('success');
      } catch {
        setFailedBefore(before);
        setFetchMsgStatus('failure');
      }
    },
    [channelName],
  );

  const statusFilter = channelStatusFilterObs.value;
  useEffect(() => {
    if (props.channelName) loadMessages();
  }, [props.channelName, statusFilter, loadMessages]);

  const onLoadMessagesMore = () => loadMessages(messages[messages.length - 1]?.receiveTimestamp);
  const channel = channelName ? channelMapObs.value[channelName] : null;
  const title = Schema.compile(channel?.title, { t: app.i18n.t }) || t('Message');

  return (
    <MobilePageProvider displayPageHeader={props.displayPageHeader}>
      <MobilePageHeader>
        <NavBar className="nb-message-back-action" onBack={() => navigate('/page/in-app-message')}>
          {title}
        </NavBar>
      </MobilePageHeader>
      <MobilePageContentContainer displayPageHeader={props.displayPageHeader}>
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
              '--font-size': 'var(--adm-font-size-6)',
              // @ts-ignore
              '--adm-font-size-main': 'var(--adm-font-size-4)',
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
                  extra={
                    <span style={{ fontSize: 'var(--adm-font-size-main)' }}>
                      {dayjs(item.receiveTimestamp).fromNow(true)}
                    </span>
                  }
                  onClick={() => {
                    onMessageClick(item);
                  }}
                  arrowIcon={item.options?.mobileUrl ? true : false}
                >
                  {item.title}
                </List.Item>
              );
            })}
            <InfiniteScroll loadMore={onLoadMessagesMore} hasMore={fetchMsgStatus === 'success' && hasMore}>
              <InfiniteScrollContent
                loadMoreStatus={fetchMsgStatus}
                hasMore={hasMore || fetchMsgStatus === 'failure'}
                retry={() => loadMessages(failedBefore)}
              />
            </InfiniteScroll>
          </List>
        </div>
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
};

export const MobileMessagePage = observer(MobileMessagePageInner, { displayName: 'MobileMessagePage' });
