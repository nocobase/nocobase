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
import { App } from 'antd';
import { useAPIClient, SchemaSettingsItem } from '@nocobase/client';

export const RestartApplication = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { modal } = App.useApp();
  return (
    <SchemaSettingsItem
      eventKey="restartApplication"
      title="restartApplication"
      onClick={async () => {
        modal.confirm({
          title: t('Restart application'),
          // content: t('The will interrupt service, it may take a few seconds to restart. Are you sure to continue?'),
          okText: t('Restart'),
          okButtonProps: {
            danger: true,
          },
          onOk: async () => {
            await api.resource('app').restart();
          },
        });
      }}
    >
      {t('Restart application')}
    </SchemaSettingsItem>
  );
};
