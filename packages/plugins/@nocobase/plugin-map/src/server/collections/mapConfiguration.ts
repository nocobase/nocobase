/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import { MapConfigurationCollectionName } from '../constants';

export default defineCollection({
  dumpRules: {
    group: 'third-party',
  },
  migrationRules: ['overwrite', 'schema-only'],
  name: MapConfigurationCollectionName,
  shared: true,
  fields: [
    {
      title: 'Access key',
      comment: '访问密钥',
      name: 'accessKey',
      type: 'string',
    },
    {
      title: 'securityJsCode',
      comment: 'securityJsCode or serviceHOST',
      name: 'securityJsCode',
      type: 'string',
    },
    {
      title: 'Map type',
      comment: '地图类型',
      name: 'type',
      type: 'string',
    },
  ],
});
