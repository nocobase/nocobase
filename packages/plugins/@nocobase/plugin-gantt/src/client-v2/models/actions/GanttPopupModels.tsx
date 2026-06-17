/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum, PopupActionModel } from '@nocobase/client-v2';
import { tExpr } from '../../locale';

export const createGanttEventViewActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'GanttEventViewActionModel',
  };
};

class GanttPopupActionModel extends PopupActionModel {
  get collection() {
    return this.context.collection || this.context.blockModel?.collection;
  }

  getInputArgs() {
    const inputArgs = super.getInputArgs();
    const collection = this.collection;

    return {
      ...inputArgs,
      dataSourceKey: collection?.dataSourceKey,
      collectionName: collection?.name,
    };
  }
}

export class GanttEventViewActionModel extends GanttPopupActionModel {
  static scene: typeof ActionSceneEnum.record = ActionSceneEnum.record;

  defaultPopupTitle = tExpr('Details');

  getAclActionName(): any {
    return 'view';
  }
}

GanttEventViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createGanttEventViewActionOptions();
  },
});
