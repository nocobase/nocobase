import { getToolName, isToolUIPart, type UIMessage } from 'ai';
import {
  WEB_SEARCH_LIMITS,
  WEB_SEARCH_TOOL,
} from '../../../shared/web-search.js';
import { WebSearchInputSchema } from './results.js';
import { invalid } from '../../kernel/errors.js';

/** One execution, including approval continuation. No persisted counter or independent cleanup owner. */
export class WebSearchBudget {
  private used = 0;
  private calls = new Map<
    string,
    { queries: readonly string[]; pending: boolean }
  >();
  private active = new Set<Promise<void>>();

  restore(message: UIMessage): void {
    for (const part of message.parts) {
      if (
        !isToolUIPart(part) ||
        getToolName(part) !== WEB_SEARCH_TOOL ||
        this.calls.has(part.toolCallId)
      )
        continue;
      const input = WebSearchInputSchema.safeParse(part.input);
      if (!input.success) continue;
      this.used += input.data.queries.length;
      this.calls.set(part.toolCallId, {
        queries: input.data.queries,
        pending:
          part.state === 'input-available' ||
          part.state === 'approval-responded',
      });
    }
  }

  /** Synchronous reservation happens before any connection/model work can yield. */
  reserve(callId: string, queries: readonly string[]): void {
    const previous = this.calls.get(callId);
    if (
      previous &&
      JSON.stringify(previous.queries) !== JSON.stringify(queries)
    )
      throw invalid('A web search call cannot change its reserved queries.');
    if (previous && !previous.pending)
      throw invalid('This web search call has already been attempted.');
    if (this.used > WEB_SEARCH_LIMITS.queriesPerExecution)
      throw invalid(
        'The web search query budget for this execution is exhausted.',
      );
    if (!previous) {
      if (this.used + queries.length > WEB_SEARCH_LIMITS.queriesPerExecution)
        throw invalid(
          'The web search query budget for this execution is exhausted.',
        );
      this.used += queries.length;
    }
    this.calls.set(callId, { queries: [...queries], pending: false });
  }

  /** Shared across simultaneous tool calls, not merely each individual query array. */
  async run<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
    signal.throwIfAborted();
    while (this.active.size >= WEB_SEARCH_LIMITS.concurrency) {
      await Promise.race(this.active);
      signal.throwIfAborted();
    }
    signal.throwIfAborted();
    const task = work();
    const settled = task.then(
      () => {},
      () => {},
    );
    this.active.add(settled);
    try {
      return await task;
    } finally {
      this.active.delete(settled);
    }
  }
}
