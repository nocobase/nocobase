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
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { loadXlsx } from './xlsx';

type ParsePayload = {
  extname: string;
  mimeType?: string;
  filePath: string;
};

type WorkerResponse = {
  documents?: Array<Pick<Document, 'pageContent' | 'metadata' | 'id'>>;
  error?: string;
};

const loadPdf = async (filePath: string): Promise<Document[]> => {
  const loader = new PDFLoader(filePath);
  return loader.load();
};

const loadDoc = async (filePath: string, type: 'docx' | 'doc'): Promise<Document[]> => {
  const loader = new DocxLoader(filePath, { type });
  return loader.load();
};

const loadPpt = async (filePath: string): Promise<Document[]> => {
  const loader = new PPTXLoader(filePath);
  return loader.load();
};

const loadTxt = async (filePath: string): Promise<Document[]> => {
  const loader = new TextLoader(filePath);
  return loader.load();
};

const loadCsv = async (filePath: string): Promise<Document[]> => {
  const loader = new CSVLoader(filePath);
  return loader.load();
};

const loadByExtname = async (payload: ParsePayload): Promise<Document[]> => {
  switch (payload.extname) {
    case '.pdf':
      return loadPdf(payload.filePath);
    case '.ppt':
    case '.pptx':
      return loadPpt(payload.filePath);
    case '.doc':
      return loadDoc(payload.filePath, 'doc');
    case '.docx':
      return loadDoc(payload.filePath, 'docx');
    case '.csv':
      return loadCsv(payload.filePath);
    case '.xls':
    case '.xlsx':
      return loadXlsx(payload.filePath, payload.mimeType);
    case '.json':
    case '.md':
    case '.txt':
      return loadTxt(payload.filePath);
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
    parentPort?.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      error: String(error?.stack || error),
    };
    parentPort?.postMessage(response);
  }
});
