/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'blockTemplateLinks',
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    {
      type: 'string',
      name: 'templateKey',
    },
    {
      type: 'belongsTo',
      name: 'templateBlock',
      target: 'uiSchemas',
      foreignKey: 'templateBlockUid',
      targetKey: 'x-uid',
    },
    {
      type: 'belongsTo',
      name: 'block',
      target: 'uiSchemas',
      foreignKey: 'blockUid',
      targetKey: 'x-uid',
    },
  ],
});
