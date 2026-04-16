/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ViewActionModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';

export const createKanbanCardViewActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'KanbanCardViewActionModel',
  };
};

export class KanbanCardViewActionModel extends ViewActionModel {
  defaultPopupTitle = tExpr('View record', { ns: 'kanban' });
}

KanbanCardViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createKanbanCardViewActionOptions();
  },
});
