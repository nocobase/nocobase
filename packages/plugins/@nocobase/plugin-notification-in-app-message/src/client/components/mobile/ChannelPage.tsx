/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { css, useCurrentUserContext } from '@nocobase/client';
import {
  MobilePageContentContainer,
  MobilePageHeader,
  MobilePageNavigationBar,
  MobilePageProvider,
} from '@nocobase/plugin-mobile/client';
import { Tabs } from 'antd-mobile';
import React, { useEffect } from 'react';
import { useLocalTranslation } from '../../../locale';
import { ChannelStatus, channelStatusFilterObs, fetchChannels, userIdObs } from '../../observables';
import { ChannelList } from './ChannelList';
const MobileMessageBoxInner = (props: { displayNavigationBar?: boolean; onClickItem?: (item: any) => void; }) => {
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
    <MobilePageProvider displayNavigationBar={props.displayNavigationBar}>
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
        <ChannelList onClickItem={props.onClickItem} />
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
};

export const MobileChannelPage = observer(MobileMessageBoxInner, { displayName: 'MobileChannelPage' });
