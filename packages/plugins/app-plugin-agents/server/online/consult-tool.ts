/**
 * `ask_agent`: an online run asks another online agent a question and waits for its answer, as the AI SDK's subagent
 * pattern does. The consultation is a run of its own (`core/consultations`), which this instance takes at once and
 * runs within the tool call (`executor.ts`). The tool streams its progress as preliminary results (the card the
 * conversation shows, with the answer as it is written), and its last result is the outcome. The asking model reads
 * only the answer, with a note of the plans it proposed (`toModelOutput`); the consulted run keeps its whole
 * transcript and its usage.
 */
import { jsonSchema, tool, type Tool } from 'ai';

import type { ConsultationNotice } from '../../shared/conversations.js';
import {
  ASK_AGENT_TOOL,
  type ConsultRequest,
  type ConsultationService,
} from '../core/consultations/index.js';
import type { ClaimService, ServerClaim } from '../core/runs/index.js';
import { errorOutput } from './tools.js';

/** How a consultation ended, as the consulted run's executor reports it. */
export interface ConsultOutcome {
  readonly status: 'completed' | 'failed' | 'cancelled';
  /** Its answer: the consulted agent's last text. */
  readonly answer: string;
  readonly error: string | null;
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
  /** Operation plans it proposed. */
  readonly plans: readonly { readonly id: string; readonly title: string }[];
}

/** One result of `ask_agent`: preliminary while the consultation runs, then its outcome. */
export interface ConsultOutput {
  readonly card: ConsultationNotice;
  /** The titles of the plans it proposed. */
  readonly planTitles: readonly string[];
  /** A refusal before it started, as the model reads it (a command's error). */
  readonly refusal: string | null;
}

/** What the tool needs from the executor that runs it. */
export interface ConsultToolContext {
  /** The run that asks. */
  readonly parent: ServerClaim;
  readonly holder: { readonly id: string };
  readonly consultations: Pick<ConsultationService, 'start'>;
  readonly claims: Pick<ClaimService, 'claimChild'>;
  /** Runs the consulted run to its end, aborted by `signal`, telling `onDraft` its answer as it is written. */
  readonly run: (
    claim: ServerClaim,
    signal: AbortSignal | undefined,
    onDraft: (text: string) => void,
  ) => Promise<ConsultOutcome>;
}

const text = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** What the asking model reads of a consultation's outcome. */
export function consultText(output: ConsultOutput): string {
  const { card } = output;
  if (card.state === 'refused')
    return output.refusal ?? JSON.stringify({ error: { message: card.error } });
  if (card.state !== 'completed')
    return JSON.stringify({
      error: {
        code: 'CONSULTATION_FAILED',
        message: `${card.agentName} could not answer: ${card.error ?? 'it stopped'}. Answer with what you know, or say what is missing.`,
      },
    });
  const plans =
    output.planTitles.length > 0
      ? `\n\n(${card.agentName} proposed ${output.planTitles.length === 1 ? 'an operation plan' : `${output.planTitles.length} operation plans`} the person confirms in this conversation: ${output.planTitles.map((title) => `"${title}"`).join(', ')}. Do not propose ${output.planTitles.length === 1 ? 'it' : 'them'} again; tell the person it is waiting for them.)`
      : '';
  return `${card.answer.trim() || '(no answer)'}${plans}`;
}

/** A queue of progress the tool yields as it comes. */
function channel<T>(): {
  push(value: T): void;
  close(): void;
  [Symbol.asyncIterator](): AsyncIterator<T>;
} {
  const values: T[] = [];
  let closed = false;
  let wake: (() => void) | undefined;
  const notify = () => {
    wake?.();
    wake = undefined;
  };
  return {
    push(value) {
      values.push(value);
      notify();
    },
    close() {
      closed = true;
      notify();
    },
    async *[Symbol.asyncIterator]() {
      for (;;) {
        if (values.length > 0) {
          yield values.shift()!;
          continue;
        }
        if (closed) return;
        await new Promise<void>((resolve) => (wake = resolve));
      }
    },
  };
}

/** The `ask_agent` tool of a run that may consult others. */
export function consultTool(
  context: ConsultToolContext,
): Tool<ConsultRequest, ConsultOutput, Record<string, never>> {
  return tool<ConsultRequest, ConsultOutput, Record<string, never>>({
    description:
      'Ask another agent a question and wait for its answer. It reads what it needs with its own skills and commands, may propose an operation plan the person confirms, and changes nothing. You get its answer only; use it in your reply.',
    inputSchema: jsonSchema<ConsultRequest>({
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description:
            'The agent to ask, by its name (as "Agents you may consult" lists it) or its id.',
        },
        question: {
          type: 'string',
          description: 'What you want to know, as a complete question.',
        },
        context: {
          type: 'string',
          description:
            'What it needs to know to answer: it does not see your conversation.',
        },
      },
      required: ['agent', 'question'],
      additionalProperties: false,
    }),
    async *execute(input, { toolCallId, abortSignal }) {
      const request: ConsultRequest = {
        agent: text(input.agent),
        question: text(input.question),
        ...(text(input.context) ? { context: text(input.context) } : {}),
      };
      let card: ConsultationNotice = {
        code: 'consultation',
        callId: toolCallId,
        runId: null,
        agentId: null,
        agentName: request.agent,
        question: request.question,
        state: 'running',
        answer: '',
        error: null,
        usage: null,
        plans: 0,
      };
      if (!request.agent.trim() || !request.question.trim()) {
        const message = 'Name the agent to ask and the question.';
        yield {
          card: { ...card, state: 'refused', error: message },
          planTitles: [],
          refusal: JSON.stringify({
            error: { code: 'INVALID_REQUEST', message },
          }),
        };
        return;
      }
      let started: Awaited<ReturnType<ConsultationService['start']>>;
      try {
        started = await context.consultations.start(
          context.parent.runId,
          toolCallId,
          request,
        );
      } catch (error) {
        yield {
          card: { ...card, state: 'refused', error: messageOf(error) },
          planTitles: [],
          refusal: errorOutput(error),
        };
        return;
      }
      card = {
        ...card,
        runId: started.runId,
        agentId: started.agent.id,
        agentName: started.agent.name,
      };
      yield { card, planTitles: [], refusal: null };
      let claim: ServerClaim;
      try {
        claim = await context.claims.claimChild(context.holder, started.runId);
      } catch (error) {
        yield {
          card: { ...card, state: 'failed', error: messageOf(error) },
          planTitles: [],
          refusal: null,
        };
        return;
      }
      const progress = channel<string>();
      const done = context
        .run(claim, abortSignal, (draft) => progress.push(draft))
        .finally(() => progress.close());
      for await (const draft of progress)
        yield {
          card: { ...card, answer: draft },
          planTitles: [],
          refusal: null,
        };
      const outcome = await done;
      yield {
        card: {
          ...card,
          state: outcome.status === 'completed' ? 'completed' : 'failed',
          answer: outcome.answer,
          error: outcome.error,
          usage: outcome.usage,
          plans: outcome.plans.length,
        },
        planTitles: outcome.plans.map((plan) => plan.title || plan.id),
        refusal: null,
      };
    },
    toModelOutput: ({ output }) => ({
      type: 'text',
      value: consultText(output),
    }),
  });
}

export { ASK_AGENT_TOOL };
