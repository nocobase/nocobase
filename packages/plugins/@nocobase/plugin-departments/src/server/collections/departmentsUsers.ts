/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'departmentsUsers',
  dumpRules: 'required',
  migrationRules: ['schema-only'],
  fields: [
    {
      type: 'boolean',
      name: 'isOwner', // Weather the user is the owner of the department
      allowNull: false,
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'isMain', // Weather this is the main department of the user
      allowNull: false,
      defaultValue: false,
    },
  ],
});
