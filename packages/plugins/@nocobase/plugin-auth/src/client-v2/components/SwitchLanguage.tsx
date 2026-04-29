/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TranslationOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import React from 'react';
import { useApp } from '@nocobase/client-v2';
import { useSystemSettings } from '@nocobase/client-v2';

const languageLabels: Record<string, string> = {
  'en-US': 'English',
  'zh-CN': '简体中文',
};

export default function SwitchLanguage() {
  const app = useApp();
  const { data } = useSystemSettings() || {};
  const enabledLanguages = data?.data?.enabledLanguages || [];

  if (enabledLanguages.length <= 1) {
    return null;
  }

  return (
    <Dropdown
      menu={{
        selectable: true,
        defaultSelectedKeys: [app.apiClient.auth.locale],
        items: enabledLanguages.map((code: string) => ({
          key: code,
          label: languageLabels[code] || code,
        })),
        onClick: ({ key }) => {
          app.apiClient.auth.setLocale(String(key));
          window.location.reload();
        },
      }}
    >
      <TranslationOutlined style={{ fontSize: 20, color: 'inherit' }} />
    </Dropdown>
  );
}
