/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Badge, Card, Grid } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { observer } from '@formily/reactive-react';
import { useCurrentUserContext } from '@nocobase/client';
import { useSearchParams } from 'react-router-dom';
import { dayjs } from '@nocobase/utils/client';
import {
  MobilePageHeader,
  MobilePageNavigationBar,
  MobilePageProvider,
  MobilePageContentContainer,
} from '@nocobase/plugin-mobile/client';
import {
  userIdObs,
  selectedChannelNameObs,
  selectedMessageListObs,
  fetchChannels,
  updateMessage,
} from '../../observables';
import { useLocalTranslation } from '../../../locale';
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
    if (message.options?.url) {
      const url = message.options.mobileUrl;
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
  const Item = ({ label, value }) => (
    <>
      <Grid.Item span={3} style={{ color: 'var(--adm-color-text-secondary' }}>
        {label}
      </Grid.Item>
      <Grid.Item span={9}>{value}</Grid.Item>
    </>
  );

  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <MobilePageNavigationBar />
      </MobilePageHeader>
      <MobilePageContentContainer>
        <div style={{ height: '100%', overflowY: 'auto', background: 'var(--adm-color-light)', padding: '20px' }}>
          {messages.map((item) => {
            return (
              <Card
                key={item.id}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                      key={item.id}
                      content={item.status === 'unread' ? Badge.dot : null}
                      style={{ marginRight: '5px' }}
                    />
                    <div>{item.title}</div>
                  </div>
                }
                extra={<RightOutline />}
                onHeaderClick={() => {
                  onMessageClick(item);
                }}
                style={{ marginBottom: '20px' }}
              >
                <Grid columns={12} gap={8}>
                  <Item label={t('Content')} value={item.content} />
                  <Item label={t('Datetime')} value={dayjs(item.receiveTimestamp).fromNow()}></Item>
                </Grid>
              </Card>
            );
          })}
        </div>
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
};

export const MobileMessagePage = observer(MobileMessagePageInner, { displayName: 'MobileMessagePage' });
