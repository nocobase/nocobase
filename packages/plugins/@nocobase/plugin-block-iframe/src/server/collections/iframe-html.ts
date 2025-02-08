/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'iframe-block.iframe-html-storage',
  dumpRules: 'required',
  name: 'iframeHtml',
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  updatedBy: true,
  shared: true,
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'text',
      name: 'html',
    },
  ],
} as CollectionOptions;
