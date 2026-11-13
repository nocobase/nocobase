/**
 * The thinking level a person chooses in the chat, as plain data and one hook: which control a model's levels call for
 * (`thinkingControlOf`), and the level last chosen for each model, remembered in this browser per application,
 * person and `modelService:model` (`useThinkingMemory`). The conversation's own level is saved on the server and
 * always wins; what is remembered only picks the level when a person switches to a model, or starts a conversation
 * with one. Every storage access is guarded (private windows, blocked storage).
 */
import { useCallback, useReducer } from 'react';

import {
  isReasoningLevel,
  reasoningLevelsOf,
  supportedReasoningLevel,
  REASONING_ENABLED_LEVELS,
  type ModelCapabilities,
  type ModelRef,
  type ReasoningLevel,
} from '../../shared/models.js';
import { useChatPanel } from './provider.js';

/**
 * The control a model's levels call for: `none` when it takes only `default`; `toggle` when it takes `off` and one
 * level that turns thinking on (`on`), shown as default, off and on; `menu` for anything else, listing `levels`. Every
 * control keeps `default` selectable.
 */
export type ThinkingControl =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'toggle';
      readonly levels: readonly ReasoningLevel[];
      readonly on: ReasoningLevel;
    }
  | { readonly kind: 'menu'; readonly levels: readonly ReasoningLevel[] };

export function thinkingControlOf(
  capabilities: ModelCapabilities | undefined,
): ThinkingControl {
  const levels = reasoningLevelsOf(capabilities?.reasoning);
  if (levels.length < 2) return { kind: 'none' };
  const enabled = levels.filter((level) =>
    (REASONING_ENABLED_LEVELS as readonly string[]).includes(level),
  );
  if (levels.includes('off') && enabled.length === 1)
    return { kind: 'toggle', levels, on: enabled[0] };
  return { kind: 'menu', levels };
}

/** A conversation's saved level as a level the chat shows: `default` for none and for one that is not standard. */
export function shownThinking(value: string | undefined): ReasoningLevel {
  return isReasoningLevel(value) ? value : 'default';
}

/**
 * The level to switch to with a model: the one remembered for it while the model still takes it, `default` when it no
 * longer does, and undefined (keep the conversation's) when none is remembered.
 */
export function restoredThinking(
  remembered: ReasoningLevel | null,
  capabilities: ModelCapabilities | undefined,
): ReasoningLevel | undefined {
  if (remembered === null) return undefined;
  return supportedReasoningLevel(remembered, capabilities?.reasoning) ===
    remembered
    ? remembered
    : 'default';
}

/** Where the levels chosen per model are kept; the application's scope (its path and the person) follows it. */
export const CHAT_THINKING_STORAGE_KEY = 'nocobase:agents-chat:thinking';

const modelKey = (model: ModelRef) => `${model.modelService}:${model.model}`;

function storageOf(storage?: Storage | null): Storage | null {
  if (storage) return storage;
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function storageKey(scope: string): string {
  return scope
    ? `${CHAT_THINKING_STORAGE_KEY}:${scope}`
    : CHAT_THINKING_STORAGE_KEY;
}

function readAll(scope: string, storage?: Storage | null) {
  try {
    const parsed = JSON.parse(
      storageOf(storage)?.getItem(storageKey(scope)) ?? '{}',
    ) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** The level last chosen for `model` in `scope`; null when none is remembered or storage is unavailable. */
export function readThinking(
  scope: string,
  model: ModelRef,
  storage?: Storage | null,
): ReasoningLevel | null {
  const value = readAll(scope, storage)[modelKey(model)];
  return isReasoningLevel(value) ? value : null;
}

export function rememberThinking(
  scope: string,
  model: ModelRef,
  level: ReasoningLevel,
  storage?: Storage | null,
): void {
  try {
    storageOf(storage)?.setItem(
      storageKey(scope),
      JSON.stringify({ ...readAll(scope, storage), [modelKey(model)]: level }),
    );
  } catch {
    // Not remembered; switching back to the model keeps the conversation's level.
  }
}

/** The levels remembered per model for the panel's person and application. */
export function useThinkingMemory(): {
  readonly remembered: (model: ModelRef) => ReasoningLevel | null;
  readonly remember: (model: ModelRef, level: ReasoningLevel) => void;
} {
  const scope = useChatPanel().memoryKey ?? '';
  // Bumped on every write, so a view reading the memory renders again.
  const [, written] = useReducer((count: number) => count + 1, 0);
  const remembered = useCallback(
    (model: ModelRef) => readThinking(scope, model),
    [scope],
  );
  const remember = useCallback(
    (model: ModelRef, level: ReasoningLevel) => {
      rememberThinking(scope, model, level);
      written();
    },
    [scope],
  );
  return { remembered, remember };
}
