/**
 * What the knowledge view shows, in the URL beside the page's own parameters, so a link opens it again: `?doc=` (with
 * `&version=`, `&mode=edit|history`, and `&lines=12-30` for lines to highlight), `?proposal=`, `?proposals=pending|revising|accepted|rejected` (with `&about=` a
 * document), or `?q=` search results. Nothing of these is the space's home.
 */
import { useSearchParams } from 'react-router';

import type { KnowledgeProposalStatus } from '../../shared/knowledge.js';

export type DocMode = 'read' | 'edit' | 'history';

/** The proposal lists the view shows, by status. */
export type ProposalListStatus = Extract<
  KnowledgeProposalStatus,
  'pending' | 'revising' | 'accepted' | 'rejected'
>;

export const PROPOSAL_LIST_STATUSES: readonly ProposalListStatus[] = [
  'pending',
  'revising',
  'accepted',
  'rejected',
];

type ViewKey =
  | 'doc'
  | 'version'
  | 'mode'
  | 'lines'
  | 'proposal'
  | 'proposals'
  | 'about'
  | 'q';

const ALL: readonly ViewKey[] = [
  'doc',
  'version',
  'mode',
  'lines',
  'proposal',
  'proposals',
  'about',
  'q',
];

export interface ViewState {
  readonly doc: string | null;
  readonly version: number | null;
  readonly mode: DocMode;
  /** Lines of the document to highlight, 1-based and inclusive. */
  readonly lines: readonly [number, number] | null;
  readonly proposal: string | null;
  readonly proposals: ProposalListStatus | null;
  readonly about: string | null;
  readonly q: string;
  /** Changes the given keys, keeping the others. */
  set(changes: Partial<Record<ViewKey, string | null>>): void;
  /** Shows only the given keys: everything else of the view is cleared. */
  show(changes: Partial<Record<ViewKey, string | null>>): void;
}

export function useViewState(): ViewState {
  const [params, setParams] = useSearchParams();
  const write = (
    changes: Partial<Record<ViewKey, string | null>>,
    clear: boolean,
  ) => {
    const next = new URLSearchParams(params);
    if (clear) for (const key of ALL) next.delete(key);
    for (const [key, value] of Object.entries(changes))
      if (value === null || value === undefined || value === '')
        next.delete(key);
      else next.set(key, value);
    setParams(next, { replace: false });
  };
  const version = Number(params.get('version'));
  const raw = params.get('mode');
  const list = params.get('proposals');
  return {
    doc: params.get('doc'),
    version: Number.isInteger(version) && version > 0 ? version : null,
    mode: raw === 'edit' || raw === 'history' ? raw : 'read',
    lines: linesOf(params.get('lines')),
    proposal: params.get('proposal'),
    proposals: PROPOSAL_LIST_STATUSES.find((status) => status === list) ?? null,
    about: params.get('about'),
    q: params.get('q') ?? '',
    set: (changes) => write(changes, false),
    show: (changes) => write(changes, true),
  };
}

/** `12-30` as lines, or null. */
export function linesOf(
  value: string | null,
): readonly [number, number] | null {
  const match = /^(\d+)-(\d+)$/u.exec(value ?? '');
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return start >= 1 && end >= start ? [start, end] : null;
}
