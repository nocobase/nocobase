/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItemType, useSchemaSettings } from '@nocobase/client';

export const resetSettingItem = () => ({
  type: 'item',
  title: '重置',
  Component: () => null,
  useVisible() {
    const ctx = useSchemaSettings();
    return !!ctx?.fieldSchema?.['x-template-root-uid'];
  },
  useComponentProps() {
    return {};
  },
});
