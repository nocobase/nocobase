/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { useT } from '../locale';
import { associationRecordSettingItem } from './associationRecordSetting';
import { resetSettingItem } from './resetSetting';

export const templateBlockSettings = new SchemaSettings({
  name: 'templateSettings:blockItem',
  items: [
    {
      name: 'templateBlockSettings',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const t = useT();
        return {
          title: t('Template block settings'),
        };
      },
      useChildren() {
        return [resetSettingItem, associationRecordSettingItem];
      },
    },
  ],
});
