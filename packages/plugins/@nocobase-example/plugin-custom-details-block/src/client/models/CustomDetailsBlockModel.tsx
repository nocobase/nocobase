/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsBlockModel } from '@nocobase/client';
import { tExpr } from '../locale';

export class CustomDetailsBlockModel extends DetailsBlockModel {}

CustomDetailsBlockModel.define({
  label: tExpr('Custom details'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
});
