/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { useBackupsContext } from '../contexts';
import { useT } from '../locale';

export const RefreshBackups = () => {
  const t = useT();
  const { refresh, loading } = useBackupsContext();
  const Icon = loading ? LoadingOutlined : ReloadOutlined;

  return (
    <Button onClick={refresh} icon={<Icon />} disabled={loading}>
      {t('Refresh')}
    </Button>
  );
};
