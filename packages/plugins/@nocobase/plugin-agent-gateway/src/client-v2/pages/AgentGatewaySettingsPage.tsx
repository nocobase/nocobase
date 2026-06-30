/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Empty, Tabs, Typography } from 'antd';
import { useT } from '../locale';

const PLACEHOLDER_KEYS = ['Nodes', 'Profiles', 'Runs', 'Prompt Templates', 'Dispatch Bindings'];

export default function AgentGatewaySettingsPage() {
  const t = useT();

  return (
    <section aria-label={t('Agent Gateway')}>
      <Typography.Title level={3}>{t('Agent Gateway')}</Typography.Title>
      <Tabs
        items={PLACEHOLDER_KEYS.map((key) => ({
          key,
          label: t(key),
          children: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No records yet')} />,
        }))}
      />
    </section>
  );
}
