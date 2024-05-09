/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function columns2Appends(columns, ctx) {
  const { resourceName } = ctx.action;
  const appends = new Set([]);
  for (const column of columns) {
    let collection = ctx.dataSource.collectionManager.getCollection(resourceName);
    const appendColumns = [];
    for (let i = 0, iLen = column.dataIndex.length; i < iLen; i++) {
      const field = collection.getField(column.dataIndex[i]);
      if (field?.target) {
        appendColumns.push(column.dataIndex[i]);
        collection = ctx.dataSource.collectionManager.getCollection(field.target);
      }
    }
    if (appendColumns.length > 0) {
      appends.add(appendColumns.join('.'));
    }
  }
  return Array.from(appends);
}
