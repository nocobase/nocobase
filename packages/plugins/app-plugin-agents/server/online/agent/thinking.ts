import {
  isReasoningLevel,
  type ReasoningLevel,
} from '../../../shared/models.js';
import type { streamText } from 'ai';
import { invalid } from '../../kernel/errors.js';

type SdkReasoning = NonNullable<Parameters<typeof streamText>[0]['reasoning']>;
/** `ReasoningLevel` is exactly the SDK's `reasoning`: this fails to compile when either gains or loses a value. */
const sameAsSdk: [ReasoningLevel, SdkReasoning] extends [
  SdkReasoning,
  ReasoningLevel,
]
  ? true
  : false = true;
void sameAsSdk;

/** A `thinking` a scope or a request names, refused unless it is a standard level. */
export function assertReasoningLevel(
  value: unknown,
): asserts value is ReasoningLevel {
  if (!isReasoningLevel(value))
    throw invalid(
      'thinking must be one of provider-default, none, minimal, low, medium, high or xhigh.',
      { reason: 'REASONING_LEVEL_INVALID' },
    );
}

/**
 * The ids of the thinking notices an execution replaces when it adds its own. `thinking-adjusted` is no longer
 * written, but an answer saved with one still shows it until a later execution of that answer replaces it.
 */
export const THINKING_NOTICE_IDS: ReadonlySet<string> = new Set([
  'thinking-adjusted',
  'thinking-warning',
]);

/** A notice an execution adds to its answer, as the message part it is saved as. */
export interface ThinkingNotice {
  readonly type: 'data-notice';
  readonly id: 'thinking-warning';
  readonly data: {
    readonly type: 'thinkingWarning';
    readonly title: string;
    readonly params: Record<string, string>;
  };
}

/** The notice an execution adds when the provider package ignored or changed the thinking level it was sent. */
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
