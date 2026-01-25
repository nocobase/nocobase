/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel, TableBlockModel } from '@nocobase/client';

export class CustomActionGroupTableBlockModel extends TableBlockModel {
  customModelClasses = {
    CollectionActionGroupModel: 'CustomActionGroupTableCollectionActionGroupModel',
    RecordActionGroupModel: 'CustomActionGroupTableRecordActionGroupModel',
  };
}

export class CustomActionGroupTableCollectionActionGroupModel extends ActionGroupModel {}
export class CustomActionGroupTableRecordActionGroupModel extends ActionGroupModel {}

export class CustomActionGroupTableAction1Model extends ActionModel {}
export class CustomActionGroupTableAction2Model extends ActionModel {}

CustomActionGroupTableCollectionActionGroupModel.registerActionModels({
  CustomActionGroupTableAction1Model,
});

CustomActionGroupTableRecordActionGroupModel.registerActionModels({
  CustomActionGroupTableAction2Model,
});
