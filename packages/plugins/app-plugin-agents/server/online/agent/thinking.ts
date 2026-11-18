import type { ReasoningLevel } from '../../../shared/models.js';

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

/**
 * The setting a provider package names as a warning's feature when the warning is about thinking: the call option
 * (`reasoning`, `reasoning "none"`), a reasoning setting (`reasoningEffort`, `reasoningHistory 'preserved' …`), the
 * thinking setting or a path inside it (`thinking`, `thinking.type "disabled"`, `providerOptions.anthropic.thinking`)
 * or `extended thinking`. The setting starts the feature and ends at a space, a dot or the end, so a tool ID, a model ID
 * or any other name that merely contains the word (`provider-defined tool custom.thinking_search`,
 * `dynamic tool loading for model "moonshot-v1-thinking"`) is not one.
 */
const THINKING_FEATURE =
  /^(?:providerOptions\.[\w-]+\.)?(?:extended thinking|thinking|reasoning(?:[A-Z]\w*)?)(?=$|[\s.])/;

/**
 * The SDK's warnings about thinking, as one line; undefined when there are none. A warning counts when it is
 * `unsupported` or `compatibility` and its feature is a thinking setting (see `THINKING_FEATURE`).
 */
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
      THINKING_FEATURE.test(warning.feature ?? ''),
  );
  if (!found.length) return undefined;
  return found
    .map((warning) => warning.details ?? warning.feature ?? warning.type)
    .join(' ');
}
