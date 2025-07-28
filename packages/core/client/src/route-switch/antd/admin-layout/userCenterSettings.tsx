/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserCenterButton } from './UserCenterButton';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { LanguageSettings } from './LanguageSettings';

const userCenterSettings = new SchemaSettings({
  name: 'userCenterSettings',
  Component: UserCenterButton,
  items: [
    {
      name: 'langue',
      Component: LanguageSettings,
      sort: 350,
    },
  ],
});

export { userCenterSettings };
