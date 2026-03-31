/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, EditFormModel } from '@nocobase/client';
import { tExpr } from '../locale';

export class CustomCreateFormBlockModel extends CreateFormModel {}

CustomCreateFormBlockModel.define({
  label: tExpr('Custom form (Add new)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});

export class CustomEditFormBlockModel extends EditFormModel {}

CustomEditFormBlockModel.define({
  label: tExpr('Custom form (Edit)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});
