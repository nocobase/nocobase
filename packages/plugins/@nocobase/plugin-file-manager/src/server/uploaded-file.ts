/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Model } from '@nocobase/database';

type UploadedFile = {
  collectionName: string;
  path: string;
  filename: string;
  storageId: number;
};

// Keep upload provenance outside request values, including values used by nested association writes.
const uploadedFiles = new WeakMap<Context, UploadedFile>();

export function registerUploadedFile(ctx: Context, file: UploadedFile) {
  uploadedFiles.set(ctx, file);
}

export function consumeUploadedFile(ctx: Context, collectionName: string, model: Model) {
  const file = uploadedFiles.get(ctx);
  if (
    !file ||
    file.collectionName !== collectionName ||
    file.path !== model.get('path') ||
    file.filename !== model.get('filename') ||
    String(file.storageId) !== String(model.get('storageId'))
  ) {
    return false;
  }
  uploadedFiles.delete(ctx);
  return true;
}
