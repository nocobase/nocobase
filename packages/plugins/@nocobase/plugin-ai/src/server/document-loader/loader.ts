/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { Document } from '@langchain/core/documents';
import { Readable } from 'node:stream';
import { Worker } from 'node:worker_threads';
import { SUPPORTED_DOCUMENT_EXTNAMES } from './constants';
import { ParseableFile, SupportedDocumentExtname } from './types';
import path from 'node:path';
import { TextLoader } from './vendor/langchain/document_loaders/fs/text';
import { resolveExtname } from './utils';

export class DocumentLoader {
  constructor(private readonly fileManager: PluginFileManagerServer) {}

  async load(file: ParseableFile): Promise<Document[]> {
    const extname = resolveExtname(file) as SupportedDocumentExtname;
    if (!SUPPORTED_DOCUMENT_EXTNAMES.includes(extname)) {
      return [];
    }

    const { stream, contentType } = await this.fileManager.getFileStream(file as any);
    const blob = await this.streamToBlob(stream, contentType ?? file.mimetype);

    switch (extname) {
      case '.pdf':
        return this.loadPdf(blob);
      case '.ppt':
      case '.pptx':
        return this.loadPpt(blob);
      case '.doc':
        return this.loadDoc(blob, { type: 'doc' });
      case '.docx':
        return this.loadDoc(blob, { type: 'docx' });
      case '.txt':
        return this.loadTxt(blob);
      default:
        return [];
    }
  }

  private async streamToBlob(stream: Readable, mimeType = 'application/octet-stream') {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // @ts-ignore
    return new Blob(chunks, { type: mimeType });
  }

  private async loadPdf(blob: Blob): Promise<Document[]> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const isTsRuntime = __filename.endsWith('.ts');
    const workerPath = path.join(__dirname, `pdf-loader.worker.${isTsRuntime ? 'ts' : 'js'}`);
    const worker = new Worker(workerPath, {
      execArgv: isTsRuntime ? ['--require', 'tsx/cjs'] : undefined,
    });
    return new Promise<Document[]>((resolve, reject) => {
      let settled = false;
      const close = (error?: Error, result?: Document[]) => {
        if (settled) {
          return;
        }
        settled = true;
        if (error) {
          reject(error);
          return;
        }
        resolve(result || []);
      };

      worker.once('message', (payload: { documents?: Document[]; error?: string }) => {
        if (payload?.error) {
          close(new Error(payload.error));
          return;
        }
        close(undefined, payload?.documents || []);
      });
      worker.once('error', (error) => close(error));
      worker.once('exit', (code) => {
        if (!settled && code !== 0) {
          close(new Error(`PDF worker exited with code ${code}`));
        }
      });

      worker.postMessage({ buffer: Uint8Array.from(buffer) });
    }).finally(() => {
      worker.terminate().catch(() => undefined);
    });
  }

  private async loadDoc(blob: Blob, options: { type: 'docx' | 'doc' }): Promise<Document[]> {
    const loader = new DocxLoader(blob, options);
    return loader.load();
  }

  private async loadPpt(blob: Blob): Promise<Document[]> {
    const loader = new PPTXLoader(blob);
    return loader.load();
  }

  private async loadTxt(blob: Blob): Promise<Document[]> {
    const loader = new TextLoader(blob);
    return loader.load();
  }
}
