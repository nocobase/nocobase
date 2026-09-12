/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TranslationOutlined } from '@ant-design/icons';
import { Dropdown, theme } from 'antd';
import React from 'react';
import { useApp } from '../hooks/useApp';
import { useSystemSettings } from '../flow/system-settings';
import languageCodes from '../locale/languageCodes';

export function SwitchLanguage() {
  const app = useApp();
  const { token } = theme.useToken();
  const { data } = useSystemSettings() || {};
  const enabledLanguages: string[] = data?.data?.enabledLanguages || [];

  if (enabledLanguages.length <= 1) {
    return null;
  }

  const items = enabledLanguages
    .filter((code) => languageCodes[code])
    .map((code) => ({ key: code, label: languageCodes[code].label }));

  return (
    <Dropdown
      menu={{
        selectable: true,
        defaultSelectedKeys: [app.apiClient.auth.locale],
        items,
        onClick: ({ key }) => {
          app.apiClient.auth.setLocale(String(key));
          window.location.reload();
        },
      }}
    >
      <TranslationOutlined style={{ fontSize: token.fontSizeXL, color: 'inherit' }} />
    </Dropdown>
  );
}

export default SwitchLanguage;
