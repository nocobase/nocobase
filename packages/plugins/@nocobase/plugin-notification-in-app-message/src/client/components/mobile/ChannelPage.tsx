/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useCallback } from 'react';
import { Tabs } from 'antd-mobile';
import { observer } from '@formily/reactive-react';
import { useCurrentUserContext, css } from '@nocobase/client';
import {
  MobilePageHeader,
  MobilePageNavigationBar,
  MobilePageProvider,
  MobilePageContentContainer,
} from '@nocobase/plugin-mobile/client';
import { userIdObs, fetchChannels, ChannelStatus, channelStatusFilterObs } from '../../observables';
import { ChannelList } from './ChannelList';
import { useLocalTranslation } from '../../../locale';
const MobileMessageBoxInner = () => {
  const { t } = useLocalTranslation();
  const ctx = useCurrentUserContext();
  const currUserId = ctx.data?.data?.id;
  useEffect(() => {
    userIdObs.value = currUserId ?? null;
  }, [currUserId]);
  useEffect(() => {
    fetchChannels({});
  }, []);
  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <MobilePageNavigationBar />
        <Tabs
          className={css({
            '.adm-tabs-header': {
              borderBottomWidth: 0,
            },
            '.adm-tabs-tab': {
              height: 49,
              padding: '10px 0 10px',
            },
          })}
          activeKey={channelStatusFilterObs.value}
          activeLineMode={'auto'}
          onChange={(key: ChannelStatus) => {
            channelStatusFilterObs.value = key;
            fetchChannels({});
          }}
        >
          <Tabs.Tab title={t('All')} key="all" />
          <Tabs.Tab title={t('Unread')} key="unread" />
          <Tabs.Tab title={t('Read')} key="read" />
        </Tabs>
      </MobilePageHeader>
      <MobilePageContentContainer>
        <ChannelList />
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
};

export const MobileChannelPage = observer(MobileMessageBoxInner, { displayName: 'MobileChannelPage' });
