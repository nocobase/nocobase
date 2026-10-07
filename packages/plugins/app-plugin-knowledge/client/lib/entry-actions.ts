/**
 * What can be done to entries from anywhere in the view (the tree's menus, a document's header, the space's home), as
 * one set of callbacks the view provides: it owns the dialogs and the upload picker these open. `null` where the
 * viewer may do none of it.
 */
import { createContext, useContext } from 'react';

import type {
  KnowledgeAccess,
  KnowledgeDocSummary,
} from '../../shared/knowledge.js';

export type NewEntryKind = 'article' | 'folder';

export interface EntryActions {
  /** What the viewer may do in the space shown (not one it inherits); each entry's own `access` decides on it. */
  readonly access: KnowledgeAccess;
  newEntry(kind: NewEntryKind, parentId: string | null): void;
  /** Opens the file picker; the files chosen go under `parentId`. */
  upload(parentId: string | null): void;
  /** Proposes a new file, for someone who may propose but not edit. */
  proposeFile(): void;
  rename(doc: KnowledgeDocSummary): void;
  move(doc: KnowledgeDocSummary): void;
  archive(doc: KnowledgeDocSummary): void;
  restore(doc: KnowledgeDocSummary): void;
  /** Opens who may access an entry: the viewer's own access, and its entries for someone who manages it. */
  permissions(doc: KnowledgeDocSummary): void;
  /** Opens the space's access: the viewer's, and who may do what by role. */
  spaceAccess(): void;
  /** Runs the search test over the view. */
  searchTest(): void;
  /** Opens how the space is cut into sections, for someone who manages it. */
  chunking(): void;
}

export const EntryActionsContext: React.Context<EntryActions | null> =
  createContext<EntryActions | null>(null);

export function useEntryActions(): EntryActions | null {
  return useContext(EntryActionsContext);
}

/** Whether the viewer may add anything to the space: write, or propose a file. */
export function canAdd(access: KnowledgeAccess | null | undefined): boolean {
  return !!access && (access.edit || access.propose);
}
