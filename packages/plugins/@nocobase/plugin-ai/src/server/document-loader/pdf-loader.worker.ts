/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import type { Document } from '@langchain/core/documents';
import { parentPort } from 'node:worker_threads';

type ParsePayload = {
  buffer: Uint8Array;
};

type WorkerResponse = {
  documents?: Array<Pick<Document, 'pageContent' | 'metadata' | 'id'>>;
  error?: string;
};

parentPort?.on('message', async (payload: ParsePayload) => {
  try {
    const blob = new Blob([Buffer.from(payload.buffer)], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const documents = await loader.load();
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
