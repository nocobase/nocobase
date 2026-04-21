/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { Document } from '@langchain/core/documents';
import { Readable } from 'node:stream';
import { SUPPORTED_DOCUMENT_EXTNAMES } from './constants';
import { ParseableFile } from './types';
import { resolveExtname } from './utils';
import { loadByWorker } from '@nocobase/ai';

export class DocumentLoader {
  constructor(private readonly fileManager: PluginFileManagerServer) {}

  async load(file: ParseableFile): Promise<Document[]> {
    const extname = resolveExtname(file);
    if (!SUPPORTED_DOCUMENT_EXTNAMES.includes(extname)) {
      return [];
    }

    const { stream, contentType } = await this.fileManager.getFileStream(file as any);
    const blob = await this.streamToBlob(stream, contentType ?? file.mimetype);
    return await loadByWorker(extname, blob);
  }

  private async streamToBlob(stream: Readable, mimeType = 'application/octet-stream') {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // @ts-ignore
    return new Blob(chunks, { type: mimeType });
  }
}
