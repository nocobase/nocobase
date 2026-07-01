/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';

import { JsonRecord } from './types';

const MAX_INLINE_ARTIFACT_UPLOAD_BYTES = 512 * 1024;

export async function buildTextArtifactUpload(artifactPath: string, sizeBytes: number) {
  const bytesToRead = Math.min(Math.max(sizeBytes, 0), MAX_INLINE_ARTIFACT_UPLOAD_BYTES);
  let contentText = '';
  if (bytesToRead > 0) {
    const file = await fs.open(artifactPath, 'r');
    try {
      const buffer = Buffer.alloc(bytesToRead);
      const result = await file.read(buffer, 0, bytesToRead, 0);
      contentText = buffer.subarray(0, result.bytesRead).toString('utf8');
    } finally {
      await file.close();
    }
  }

  const metadata: JsonRecord = {
    originalSizeBytes: sizeBytes,
    uploadedBytes: Buffer.byteLength(contentText),
    truncated: sizeBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES,
  };

  return {
    contentText,
    metadata,
  };
}
