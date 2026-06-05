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
import { Cache } from '@nocobase/cache';
import PluginAIServer from '../plugin';
import { DOCUMENT_PARSE_META_KEY } from './constants';
import { DocumentLoaderLike, DocumentParseMeta, ParseableFile, ParsedDocumentResult } from './types';
import { resolveExtname } from './utils';

export type CachedDocumentLoaderOptions = {
  loader: DocumentLoaderLike;
  parserVersion: string;
  parsedMimetype: string;
  parsedFileExtname: string;
  supports: (file: ParseableFile) => boolean;
};

export class CachedDocumentLoader {
  protected _cache: Cache | null = null;
  constructor(
    private readonly plugin: PluginAIServer,
    private readonly options: CachedDocumentLoaderOptions,
  ) {}

  async load(file: ParseableFile, options?: any): Promise<ParsedDocumentResult> {
    const sourceFile = this.toPlainObject(file);

    if (!this.options.supports(sourceFile)) {
      return {
        supported: false,
        fromCache: false,
        text: '',
        documents: [],
      };
    }

    if (sourceFile.size === 0) {
      return {
        supported: true,
        fromCache: false,
        text: '',
        documents: [],
      };
    }

    const cached = await this.loadFromCache(sourceFile);
    if (cached) {
      return cached;
    }

    const documents = await this.options.loader.load(sourceFile, options);
    const text = this.documentsToText(documents);
    await this.persistParsedText(sourceFile, text);

    return {
      supported: true,
      fromCache: false,
      text,
      documents,
    };
  }

  private async loadFromCache(sourceFile: ParseableFile): Promise<ParsedDocumentResult | null> {
    const cacheKey = this.getCacheKey(sourceFile);
    if (!cacheKey) {
      return null;
    }
    const cache = await this.getCache();
    const filePath = await cache.get<string>(cacheKey);

    if (!filePath) {
      return null;
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return null;
      }
    } catch {
      return null;
    }

    const text = await fs.readFile(filePath, 'utf-8');
    const extname = resolveExtname(sourceFile);
    const documents = this.toDocumentsFromText(text, sourceFile, extname);

    return {
      supported: true,
      fromCache: true,
      text,
      documents,
    };
  }

  private async persistParsedText(sourceFile: ParseableFile, text: string) {
    const cacheKey = this.getCacheKey(sourceFile);
    if (!cacheKey) {
      return null;
    }
    const tempFilePath = path.join(os.tmpdir(), `${cacheKey}.${Date.now()}.parsed.${this.options.parsedFileExtname}`);
    await fs.writeFile(tempFilePath, text, 'utf-8');

    const cache = await this.getCache();
    await cache.set(cacheKey, tempFilePath, 30 * 60 * 1000);
  }

  private documentsToText(documents: Document[]) {
    return documents.map((doc) => doc.pageContent).join('\n\n');
  }

  private toDocumentsFromText(text: string, sourceFile: ParseableFile, extname: string) {
    if (!text) {
      return [];
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

  private toPlainObject<T extends ParseableFile = ParseableFile>(file: T | Model | any): T {
    if (file?.toJSON) {
      return file.toJSON() as T;
    }
    return file as T;
  }

  private async getCache() {
    this._cache ??= await this.plugin.app.cacheManager.createCache({
      name: 'ai-employee:document-loader:parsed',
      store: 'memory',
    });
    return this._cache;
  }

  private getCacheKey(sourceFile: ParseableFile) {
    if (!sourceFile) {
      return null;
    }
    if (!sourceFile.id || !sourceFile.storageId) {
      return null;
    }
    return `${sourceFile.id}@${sourceFile.storageId}`;
  }
}
