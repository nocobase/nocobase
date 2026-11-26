import { createUuid } from '@nocobase/app-client';
import { createContext, type Context } from 'react';
import type { ChatContextInput } from './context-model.js';
import type { ModelRef, ReasoningLevel } from '../../shared/models.js';

export interface PageDraft {
  id: string | null;
  agent: string | null;
  text: string;
  files: readonly File[];
  context?: ChatContextInput;
  model: ModelRef | null;
  thinking: ReasoningLevel | undefined;
  search: boolean;
}

// Owned by the signed-in layout. Only a handoff navigation may claim the snapshot.
interface DraftReaders {
  editor?: () => Pick<PageDraft, 'text' | 'files'> | null;
  context?: () => Promise<ChatContextInput>;
  choices?: () => Pick<PageDraft, 'agent' | 'model' | 'thinking' | 'search'>;
}
export class PageDraftStore {
  readonly readers: DraftReaders = {};
  pending: { key: string; draft: PageDraft } | null = null;

  register<K extends keyof DraftReaders>(
    key: K,
    reader: Required<DraftReaders>[K],
  ): () => void {
    this.readers[key] = reader;
    return () => {
      if (this.readers[key] === reader) delete this.readers[key];
    };
  }

  save(draft: PageDraft): string {
    const key = createUuid();
    this.pending = { key, draft };
    return key;
  }
  release(key: string): void {
    if (this.pending?.key === key) this.pending = null;
  }
}
export const PageDraftStoreContext: Context<PageDraftStore | null> =
  createContext<PageDraftStore | null>(null);
export const RestoredPageDraftContext: Context<PageDraft | null> =
  createContext<PageDraft | null>(null);

export const CapturingPageDraftContext: Context<PageDraftStore | null> =
  createContext<PageDraftStore | null>(null);
