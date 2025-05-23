/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

/**
 * Collection for user information of extended authentication methods,
 * such as saml, oicd, oauth, sms, etc.
 */
export default defineCollection({
  migrationRules: ['schema-only', 'overwrite', 'skip'],
  name: 'usersVerifiers',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      name: 'uuid',
      interface: 'input',
      type: 'string',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("UUID")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'json',
      name: 'meta',
      defaultValue: {},
    },
  ],
});
