/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, SchemaSettingsItem } from '@nocobase/client';
import { App } from 'antd';

export const ClearCache = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { modal } = App.useApp();
  return (
    <SchemaSettingsItem
      eventKey="cache"
      title="cache"
      onClick={async () => {
        modal.confirm({
          title: t('Clear cache'),
          content: t('Are you sure you want to clear cache ?'),
          okText: t('Clear'),
          okButtonProps: {
            danger: true,
          },
          onOk: async () => {
            await api.resource('app').clearCache();
            window.location.reload();
          },
        });
      }}
    >
      {t('Clear cache')}
    </SchemaSettingsItem>
  );
};
