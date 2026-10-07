/**
 * The workbench's state, which the page holding it keeps and saves: the draft, the entry selected, uploads under way,
 * and what keeps the draft from being saved.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useState } from 'react';

import {
  parseSkillMarkdown,
  SKILL_CONTENT_MAX_BYTES,
  SKILL_FILE_MAX_BYTES,
  SKILL_MAX_BYTES,
  SKILL_MAX_FILES,
  type SkillFrontMatterProblem,
} from '../../../../shared/skills.js';
import { SKILL_MD, type FileDraft, type SkillDraft } from './model.js';

const bytes = (text: string): number => new TextEncoder().encode(text).length;

const sizeOf = (file: FileDraft): number =>
  file.kind === 'text' ? bytes(file.content) : file.size;

export interface Workbench {
  readonly draft: SkillDraft;
  readonly setDraft: (next: (draft: SkillDraft) => SkillDraft) => void;
  readonly selected: string;
  readonly setSelected: (path: string) => void;
  readonly uploading: number;
  readonly setUploading: (change: (count: number) => number) => void;
  /** Whether the draft differs from what it started as. */
  readonly dirty: boolean;
}

export function useWorkbench(initial: SkillDraft): Workbench {
  const [start] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState(SKILL_MD);
  const [uploading, setUploading] = useState(0);
  return {
    draft,
    setDraft,
    selected,
    setSelected,
    uploading,
    setUploading,
    dirty: draft !== start,
  };
}

/** What keeps the draft from being saved, worked out as it is edited. */
export interface DraftCheck {
  /** Of `SKILL.md`'s front matter. */
  readonly problems: readonly SkillFrontMatterProblem[];
  readonly contentTooLarge: boolean;
  readonly tooLarge: boolean;
  readonly tooMany: boolean;
  readonly filesTooLarge: readonly string[];
  readonly total: number;
  readonly blocked: boolean;
}

export function checkDraft(draft: SkillDraft, uploading: number): DraftCheck {
  const { problems } = parseSkillMarkdown(draft.content);
  const contentTooLarge = bytes(draft.content) > SKILL_CONTENT_MAX_BYTES;
  const total = draft.files.reduce(
    (sum, file) => sum + sizeOf(file),
    bytes(draft.content),
  );
  const filesTooLarge = draft.files
    .filter((file) => sizeOf(file) > SKILL_FILE_MAX_BYTES)
    .map((file) => file.path);
  const tooLarge = total > SKILL_MAX_BYTES;
  const tooMany = draft.files.length > SKILL_MAX_FILES;
  return {
    problems,
    contentTooLarge,
    tooLarge,
    tooMany,
    filesTooLarge,
    total,
    blocked:
      problems.length > 0 ||
      contentTooLarge ||
      tooLarge ||
      tooMany ||
      filesTooLarge.length > 0 ||
      uploading > 0,
  };
}

/** The front matter problems a refused save or create names (`metadata.problems` of its error), if any. */
export function frontMatterProblemsOf(
  error: unknown,
): SkillFrontMatterProblem[] {
  if (!(error instanceof ApiClientError)) return [];
  const problems = (
    error.payload as
      | {
          readonly error?: {
            readonly metadata?: { readonly problems?: unknown };
          };
        }
      | undefined
  )?.error?.metadata?.problems;
  return Array.isArray(problems)
    ? problems.filter(
        (item): item is SkillFrontMatterProblem =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { field?: unknown }).field === 'string' &&
          typeof (item as { reason?: unknown }).reason === 'string',
      )
    : [];
}
