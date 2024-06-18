/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FieldNameExistsError extends Error {
  value: string;
  collectionName: string;

  constructor(value: string, collectionName: string) {
    super(`Field name "${value}" already exists in collection "${collectionName}"`);
    this.value = value;
    this.collectionName = collectionName;

    this.name = 'FieldNameExistsError';
  }
}
