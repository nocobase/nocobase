/** The agent forms' drafts: what a person typed, and the agent input it makes once it checks out. */
import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';

import {
  isOnlineEntry,
  MAX_MODEL_ENTRIES,
  sameEntry,
  type AgentInput,
  type AgentModelEntry,
  type AgentType,
} from '../../../shared/agents.js';
import type { AgentPreset } from '../../../shared/presets.js';

export interface NewAgentDraft {
  readonly name: string;
  readonly description: string;
  /** Chosen first; the fields below follow it. */
  readonly type: AgentType;
  /** A runner agent's rows: coding tools, their models (empty for the tool's default) and efforts. */
  readonly runnerEntries: readonly EntryDraft[];
  /**
   * An online agent's rows: model services, their models and efforts. Null until the person changes them: the dialog
   * then starts on the first model offered.
   */
  readonly onlineEntries: readonly EntryDraft[] | null;
  readonly instructions: string;
  readonly actions: readonly string[];
}

/** A blank draft; `actions` are the ones a new agent starts with (the application's `defaultOn` actions). */
export function newAgentDraft(actions: readonly string[] = []): NewAgentDraft {
  return {
    name: '',
    description: '',
    type: 'runner',
    runnerEntries: [newEntryDraft()],
    onlineEntries: null,
    instructions: '',
    actions,
  };
}

/**
 * Whether the person entered something in a new agent's draft (text compared trimmed): the type or the rows changed from
 * where the draft starts, or any text was typed. The actions are judged by the dialog, which knows whether the person
 * chose them.
 */
export function isDirtyDraft(draft: NewAgentDraft): boolean {
  const [first, ...others] = draft.runnerEntries;
  return (
    Boolean(
      draft.name.trim() ||
      draft.description.trim() ||
      draft.instructions.trim(),
    ) ||
    draft.type !== 'runner' ||
    draft.onlineEntries !== null ||
    others.length > 0 ||
    !first ||
    first.tool !== AGENT_TOOLS[0] ||
    Boolean(first.model.trim()) ||
    Boolean(first.effort)
  );
}

/**
 * The input a new agent's draft makes, with `onlineEntries` the online rows as the dialog shows them, or the
 * translation key of what is wrong: its name, or its rows. Only the fields of its type are sent.
 */
export function newAgentInput(
  draft: NewAgentDraft,
  onlineEntries: readonly EntryDraft[] = draft.onlineEntries ?? [],
):
  | { readonly input: AgentInput }
  | { readonly nameError: string }
  | { readonly modelError: string } {
  if (!draft.name.trim()) return { nameError: 'agentForm.nameRequired' };
  const rows = draft.type === 'online' ? onlineEntries : draft.runnerEntries;
  // A new agent starts with a model; only a saved online agent may be left waiting for one.
  const problem =
    rows.length === 0
      ? 'modelEntries.required'
      : entriesError(draft.type, rows);
  if (problem) return { modelError: problem };
  return {
    input: {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      type: draft.type,
      modelEntries: draftEntries(draft.type, rows),
      instructions: draft.instructions.trim() || null,
      actions: [...draft.actions],
    },
  };
}

/**
 * A row of the tools-and-models list as the editor holds it: a runner row uses `tool` and `model` (empty for the tool's
 * default), an online row `modelService` and `model`; both an `effort` (empty for the default). `key` tells rows apart
 * while they move.
 */
export interface EntryDraft {
  readonly key: string;
  readonly tool: AgentTool;
  readonly modelService: string;
  readonly model: string;
  readonly effort: string;
}

let entryKeys = 0;

/** A new row; a runner row starts on the first tool, an online row on nothing chosen. */
export function newEntryDraft(
  patch: Partial<Omit<EntryDraft, 'key'>> = {},
): EntryDraft {
  entryKeys += 1;
  return {
    key: `entry-${entryKeys}`,
    tool: AGENT_TOOLS[0],
    modelService: '',
    model: '',
    effort: '',
    ...patch,
  };
}

/** The editor's rows for an agent's saved entries. */
export function entryDrafts(entries: readonly AgentModelEntry[]): EntryDraft[] {
  return entries.map((entry) =>
    isOnlineEntry(entry)
      ? newEntryDraft({
          modelService: entry.modelService,
          model: entry.model,
          effort: entry.effort ?? '',
        })
      : newEntryDraft({
          tool: entry.tool,
          model: entry.model ?? '',
          effort: entry.effort ?? '',
        }),
  );
}

/** The entries the rows make for an agent of `type`; rows not filled in are kept, so a check can name them. */
export function draftEntries(
  type: AgentType,
  drafts: readonly EntryDraft[],
): AgentModelEntry[] {
  return drafts.map((draft) =>
    type === 'online'
      ? {
          modelService: draft.modelService,
          model: draft.model,
          effort: draft.effort || null,
        }
      : {
          tool: draft.tool,
          model: draft.model.trim() || null,
          effort: draft.effort || null,
        },
  );
}

/** What is wrong with the rows, as a translation key, or null when they may be saved. */
export function entriesError(
  type: AgentType,
  drafts: readonly EntryDraft[],
): string | null {
  // An online agent with no entry waits for a model; a runner agent cannot run without one.
  if (drafts.length === 0)
    return type === 'runner' ? 'modelEntries.required' : null;
  if (drafts.length > MAX_MODEL_ENTRIES) return 'modelEntries.tooMany';
  if (
    type === 'online' &&
    drafts.some((draft) => !draft.modelService || !draft.model)
  )
    return 'agentForm.modelRequired';
  const entries = draftEntries(type, drafts);
  if (
    entries.some((entry, index) =>
      entries.slice(0, index).some((other) => sameEntry(entry, other)),
    )
  )
    return 'modelEntries.duplicate';
  return null;
}

/** Whether the rows make the same entries, in the same order and with the same efforts, as `entries`. */
export function sameEntries(
  type: AgentType,
  drafts: readonly EntryDraft[],
  entries: readonly AgentModelEntry[],
): boolean {
  const next = draftEntries(type, drafts);
  return (
    next.length === entries.length &&
    next.every(
      (entry, index) =>
        sameEntry(entry, entries[index]) &&
        (entry.effort ?? null) === (entries[index].effort ?? null),
    )
  );
}

/** The rows with the one at `from` moved to `to`. */
export function moveEntry<Item>(
  items: readonly Item[],
  from: number,
  to: number,
): Item[] {
  if (to < 0 || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** A whole number from `min` to `max` typed into a field, or null. */
export function wholeNumber(
  text: string,
  min: number,
  max: number,
): number | null {
  if (!/^\s*\d+\s*$/u.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

/** One regular expression per line, blank lines dropped. */
export function patternLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The first line that is not a valid regular expression, or null. */
export function invalidPattern(lines: readonly string[]): string | null {
  for (const line of lines) {
    try {
      new RegExp(line, 'u');
    } catch {
      return line;
    }
  }
  return null;
}

/** Whether two lists hold the same items, in any order. */
export function sameItems(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

/** The draft with a preset applied; `name` and `description` are the preset's, in the viewer's language. */
export function applyPreset(
  draft: NewAgentDraft,
  preset: AgentPreset,
  name: string,
  description: string,
): NewAgentDraft {
  return {
    ...draft,
    name: draft.name.trim() ? draft.name : name,
    description,
    type: preset.type ?? draft.type,
    instructions: preset.instructions,
    actions: [...preset.actions],
  };
}
