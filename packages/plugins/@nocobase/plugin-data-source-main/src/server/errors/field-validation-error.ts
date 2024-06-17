/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FieldValidationError extends Error {
  constructor(errorFieldKey: string, errorFieldValue: string, collectionName: string) {
    super(`Field validation error: ${errorFieldKey} ${errorFieldValue} in collection ${collectionName}`);
    this.name = 'FieldValidationError';
  }
}
