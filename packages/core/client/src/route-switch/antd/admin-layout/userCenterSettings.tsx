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
import { UserCenterButton } from './UserCenterButton';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsItem } from '../../../schema-settings';
import { useAPIClient } from '../../../';
import { LanguageSettings } from '../../../user/LanguageSettings';

const ClearCache = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  return (
    <SchemaSettingsItem
      eventKey="cache"
      title="cache"
      onClick={async () => {
        await api.resource('app').clearCache();
        window.location.reload();
      }}
    >
      {t('Clear cache')}
    </SchemaSettingsItem>
  );
};

const RestartApplication = () => {
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
const userCenterSettings = new SchemaSettings({
  name: 'userCenterSettings',
  Component: UserCenterButton,
  items: [
    {
      name: 'langue',
      Component: LanguageSettings,
      sort: 350,
    },
    {
      name: 'divider4',
      type: 'divider',
      sort: 400,
    },
    {
      name: 'cache',
      Component: ClearCache,
      sort: 500,
    },
    {
      name: 'restartApplication',
      Component: RestartApplication,
      sort: 510,
    },
  ],
});

export { userCenterSettings };
