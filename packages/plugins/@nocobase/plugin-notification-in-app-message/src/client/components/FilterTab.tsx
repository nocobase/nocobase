/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tabs, ConfigProvider } from 'antd';
import { observer } from '@formily/reactive-react';
import { fetchChannels, channelStatusFilterObs, ChannelStatus } from '../observables';
import { useLocalTranslation } from '../../locale';

const _FilterTab = () => {
  const { t } = useLocalTranslation();
  interface TabItem {
    label: string;
    key: ChannelStatus;
  }
  const items: Array<TabItem> = [
    { label: t('All'), key: 'all' },
    { label: t('Unread'), key: 'unread' },
    { label: t('Read'), key: 'read' },
  ];
  return (
    <ConfigProvider
      theme={{
        components: { Tabs: { horizontalItemMargin: '20px' } },
      }}
    >
      <Tabs
        activeKey={channelStatusFilterObs.value}
        items={items}
        onChange={(key: ChannelStatus) => {
          channelStatusFilterObs.value = key;
          fetchChannels({});
        }}
      />
    </ConfigProvider>
  );
};

const FilterTab = observer(_FilterTab);
export default FilterTab;
