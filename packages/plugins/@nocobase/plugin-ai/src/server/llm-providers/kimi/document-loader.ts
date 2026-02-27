/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Document } from '@langchain/core/documents';
import { OpenAIClient } from '@langchain/openai';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { ParseableFile } from '../../document-loader/types';

export class KimiDocumentLoader {
  private readonly client: OpenAIClient;

  constructor(
    private readonly fileManager: PluginFileManagerServer,
    private readonly options: {
      apiKey?: string;
      baseURL?: string;
    },
  ) {
    this.client = this.createClient();
  }

  async load(file: ParseableFile): Promise<Document[]> {
    const text = await this.parseByApi(file);
    if (!text) {
      return [];
    }

    return [
      new Document({
        pageContent: text,
        metadata: {
          source: file.filename,
          extname: this.resolveExtname(file),
        },
      }),
    ];
  }

  resolveExtname(file: Pick<ParseableFile, 'extname' | 'filename'>): string {
    return (file.extname ?? path.extname(file.filename ?? '')).toLowerCase();
  }

  private async parseByApi(sourceFile: ParseableFile): Promise<string> {
    let uploadedFileId = '';
    const safeFilename = path.basename(sourceFile.filename || 'document');
    const tempFilePath = path.join(os.tmpdir(), `${sourceFile.id ?? Date.now()}.${Date.now()}.${safeFilename}`);
    try {
      const { stream } = await this.fileManager.getFileStream(sourceFile as any);
      await pipeline(stream, createWriteStream(tempFilePath));

      let uploaded: any;
      try {
        uploaded = await this.client.files.create({
          file: createReadStream(tempFilePath),
          // @ts-ignore
          purpose: 'file-extract',
        });
      } catch (error) {
        throw new Error(this.formatApiError(error, sourceFile, 'upload'));
      }

      uploadedFileId = uploaded?.id;
      if (!uploadedFileId) {
        throw new Error('Kimi files.create response missing id');
      }

      let parsedResponse: any;
      try {
        parsedResponse = await this.client.files.content(uploadedFileId);
      } catch (error) {
        throw new Error(this.formatApiError(error, sourceFile, 'extract'));
      }
      if (typeof parsedResponse?.text === 'function') {
        return await parsedResponse.text();
      }
      return typeof parsedResponse === 'string' ? parsedResponse : String(parsedResponse ?? '');
    } finally {
      await fs.rm(tempFilePath, { force: true });
      if (uploadedFileId) {
        await this.deleteRemoteFile(uploadedFileId);
      }
    }
  }

  private async deleteRemoteFile(fileId: string) {
    try {
      await this.client.files.delete(fileId);
    } catch (error) {
      // Ignore cleanup errors to avoid blocking main parsing flow.
    }
  }

  private formatApiError(error: any, sourceFile: ParseableFile, stage: 'upload' | 'extract') {
    const stageLabel = stage === 'upload' ? 'file upload' : 'file extraction';
    const message =
      error?.error?.message ??
      error?.response?.data?.error?.message ??
      error?.response?.data?.message ??
      error?.message ??
      String(error);
    return `Kimi ${stageLabel} failed for "${sourceFile.filename}": ${message}`;
  }

  private createClient(): OpenAIClient {
    const apiKey = this.options.apiKey;
    if (!apiKey) {
      throw new Error('Kimi provider apiKey is required for file parsing');
    }
    return new OpenAIClient({
      apiKey,
      baseURL: this.options.baseURL ?? 'https://api.moonshot.cn/v1',
    });
  }
}
