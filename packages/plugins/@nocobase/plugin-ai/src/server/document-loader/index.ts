/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import PluginAIServer from '../plugin';
import { DocumentLoader } from './loader';
import { SUPPORTED_DOCUMENT_EXTNAMES } from './constants';
import { CachedDocumentLoader } from './cached';
import { resolveExtname } from './utils';
import { SupportedDocumentExtname } from './types';

export class DocumentLoaders {
  readonly raw: DocumentLoader;
  readonly cached: CachedDocumentLoader;

  constructor(private readonly plugin: PluginAIServer) {
    this.raw = new DocumentLoader(this.plugin.fileManager);
    this.cached = new CachedDocumentLoader(this.plugin, {
      loader: this.raw,
      parserVersion: 'v1',
      parsedMimetype: 'text/plain',
      parsedFileExtname: 'txt',
      supports: (file) => SUPPORTED_DOCUMENT_EXTNAMES.includes(resolveExtname(file) as SupportedDocumentExtname),
    });
  }
}

export * from './constants';
export * from './types';
export * from './loader';
export * from './cached';
export * from './utils';
