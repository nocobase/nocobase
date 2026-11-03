import type { ConversationSummary } from '../../shared/conversations.js';
import type { ChatSubmission } from './submissions.js';
import type { StreamState } from './controller.js';

/** Presentation keys only: never expose internal errors or infer state from provider text. */
export type ChatFeedback =
  | 'sending'
  | 'waiting'
  | 'thinking'
  | 'stopping'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'unknown'
  | 'effectReview';

export function chatIsRunning(
  conversation: Pick<ConversationSummary, 'execution' | 'run'> | null,
): boolean {
  return conversation?.execution
    ? conversation.execution.status === 'running'
    : Boolean(conversation?.run);
}

export function chatFeedback(input: {
  execution?: ConversationSummary['execution'];
  running: boolean;
  stopping: boolean;
  submission?: Pick<ChatSubmission, 'status' | 'released'>;
  stream?: StreamState;
  hasOutput: boolean;
  lastSeq?: number;
}): ChatFeedback | null {
  const status = input.submission?.released
    ? undefined
    : input.submission?.status;
  if (status === 'unknown' || status === 'creationUnknown') return 'unknown';
  if (status === 'sending' || status === 'creating') return 'sending';
  if (status === 'notSubmitted') return 'failed';
  if (input.stopping && input.running) return 'stopping';
  if (!input.running && input.execution?.requiresEffectReview)
    return 'effectReview';
  if (input.stream?.error) return 'unknown';
  if (input.running) {
    if (input.hasOutput) return null;
    // Occupancy is known before the first stream event, not only once text arrives.
    return input.execution || input.stream?.status === 'streaming'
      ? 'thinking'
      : 'waiting';
  }
  return input.execution?.outcome === 'completed'
    ? null
    : (input.execution?.outcome ?? null);
}

/** A scroller follows output until the person chooses to read further up. */
export function chatNearBottom(
  element: Pick<HTMLElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>,
): boolean {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= 64;
}
