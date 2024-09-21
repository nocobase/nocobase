/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface CollectionRecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: CollectionRecord<ParentDataType>;
}

export class CollectionRecord<DataType = any, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: CollectionRecord<ParentDataType>;
  public isNew?: boolean;
  constructor(options: CollectionRecordOptions<DataType, ParentDataType>) {
    const { data, parentRecord, isNew } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: CollectionRecord<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
