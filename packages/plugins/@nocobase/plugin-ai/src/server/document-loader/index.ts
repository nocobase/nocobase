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
import { DOCUMENT_PARSER_VERSION, PARSED_FILE_MIMETYPE, SUPPORTED_DOCUMENT_EXTNAMES } from './constants';
import { CachedDocumentLoader } from './cached';

export class DocumentLoaders {
  readonly raw: DocumentLoader;
  readonly cached: CachedDocumentLoader;

  constructor(private readonly plugin: PluginAIServer) {
    this.raw = new DocumentLoader(this.plugin.fileManager);
    this.cached = new CachedDocumentLoader(this.plugin, {
      loader: this.raw,
      parserVersion: DOCUMENT_PARSER_VERSION,
      parsedMimetype: PARSED_FILE_MIMETYPE,
      parsedFileExtname: 'txt',
      supports: (file) => SUPPORTED_DOCUMENT_EXTNAMES.includes(this.raw.resolveExtname(file)),
      resolveSupported: () => true,
    });
  }
}

export * from './constants';
export * from './types';
export * from './loader';
export * from './cached';
