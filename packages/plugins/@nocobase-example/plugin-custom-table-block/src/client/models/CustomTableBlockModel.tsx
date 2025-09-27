/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionActionGroupModel,
  RecordActionGroupModel,
  TableAssociationFieldGroupModel,
  TableBlockModel,
  TableColumnModel,
} from '@nocobase/client';

export class CustomTableBlockModel extends TableBlockModel {
  customModelClasses = {
    CollectionActionGroupModel: 'CustomTableCollectionActionGroupModel',
    RecordActionGroupModel: 'CustomTableRecordActionGroupModel',
    TableColumnModel: 'CustomTableColumnModel',
    TableAssociationFieldGroupModel: null,
    // TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
  };
}

export class CustomTableCollectionActionGroupModel extends CollectionActionGroupModel {}
export class CustomTableRecordActionGroupModel extends RecordActionGroupModel {}
export class CustomTableColumnModel extends TableColumnModel {}
export class CustomTableAssociationFieldGroupModel extends TableAssociationFieldGroupModel {}

// CustomTableAssociationFieldGroupModel.define({
//   hide: true,
// });
