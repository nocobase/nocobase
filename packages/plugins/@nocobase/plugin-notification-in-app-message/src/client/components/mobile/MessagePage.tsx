/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { css, useApp, useCurrentUserContext } from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';
import { Badge, InfiniteScroll, List, NavBar } from 'antd-mobile';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Schema } from '@formily/react';
import { MobilePageContentContainer, MobilePageHeader, MobilePageProvider } from '@nocobase/plugin-mobile/client';
import { useLocalTranslation } from '../../../locale';
import {
  fetchChannels,
  fetchMessages,
  inboxVisible,
  selectedChannelNameObs,
  selectedChannelObs,
  selectedMessageListObs,
  showMsgLoadingMoreObs,
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

const MobileMessagePageInner = (props: { displayPageHeader?: boolean }) => {
  const app = useApp();
  const basename = app.router.basename.replace(/\/+$/, '');
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
  const title = Schema.compile(selectedChannelObs.value?.title, { t: app.i18n.t }) || t('Message');

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
