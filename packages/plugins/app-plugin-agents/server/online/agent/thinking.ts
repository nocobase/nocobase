import {
  isReasoningLevel,
  supportedReasoningLevel,
  type ModelCapabilities,
  type ModelRef,
  type ReasoningLevel,
} from '../../../shared/models.js';
import { invalid } from '../../kernel/errors.js';
import type { OnlineAgentConfig } from './types.js';
import type { OnlineAgentWebSearch } from './web-search.js';

/** The capabilities of one model, read at most once however many checks ask. */
export type ModelCapabilitiesReader = () => Promise<ModelCapabilities>;

export function capabilitiesReader(
  dependency: Pick<OnlineAgentWebSearch, 'capabilities'> | undefined,
  model: ModelRef,
): ModelCapabilitiesReader {
  let read: Promise<ModelCapabilities> | undefined;
  return () =>
    (read ??= dependency
      ? dependency.capabilities(model)
      : Promise.resolve({ webSearch: false }));
}

/** A `thinking` a scope or a request names, refused unless it is a standard level. */
export function assertReasoningLevel(
  value: unknown,
): asserts value is ReasoningLevel {
  if (!isReasoningLevel(value))
    throw invalid(
      'thinking must be one of default, off, minimal, low, medium, high, xhigh or max.',
      { reason: 'REASONING_LEVEL_INVALID' },
    );
}

/**
 * Before a conversation is created or configured, or a message sent with overrides: `off` asked for in this request is
 * refused for a model that cannot turn thinking off. An `off` the conversation already had is reset to `default` when
 * the model changes without a new `thinking`, as an inherited web search preference is cleared.
 */
export async function validateThinking(
  config: OnlineAgentConfig,
  requested: string | undefined,
  capabilities: ModelCapabilitiesReader,
  modelChanged: boolean,
): Promise<void> {
  const explicit = requested !== undefined;
  if (config.thinking !== 'off' || (!explicit && !modelChanged)) return;
  if ((await capabilities()).reasoning?.levels.includes('off')) return;
  if (explicit)
    throw invalid('The selected model cannot turn thinking off.', {
      reason: 'REASONING_LEVEL_UNSUPPORTED',
    });
  config.thinking = 'default';
}

/** What one execution runs with, and what it says when that is not the conversation's level. */
export interface ThinkingSelection {
  readonly level: ReasoningLevel;
  readonly adjusted?: {
    readonly requested: string;
    readonly used: ReasoningLevel;
  };
}

/**
 * The level one execution runs with: the conversation's when the model takes it, else the nearest lower level that
 * turns thinking on, else `default` (also for `off` the model does not take, and for a level that is not a standard
 * one). Only this execution changes; the conversation keeps its level.
 */
export async function executionThinking(
  thinking: string | undefined,
  capabilities: ModelCapabilitiesReader,
): Promise<ThinkingSelection> {
  if (thinking === undefined || thinking === 'default')
    return { level: 'default' };
  if (!isReasoningLevel(thinking))
    return {
      level: 'default',
      adjusted: { requested: thinking, used: 'default' },
    };
  const reasoning = (await capabilities()).reasoning;
  const level = supportedReasoningLevel(thinking, reasoning);
  return level === thinking
    ? { level }
    : { level, adjusted: { requested: thinking, used: level } };
}

/** The ids of the notices below, which an execution replaces when it adds its own. */
export const THINKING_NOTICE_IDS: ReadonlySet<string> = new Set([
  'thinking-adjusted',
  'thinking-warning',
]);

/** A notice an execution adds to its answer, as the message part it is saved as. */
export interface ThinkingNotice {
  readonly type: 'data-notice';
  readonly id: 'thinking-adjusted' | 'thinking-warning';
  readonly data: {
    readonly type: 'thinkingAdjusted' | 'thinkingWarning';
    readonly title: string;
    readonly params: Record<string, string>;
  };
}

/** The notice an execution adds to its answer when it ran with another level than the conversation's. */
export function thinkingAdjustedNotice(adjusted: {
  readonly requested: string;
  readonly used: ReasoningLevel;
}): ThinkingNotice {
  return {
    type: 'data-notice',
    id: 'thinking-adjusted',
    data: {
      type: 'thinkingAdjusted',
      title:
        adjusted.used === 'default'
          ? `This model does not support the thinking level ${adjusted.requested}; the provider default was used.`
          : `This model does not support the thinking level ${adjusted.requested}; ${adjusted.used} was used.`,
      params: { requested: adjusted.requested, used: adjusted.used },
    },
  };
}

/** The notice an execution adds when the provider ignored or changed the thinking level it was sent. */
export function thinkingWarningNotice(
  level: ReasoningLevel,
  details: string,
): ThinkingNotice {
  return {
    type: 'data-notice',
    id: 'thinking-warning',
    data: {
      type: 'thinkingWarning',
      title:
        `The provider did not apply the thinking level ${level} as sent: ${details}`.slice(
          0,
          500,
        ),
      params: { level },
    },
  };
}

/** The SDK's warnings about the thinking level it was given, as one line; undefined when there are none. */
export function thinkingWarnings(
  warnings:
    | readonly {
        readonly type: string;
        readonly feature?: string;
        readonly details?: string;
        readonly message?: string;
      }[]
    | undefined,
): string | undefined {
  const found = (warnings ?? []).filter(
    (warning) =>
      (warning.type === 'unsupported' || warning.type === 'compatibility') &&
      (warning.feature === 'reasoning' ||
        warning.feature === 'reasoningEffort'),
  );
  if (!found.length) return undefined;
  return found
    .map((warning) => warning.details ?? warning.feature ?? warning.type)
    .join(' ');
}
