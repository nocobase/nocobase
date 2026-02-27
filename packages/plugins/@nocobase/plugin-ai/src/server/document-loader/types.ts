/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Document } from '@langchain/core/documents';

export type SupportedDocumentExtname = '.pdf' | '.ppt' | '.pptx' | '.doc' | '.docx' | '.txt';

export type DocumentParseMeta = {
  status: 'ready' | 'failed';
  parserVersion: string;
  parsedFileId?: number | string;
  parsedFilename?: string;
  parsedMimetype?: string;
  updatedAt: string;
  error?: string;
};

export type ParsedDocumentResult = {
  supported: boolean;
  fromCache: boolean;
  text: string;
  documents: Document[];
  meta?: {
    sourceFileId?: string | number;
    parsedFileId?: string | number;
    extname?: string;
  };
};

export type ParseableFile = {
  id?: number | string;
  title?: string;
  filename: string;
  extname?: string;
  mimetype?: string;
  storageId?: number;
  meta?: Record<string, any>;
};
