/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Document } from '@langchain/core/documents';
import { Model } from '@nocobase/database';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import PluginAIServer from '../plugin';
import { DOCUMENT_PARSE_META_KEY } from './constants';
import { DocumentParseMeta, ParseableFile, ParsedDocumentResult } from './types';

export type DocumentLoaderLike = {
  load(file: ParseableFile): Promise<Document[]>;
  resolveExtname(file: Pick<ParseableFile, 'extname' | 'filename'>): string;
};

export type CachedDocumentLoaderOptions = {
  loader: DocumentLoaderLike;
  parserVersion: string;
  parsedMimetype: string;
  parsedFileExtname: string;
  supports: (file: ParseableFile) => boolean;
  resolveSupported: (documents: Document[], text: string) => boolean;
  toDocumentsFromText?: (text: string, sourceFile: ParseableFile, extname: string) => Document[];
};

export class CachedDocumentLoader {
  constructor(
    private readonly plugin: PluginAIServer,
    private readonly options: CachedDocumentLoaderOptions,
  ) {}

  async load(file: ParseableFile): Promise<ParsedDocumentResult> {
    const sourceFile = this.toPlainObject(file);

    if (!this.options.supports(sourceFile)) {
      return {
        supported: false,
        fromCache: false,
        text: '',
        documents: [],
        meta: {
          sourceFileId: sourceFile.id,
        },
      };
    }

    const cached = await this.loadFromCache(sourceFile);
    if (cached) {
      return cached;
    }

    try {
      const documents = await this.options.loader.load(sourceFile);
      const text = this.documentsToText(documents);
      const parsedFile = await this.persistParsedText(sourceFile, text);
      await this.updateSourceMeta(sourceFile, {
        status: 'ready',
        parserVersion: this.options.parserVersion,
        parsedFileId: parsedFile.id,
        parsedFilename: parsedFile.filename,
        parsedMimetype: this.options.parsedMimetype,
        updatedAt: new Date().toISOString(),
      });

      return {
        supported: this.options.resolveSupported(documents, text),
        fromCache: false,
        text,
        documents,
        meta: {
          sourceFileId: sourceFile.id,
          parsedFileId: parsedFile.id,
        },
      };
    } catch (error) {
      await this.updateSourceMeta(sourceFile, {
        status: 'failed',
        parserVersion: this.options.parserVersion,
        updatedAt: new Date().toISOString(),
        error: error?.message ?? String(error),
      });
      throw error;
    }
  }

  private async loadFromCache(sourceFile: ParseableFile): Promise<ParsedDocumentResult | null> {
    const meta = this.getParseMeta(sourceFile.meta);
    if (!meta || meta.status !== 'ready' || meta.parserVersion !== this.options.parserVersion || !meta.parsedFileId) {
      return null;
    }

    const parsedModel = await this.aiFilesRepo.findById(meta.parsedFileId);
    if (!parsedModel) {
      return null;
    }

    const parsedFile = this.toPlainObject(parsedModel);
    const text = await this.readTextFile(parsedFile);
    const extname = this.options.loader.resolveExtname(sourceFile);
    const documents = this.toDocumentsFromText(text, sourceFile, extname);

    return {
      supported: this.options.resolveSupported(documents, text),
      fromCache: true,
      text,
      documents,
      meta: {
        sourceFileId: sourceFile.id,
        parsedFileId: parsedFile.id,
      },
    };
  }

  private async persistParsedText(sourceFile: ParseableFile, text: string) {
    const tempFilePath = path.join(
      os.tmpdir(),
      `${sourceFile.id ?? Date.now()}.${Date.now()}.parsed.${this.options.parsedFileExtname}`,
    );
    await fs.writeFile(tempFilePath, text, 'utf-8');

    try {
      const storageName = await this.resolveStorageName(sourceFile);
      const created = await this.fileManager.createFileRecord({
        collectionName: 'aiFiles',
        filePath: tempFilePath,
        storageName,
        values: {
          title: `${sourceFile.title ?? sourceFile.filename ?? 'document'} (parsed)`,
          mimetype: this.options.parsedMimetype,
          meta: {
            parserVersion: this.options.parserVersion,
            sourceFileId: sourceFile.id,
          },
        },
      });
      return this.toPlainObject(created);
    } finally {
      await fs.rm(tempFilePath, { force: true });
    }
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

  private async readTextFile(file: ParseableFile) {
    const { stream } = await this.fileManager.getFileStream(file as any);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  private documentsToText(documents: Document[]) {
    return documents.map((doc) => doc.pageContent).join('\n\n');
  }

  private toDocumentsFromText(text: string, sourceFile: ParseableFile, extname: string) {
    if (this.options.toDocumentsFromText) {
      return this.options.toDocumentsFromText(text, sourceFile, extname);
    }

    return [
      new Document({
        pageContent: text,
        metadata: {
          source: sourceFile.filename,
          extname,
        },
      }),
    ];
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

  private get aiFilesRepo() {
    return this.plugin.db.getRepository('aiFiles');
  }

  private get fileManager(): PluginFileManagerServer {
    return this.plugin.app.pm.get('file-manager');
  }
}
