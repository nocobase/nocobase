/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddNewActionModel, ViewActionModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export const createKanbanQuickCreateActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'KanbanQuickCreateActionModel',
  };
};

export const createKanbanCardViewActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'KanbanCardViewActionModel',
  };
};

export class KanbanQuickCreateActionModel extends AddNewActionModel {
  defaultPopupTitle = tExpr('Add new', { ns: 'kanban' });
}

KanbanQuickCreateActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createKanbanQuickCreateActionOptions();
  },
});

export class KanbanCardViewActionModel extends ViewActionModel {
  defaultPopupTitle = tExpr('Details');
}

KanbanCardViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createKanbanCardViewActionOptions();
  },
});
