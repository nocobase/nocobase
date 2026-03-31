/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import type { Document } from '@langchain/core/documents';
import { parentPort } from 'node:worker_threads';
import { TextLoader } from './vendor/langchain/document_loaders/fs/text';
import { SupportedDocumentExtname } from './types';

type ParsePayload = {
  extname: SupportedDocumentExtname;
  mimeType?: string;
  buffer: Uint8Array;
};

type WorkerResponse = {
  documents?: Array<Pick<Document, 'pageContent' | 'metadata' | 'id'>>;
  error?: string;
};

const loadPdf = async (blob: Blob): Promise<Document[]> => {
  const loader = new PDFLoader(blob);
  return loader.load();
};

const loadDoc = async (blob: Blob, type: 'docx' | 'doc'): Promise<Document[]> => {
  const loader = new DocxLoader(blob, { type });
  return loader.load();
};

const loadPpt = async (blob: Blob): Promise<Document[]> => {
  const loader = new PPTXLoader(blob);
  return loader.load();
};

const loadTxt = async (blob: Blob): Promise<Document[]> => {
  const loader = new TextLoader(blob);
  return loader.load();
};

const loadByExtname = async (payload: ParsePayload): Promise<Document[]> => {
  // @ts-ignore
  const blob = new Blob([Buffer.from(payload.buffer)], { type: payload.mimeType ?? 'application/octet-stream' });

  switch (payload.extname) {
    case '.pdf':
      return loadPdf(blob);
    case '.ppt':
    case '.pptx':
      return loadPpt(blob);
    case '.doc':
      return loadDoc(blob, 'doc');
    case '.docx':
      return loadDoc(blob, 'docx');
    case '.txt':
      return loadTxt(blob);
    default:
      return [];
  }
};

parentPort?.on('message', async (payload: ParsePayload) => {
  try {
    const documents = await loadByExtname(payload);
    const response: WorkerResponse = {
      documents: documents.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
        id: doc.id,
      })),
    };
    parentPort.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      error: String(error?.stack || error),
    };
    parentPort?.postMessage(response);
  }
});
