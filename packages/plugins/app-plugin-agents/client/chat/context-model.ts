/**
 * The page context a chat message carries (`PageContext` in `shared/conversations`), as plain data. Pages register
 * what they show (an object, a list filter); the panel keeps the last text selected on the page and the objects an
 * "Ask agent" button pinned. The composer shows all of it as removable chips and sends ids only: a chip's label is for
 * the person, the server resolves its own titles.
 */
import {
  PAGE_CONTEXT_LIMITS,
  type PageContext,
  type PageContextRef,
} from '../../shared/conversations.js';

/** An object a page shows, with what its chip says (a record's key and title, an agent's name). */
export interface ChatContextItem extends PageContextRef {
  readonly label: string;
}

/** A list page's filter: which list (such as `inbox`) and the parameters it applies. */
export interface ChatContextFilter {
  readonly page: string;
  readonly params: Readonly<Record<string, string>>;
  /** What the chip says instead of the raw parameters (`status=open`), such as the names they stand for. Shown only. */
  readonly label?: string;
}

export interface ChatSelection {
  readonly text: string;
  readonly source?: PageContextRef;
}

export type ChatContextChip =
  | {
      readonly key: string;
      readonly kind: 'item';
      readonly item: ChatContextItem;
      readonly pinned: boolean;
    }
  | {
      readonly key: string;
      readonly kind: 'filter';
      readonly filter: ChatContextFilter;
    }
  | {
      readonly key: string;
      readonly kind: 'selection';
      readonly selection: ChatSelection;
    };

export interface ChatContextInput {
  /** pathname + search of the page the message is written on. */
  readonly route: string;
  /** Objects an "Ask agent" button brought in: kept across pages until the message is sent or they are removed. */
  readonly pinned: readonly ChatContextItem[];
  /** Objects the current page registered. */
  readonly sources: readonly ChatContextItem[];
  readonly filter: ChatContextFilter | null;
  readonly selection: ChatSelection | null;
  /** Chip keys the person removed on this page. */
  readonly removed: ReadonlySet<string>;
}

export const SELECTION_KEY = 'selection';
export const FILTER_KEY = 'filter';

export function itemKey(item: PageContextRef): string {
  return `${item.kind}:${item.id}`;
}

/** The chips above the composer: pinned objects first, each object once, capped like the payload. */
export function contextChips(input: ChatContextInput): ChatContextChip[] {
  const chips: ChatContextChip[] = [];
  const seen = new Set<string>();
  const pinned = new Set(input.pinned.map(itemKey));
  for (const item of [...input.pinned, ...input.sources]) {
    const key = itemKey(item);
    if (seen.has(key) || input.removed.has(key)) continue;
    if (seen.size >= PAGE_CONTEXT_LIMITS.items) break;
    seen.add(key);
    chips.push({ key, kind: 'item', item, pinned: pinned.has(key) });
  }
  if (
    input.filter &&
    !input.removed.has(FILTER_KEY) &&
    Object.keys(input.filter.params).length > 0
  )
    chips.push({ key: FILTER_KEY, kind: 'filter', filter: input.filter });
  if (input.selection && !input.removed.has(SELECTION_KEY))
    chips.push({
      key: SELECTION_KEY,
      kind: 'selection',
      selection: input.selection,
    });
  return chips;
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** The `context` of a message: what the chips show, ids only, within `PAGE_CONTEXT_LIMITS`. */
export function buildPageContext(
  input: ChatContextInput,
): PageContext | undefined {
  const items: PageContextRef[] = [];
  let filter: PageContext['filter'];
  let selection: PageContext['selection'];
  for (const chip of contextChips(input)) {
    if (chip.kind === 'item')
      items.push({ kind: chip.item.kind, id: chip.item.id });
    else if (chip.kind === 'filter') {
      const params = Object.fromEntries(
        Object.entries(chip.filter.params)
          .slice(0, PAGE_CONTEXT_LIMITS.filterKeys)
          .map(([key, value]) => [
            key,
            clip(value, PAGE_CONTEXT_LIMITS.filterValue),
          ]),
      );
      const label = chip.filter.label?.trim();
      filter = {
        page: chip.filter.page,
        params,
        ...(label
          ? { label: clip(label, PAGE_CONTEXT_LIMITS.filterLabel) }
          : {}),
      };
    } else
      selection = {
        text: clip(chip.selection.text, PAGE_CONTEXT_LIMITS.selection),
        ...(chip.selection.source ? { source: chip.selection.source } : {}),
      };
  }
  const route = clip(input.route, PAGE_CONTEXT_LIMITS.route);
  if (items.length === 0 && !filter && !selection) {
    return route ? { route, items } : undefined;
  }
  return {
    route,
    items,
    ...(filter ? { filter } : {}),
    ...(selection ? { selection } : {}),
  };
}

/** Selected text as it is sent: trimmed and cut at the limit; empty is no selection. */
export function clampSelection(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return clip(trimmed, PAGE_CONTEXT_LIMITS.selection);
}

/** `data-chat-source="<kind>:<id>"` on an ancestor of a selection names the object the text comes from. */
export const SOURCE_ATTRIBUTE = 'data-chat-source';

export function parseSourceAttribute(
  value: string | null | undefined,
): PageContextRef | null {
  if (!value) return null;
  const index = value.indexOf(':');
  if (index <= 0) return null;
  const kind = value.slice(0, index);
  const id = value.slice(index + 1);
  return id ? { kind, id } : null;
}

/** A short, single-line quote of a selection for its chip. */
export function selectionPreview(text: string, max = 40): string {
  const line = text.replace(/\s+/gu, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** "status=open, owner=me" for a filter chip. */
export function filterText(filter: {
  readonly params: Readonly<Record<string, string>>;
}): string {
  return Object.entries(filter.params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}
