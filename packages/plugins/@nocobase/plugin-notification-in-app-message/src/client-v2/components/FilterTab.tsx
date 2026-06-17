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
import { Tabs } from 'antd';
import React, { useMemo } from 'react';
import { useInAppMessageTranslation } from '../locale';
import { channelStatusFilterObs, fetchChannels, type ChannelStatus } from '../state';

const InnerFilterTab = () => {
  const { t } = useInAppMessageTranslation();

  const items = useMemo(
    () => [
      { label: t('All'), key: 'all' as ChannelStatus },
      { label: t('Unread'), key: 'unread' as ChannelStatus },
      { label: t('Read'), key: 'read' as ChannelStatus },
    ],
    [t],
  );

  const onChange = useMemoizedFn(async (key: string) => {
    channelStatusFilterObs.value = key as ChannelStatus;
    try {
      await fetchChannels();
    } catch (error) {
      console.error('Failed to fetch channels for status filter', error);
    }
  });

  return <Tabs activeKey={channelStatusFilterObs.value} items={items} onChange={onChange} />;
};

export const FilterTab: React.FC = observer(InnerFilterTab, { displayName: 'FilterTab' });
export default FilterTab;
