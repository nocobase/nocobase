/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'aiEmployees',
  fields: [
    {
      name: 'username',
      type: 'string',
      primaryKey: true,
    },
    {
      name: 'nickname',
      type: 'string',
      interface: 'input',
    },
    {
      name: 'avatar',
      type: 'string',
      interface: 'image',
    },
    {
      name: 'bio',
      type: 'string',
      interface: 'textarea',
    },
    {
      name: 'about',
      type: 'string',
      interface: 'textarea',
    },
    {
      name: 'greeting',
      type: 'string',
      interface: 'textarea',
    },
    {
      name: 'skills',
      type: 'jsonb',
    },
    {
      name: 'modelSettings',
      type: 'jsonb',
    },
  ],
};
