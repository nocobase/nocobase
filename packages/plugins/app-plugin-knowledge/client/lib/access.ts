/**
 * Who may do what in a space, as the application tells the view (`KnowledgeView`'s `access`): the plugin keeps no roles,
 * so the application that keeps them words the matrix of its roles × read, propose, edit and manage for the space
 * shown, where the viewer's access comes from, what "related" means there, and where roles are changed. The viewer's
 * own access comes from the space itself, and an entry's from the entry (`GET /api/knowledge/docs/:docId/access`).
 */
import type { KnowledgeAction } from '../../shared/access.js';

/** How far a role's action reaches in the space: nowhere, the people related to it, or everyone. */
export type KnowledgeAccessReach = 'none' | 'related' | 'all';

export interface KnowledgeAccessCell {
  readonly reach: KnowledgeAccessReach;
  /** What it means here, as the application words it ("Project lead"). */
  readonly label: string;
}

export interface KnowledgeAccessRow {
  readonly id: string;
  readonly title: string;
  /** Whether the viewer holds it. */
  readonly mine?: boolean;
  readonly cells: Readonly<Record<KnowledgeAction, KnowledgeAccessCell>>;
}

export interface KnowledgeAccessDetails {
  /** Where the viewer's access comes from ("Your roles: Member"). */
  readonly source?: string;
  /** The roles × actions of the space; left out where the viewer may not see the roles. */
  readonly rows?: readonly KnowledgeAccessRow[];
  /** What "related" means in this space, one line each. */
  readonly related?: readonly string[];
  /** Where roles are changed, for someone who may. */
  readonly manage?: { readonly href: string; readonly label?: string };
}
