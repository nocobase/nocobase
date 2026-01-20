import { Document, DocumentOptions, IndexOptions } from 'flexsearch';
import { Index } from './search-index';
import { Application } from '@nocobase/server';
import { createDocsIndexCommand } from './index-command';

export class DocumentManager {
  indexes: Map<string, Index> = new Map();
  documents: Map<string, Document> = new Map();

  constructor(app: Application) {
    createDocsIndexCommand(app);
  }

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
