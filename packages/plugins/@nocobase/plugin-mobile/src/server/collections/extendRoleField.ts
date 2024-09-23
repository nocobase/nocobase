/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'roles',
  fields: [
    {
      type: 'belongsToMany',
      name: 'mobileRoutes',
      target: 'mobileRoutes',
      through: 'rolesMobileRoutes',
      onDelete: 'CASCADE',
    },
    {
      type: 'boolean',
      name: 'allowNewMobileMenu',
    },
  ],
});
