/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Document, DocumentOptions, IndexOptions } from 'flexsearch';
import { Index } from './search-index';

export class DocumentManager {
  indexes: Map<string, Index> = new Map();
  documents: Map<string, Document> = new Map();

  addIndex(name: string, options?: IndexOptions) {
    const index = new Index(options);
    this.indexes.set(name, index);
    return index;
  }

  getIndex(name: string): Index | undefined {
    return this.indexes.get(name);
  }

  addDocument(name: string, options?: DocumentOptions) {
    const doc = new Document(options);
    this.documents.set(name, doc);
    return doc;
  }

  getDocument(name: string): Document | undefined {
    return this.documents.get(name);
  }
}

export { Index as FlexSearchIndex } from 'flexsearch';
