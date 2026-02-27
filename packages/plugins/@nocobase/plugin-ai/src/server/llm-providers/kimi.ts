/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI, OpenAIClient } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { Model } from '@nocobase/database';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import os from 'node:os';
import { LLMProvider, LLMProviderOptions } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { DOCUMENT_PARSE_META_KEY } from '../document-parser';
import { DocumentParseMeta, ParseableFile, ParsedDocumentResult } from '../document-parser/types';

const KIMI_DOCUMENT_PARSER_VERSION = 'kimi-v1';
const KIMI_PARSED_FILE_MIMETYPE = 'application/json';

class KimiFileParserManager {
  private readonly client: OpenAIClient;

  constructor(
    private readonly plugin: PluginAIServer,
    private readonly options: {
      apiKey?: string;
      baseURL?: string;
    },
  ) {
    this.client = this.createClient();
  }

  async load(file: ParseableFile): Promise<ParsedDocumentResult> {
    const sourceFile = this.toPlainObject(file);

    const cached = await this.loadFromCache(sourceFile);
    if (cached) {
      return cached;
    }

    try {
      const text = await this.parseByApi(sourceFile);
      const parsedFile = await this.persistParsedJson(sourceFile, text);
      await this.updateSourceMeta(sourceFile, {
        status: 'ready',
        parserVersion: KIMI_DOCUMENT_PARSER_VERSION,
        parsedFileId: parsedFile.id,
        parsedFilename: parsedFile.filename,
        parsedMimetype: KIMI_PARSED_FILE_MIMETYPE,
        updatedAt: new Date().toISOString(),
      });

      return {
        supported: Boolean(text),
        fromCache: false,
        text,
        documents: this.toTextDocuments(text, sourceFile),
        meta: {
          sourceFileId: sourceFile.id,
          parsedFileId: parsedFile.id,
        },
      };
    } catch (error) {
      await this.updateSourceMeta(sourceFile, {
        status: 'failed',
        parserVersion: KIMI_DOCUMENT_PARSER_VERSION,
        updatedAt: new Date().toISOString(),
        error: error?.message ?? String(error),
      });
      throw error;
    }
  }

  private async loadFromCache(sourceFile: ParseableFile): Promise<ParsedDocumentResult | null> {
    const meta = this.getParseMeta(sourceFile.meta);
    if (!meta || meta.status !== 'ready' || meta.parserVersion !== KIMI_DOCUMENT_PARSER_VERSION || !meta.parsedFileId) {
      return null;
    }

    const parsedModel = await this.aiFilesRepo.findById(meta.parsedFileId);
    if (!parsedModel) {
      return null;
    }

    const parsedFile = this.toPlainObject(parsedModel);
    const text = await this.readParsedJson(parsedFile);

    return {
      supported: Boolean(text),
      fromCache: true,
      text,
      documents: this.toTextDocuments(text, sourceFile),
      meta: {
        sourceFileId: sourceFile.id,
        parsedFileId: parsedFile.id,
      },
    };
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

  private async persistParsedJson(sourceFile: ParseableFile, payload: string) {
    const tempFilePath = path.join(os.tmpdir(), `${sourceFile.id ?? Date.now()}.${Date.now()}.parsed.json`);
    await fs.writeFile(tempFilePath, payload, 'utf-8');

    try {
      const storageName = await this.resolveStorageName(sourceFile);
      const created = await this.fileManager.createFileRecord({
        collectionName: 'aiFiles',
        filePath: tempFilePath,
        storageName,
        values: {
          title: `${sourceFile.title ?? sourceFile.filename ?? 'document'} (parsed)`,
          mimetype: KIMI_PARSED_FILE_MIMETYPE,
          meta: {
            parserVersion: KIMI_DOCUMENT_PARSER_VERSION,
            sourceFileId: sourceFile.id,
          },
        },
      });
      return this.toPlainObject(created);
    } finally {
      await fs.rm(tempFilePath, { force: true });
    }
  }

  private async readParsedJson(file: ParseableFile): Promise<string> {
    const { stream } = await this.fileManager.getFileStream(file as any);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  private async updateSourceMeta(sourceFile: ParseableFile, documentParse: DocumentParseMeta) {
    if (!sourceFile.id) {
      return;
    }

    const nextMeta = {
      ...(sourceFile.meta ?? {}),
      [DOCUMENT_PARSE_META_KEY]: documentParse,
    };
    await this.aiFilesRepo.update({
      filter: {
        id: sourceFile.id,
      },
      values: {
        meta: nextMeta,
      },
    });
  }

  private async deleteRemoteFile(fileId: string) {
    try {
      await this.client.files.delete(fileId);
    } catch (error) {
      // Ignore cleanup errors to avoid blocking main parsing flow.
    }
  }

  private async resolveStorageName(file: ParseableFile) {
    if (!file.storageId) {
      return undefined;
    }
    if (!this.fileManager.storagesCache.size) {
      await this.fileManager.loadStorages();
    }
    const storage = this.fileManager.storagesCache.get(file.storageId);
    return storage?.name;
  }

  private toTextDocuments(text: string, sourceFile: ParseableFile) {
    if (!text) {
      return [];
    }
    return [
      new Document({
        pageContent: text,
        metadata: {
          source: sourceFile.filename,
          extname: this.resolveExtname(sourceFile),
        },
      }),
    ];
  }

  private resolveExtname(file: Pick<ParseableFile, 'extname' | 'filename'>): string {
    return (file.extname ?? path.extname(file.filename ?? '')).toLowerCase();
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

  private getParseMeta(meta?: Record<string, any>): DocumentParseMeta | null {
    if (!meta || typeof meta !== 'object') {
      return null;
    }
    return meta[DOCUMENT_PARSE_META_KEY] ?? null;
  }

  private toPlainObject<T extends ParseableFile = ParseableFile>(file: T | Model | any): T {
    if (file?.toJSON) {
      return file.toJSON() as T;
    }
    return file as T;
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

  private get aiFilesRepo() {
    return this.plugin.db.getRepository('aiFiles');
  }

  private get fileManager(): PluginFileManagerServer {
    return this.plugin.app.pm.get('file-manager');
  }
}

export class KimiProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;
  private readonly fileParserManager: KimiFileParserManager;

  constructor(opts: LLMProviderOptions) {
    super(opts);
    this.fileParserManager = new KimiFileParserManager(this.aiPlugin, {
      apiKey: this.serviceOptions?.apiKey,
      baseURL: this.serviceOptions?.baseURL || this.baseURL,
    });
  }

  get baseURL() {
    return 'https://api.moonshot.cn/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};
    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }
    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
        thinking: { type: 'disabled' },
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
    });
  }

  async parseAttachment(ctx: Context, attachment: any): Promise<any> {
    if (!attachment?.mimetype || attachment.mimetype.startsWith('image/')) {
      return super.parseAttachment(ctx, attachment);
    }
    const parsed = await this.fileParserManager.load(attachment);
    const safeFilename = attachment.filename ? path.basename(attachment.filename) : 'document';
    if (!parsed.supported || !parsed.text) {
      return {
        placement: 'system',
        content: `File ${safeFilename} is not a supported document type for text parsing.`,
      };
    }
    return {
      placement: 'system',
      content: `<parsed_document filename="${safeFilename}">\n${parsed.text}\n</parsed_document>`,
    };
  }

  private get aiPlugin(): PluginAIServer {
    return this.app.pm.get('ai');
  }
}

export const kimiProviderOptions: LLMProviderMeta = {
  title: 'Kimi',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['kimi-k2.5', 'kimi-k2-0905-Preview', 'kimi-k2-turbo-preview'],
  },
  provider: KimiProvider,
};
