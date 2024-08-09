/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';
import { usePluginTranslation } from '../../locale';

export const MobileSettingsBlockSchemaSettings = new SchemaSettings({
  name: 'blockSettings:mobileSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        const { t } = usePluginTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete settings block'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
