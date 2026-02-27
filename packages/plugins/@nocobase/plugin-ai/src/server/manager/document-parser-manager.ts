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
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { Model } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { DocumentLoader } from '../document-parser/document-loader';
import {
  DOCUMENT_PARSE_META_KEY,
  DOCUMENT_PARSER_VERSION,
  PARSED_FILE_MIMETYPE,
  SUPPORTED_DOCUMENT_EXTNAMES,
} from '../document-parser/constants';
import {
  DocumentParseMeta,
  ParseableFile,
  ParsedDocumentResult,
  SupportedDocumentExtname,
} from '../document-parser/types';

export class DocumentParserManager {
  private readonly loader: DocumentLoader;

  constructor(private readonly plugin: PluginAIServer) {
    this.loader = new DocumentLoader(this.fileManager);
  }

  async load(file: ParseableFile): Promise<ParsedDocumentResult> {
    const sourceFile = this.toPlainObject(file);
    const extname = this.resolveExtname(sourceFile);

    if (!SUPPORTED_DOCUMENT_EXTNAMES.includes(extname)) {
      return {
        supported: false,
        fromCache: false,
        text: '',
        documents: [],
        meta: {
          sourceFileId: sourceFile.id,
          extname,
        },
      };
    }

    const cached = await this.loadFromCache(sourceFile, extname);
    if (cached) {
      return cached;
    }

    try {
      const documents = await this.loader.load(sourceFile);
      const text = this.documentsToText(documents);
      const parsedFile = await this.persistParsedText(sourceFile, text);
      await this.updateSourceMeta(sourceFile, {
        status: 'ready',
        parserVersion: DOCUMENT_PARSER_VERSION,
        parsedFileId: parsedFile.id,
        parsedFilename: parsedFile.filename,
        parsedMimetype: PARSED_FILE_MIMETYPE,
        updatedAt: new Date().toISOString(),
      });

      return {
        supported: true,
        fromCache: false,
        text,
        documents,
        meta: {
          sourceFileId: sourceFile.id,
          parsedFileId: parsedFile.id,
          extname,
        },
      };
    } catch (error) {
      await this.updateSourceMeta(sourceFile, {
        status: 'failed',
        parserVersion: DOCUMENT_PARSER_VERSION,
        updatedAt: new Date().toISOString(),
        error: error?.message ?? String(error),
      });
      throw error;
    }
  }

  private async loadFromCache(
    sourceFile: ParseableFile,
    extname: SupportedDocumentExtname,
  ): Promise<ParsedDocumentResult | null> {
    const meta = this.getParseMeta(sourceFile.meta);
    if (!meta || meta.status !== 'ready' || meta.parserVersion !== DOCUMENT_PARSER_VERSION || !meta.parsedFileId) {
      return null;
    }

    const parsedModel = await this.aiFilesRepo.findById(meta.parsedFileId);
    if (!parsedModel) {
      return null;
    }

    const parsedFile = this.toPlainObject(parsedModel);
    const text = await this.readTextFile(parsedFile);

    return {
      supported: true,
      fromCache: true,
      text,
      documents: this.toTextDocuments(text, sourceFile),
      meta: {
        sourceFileId: sourceFile.id,
        parsedFileId: parsedFile.id,
        extname,
      },
    };
  }

  private async persistParsedText(sourceFile: ParseableFile, text: string) {
    const tempFilePath = path.join(os.tmpdir(), `${sourceFile.id ?? Date.now()}.${Date.now()}.parsed.txt`);
    await fs.writeFile(tempFilePath, text, 'utf-8');

    try {
      const storageName = await this.resolveStorageName(sourceFile);
      const created = await this.fileManager.createFileRecord({
        collectionName: 'aiFiles',
        filePath: tempFilePath,
        storageName,
        values: {
          title: `${sourceFile.title ?? sourceFile.filename ?? 'document'} (parsed)`,
          mimetype: PARSED_FILE_MIMETYPE,
          meta: {
            parserVersion: DOCUMENT_PARSER_VERSION,
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

  private toTextDocuments(text: string, sourceFile: ParseableFile) {
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

  private resolveExtname(file: Pick<ParseableFile, 'extname' | 'filename'>): SupportedDocumentExtname {
    return this.loader.resolveExtname(file);
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
