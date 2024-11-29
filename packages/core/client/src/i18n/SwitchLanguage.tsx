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
import { useAPIClient } from '../api-client';
import languageCodes from '../locale';
import { useSystemSettings } from '../system-settings';

export function SwitchLanguage() {
  const { data } = useSystemSettings() || {};
  const api = useAPIClient();
  return (
    data?.data?.enabledLanguages.length > 1 && (
      <Dropdown
        menu={{
          onClick(info) {
            api.auth.setLocale(info.key);
            window.location.reload();
          },
          selectable: true,
          defaultSelectedKeys: [api.auth.locale],
          items: data?.data?.enabledLanguages?.map((code) => {
            return {
              key: code,
              label: languageCodes[code].label,
            };
          }),
        }}
      >
        <TranslationOutlined style={{ fontSize: 24 }} />
      </Dropdown>
    )
  );
}
