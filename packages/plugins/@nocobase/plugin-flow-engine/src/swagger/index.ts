/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import flowSurfacesSwagger from './flow-surfaces';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - Flow engine plugin',
    version: '1.0.0',
  },
  ...flowSurfacesSwagger,
};
