/**
 * The server executor: each application instance runs online agents' runs itself, as an in-process runner. It takes
 * online runs through the claim (`claims.claimServer`, the same guarded update runners are given work through, so two
 * instances never take one run), and reports through the same `RunnerReports` a runner's requests reach: start, events,
 * lease, complete, fail and cancel-ack. So conversations, transcripts, the inbox's failed-run cards, retries and the
 * sweeper work for online runs as they do for runner runs.
 *
 * A run works with the entry of its agent's list the claim settled, at its reasoning effort (`ServerClaim.model`: a conversation's choice, else
 * the agent's first), and only that one: a failing model fails the run, it never falls back to another entry.
 *
 * A run is the AI SDK's agent loop (`ToolLoopAgent`) over the entry's language model (`ModelGateway.languageModel`):
 * each step streams text, which a conversation shows as a draft growing in place (`conversations.streamDraft`), and
 * ends with what it used (recorded at once, `reports.onlineUsage`); the SDK calls the step's tools and the model again
 * with their results. The run has two tools (`sandbox.ts`): `bash`, a sandboxed shell whose CLI command runs the
 * application's commands as the run's identity (`cli-command.ts`, from the application's command manifest), and
 * `skill`, which reads the run's skills, mounted read-only in that shell. The loop ends when the model answers without
 * a tool call, or after `maxSteps` steps (`stepLimit`). Input that arrives while it works (a message sent meanwhile) is
 * read once it answers, and answered in the same run by another turn of the loop.
 *
 * - **Holder**: `server:<instance>`, a run's `runnerId` while this instance holds it. The lease is renewed every
 *   `TIMINGS.leaseRenewMs`; an instance that stops renewing (it crashed) loses its runs to the sweeper (`leaseExpired`),
 *   which puts them back in the queue for any instance.
 * - **Cancelling**: the run is read every `cancelPollMs`; a cancel request aborts the model call and acknowledges.
 * - **Failing**: the gateway's error codes map to the protocol's failure reasons (`failureOf`); rate limits and network
 *   errors go back to the queue while attempts remain, the rest fail the run, which the subject's domain reports.
 * - **Stopping**: on shutdown every run is aborted and handed back as `runnerOffline`, which retries at once elsewhere.
 * - No limits: no slots and no per-agent concurrency, as the owner decided; a model service's own limits surface as
 *   `toolRateLimit`.
 * - **Consulting**: a run whose claim lists agents it may consult (`ServerClaim.consultable`) also has `ask_agent`
 *   (`consult-tool.ts`): the consulted agent's run is taken here at once (`claims.claimChild`) and run within the tool
 *   call, its draft answer streamed back as preliminary results, which the asking conversation shows on a card
 *   (`conversations.consultation`). It ends within `consult.timeoutMs` and `consult.tokenBudget`, and is aborted with
 *   the run that asked.
 */
import { randomBytes } from 'node:crypto';

import {
  jsonSchema,
  stepCountIs,
  tool,
  ToolLoopAgent,
  type LanguageModel,
  type ModelMessage as SdkMessage,
  type ToolSet,
} from 'ai';

import {
  ProtocolError,
  TIMINGS,
  type FailureReason,
  type RunEvent,
  type RunInput,
  type RunSkill,
} from '@nocobase/agent-protocol';

import type { Clock } from '../kernel/clock.js';
import type { CallerIdentity } from '../core/callers/index.js';
import type { WorkSignal } from '../runners/signal.js';

import {
  CHAT_IMAGE_TO_MODEL_MAX,
  type ConsultationNotice,
} from '../../shared/conversations.js';
import type { ConsultationService } from '../core/consultations/index.js';
import type { ConversationService } from '../core/conversations/index.js';
import { firstTurn } from '../core/brief/index.js';
import type {
  ClaimService,
  OnlineUsageRecord,
  RunnerReports,
  RunService,
  ServerClaim,
} from '../core/runs/index.js';
import {
  classify,
  ModelError,
  reasoningOf,
  usageOf,
  type ModelErrorCode,
  type ModelGateway,
  type ModelUsage,
} from './gateway.js';
import {
  ASK_AGENT_TOOL,
  consultText,
  consultTool,
  type ConsultOutcome,
  type ConsultOutput,
} from './consult-tool.js';
import { cliCommand, type CommandSurface } from './cli-command.js';
import { onlineTools, type OnlineSkill } from './sandbox.js';
import { errorOutput, type ServerTool } from './tools.js';

/** Model calls a run may make before it fails `stepLimit`. */
export const DEFAULT_MAX_STEPS = 16;
/** How often a running online run is checked for a cancel request. */
const CANCEL_POLL_MS = 1_000;
/** How often a draft reply is written while it streams. */
const DRAFT_INTERVAL_MS = 300;
/** Online runs taken per claim. */
const CLAIM_BATCH = 20;
/** How long the executor waits for work when nobody signals it (work queued on another instance). */
const IDLE_POLL_MS = 2_000;
/** How long a consultation may take, by default. */
export const DEFAULT_CONSULT_TIMEOUT_MS = 120_000;
/** The tokens a consultation may use (input and output, of every model call), by default. */
export const DEFAULT_CONSULT_TOKEN_BUDGET = 200_000;
/** How often a consultation card is rewritten while its answer is written. */
const CARD_INTERVAL_MS = 1_000;

export interface ServerExecutorOptions {
  /** Model calls per run; `DEFAULT_MAX_STEPS`. */
  readonly maxSteps?: number;
  /** How long to wait for work when not signalled; 2 s. */
  readonly idlePollMs?: number;
  /** `server:<random>` by default; set in tests to tell instances apart. */
  readonly holderId?: string;
  /** How often the SDK retries a failed model request itself; 2. */
  readonly maxRetries?: number;
  /** A consultation's bounds (`ask_agent`): `timeoutMs` (2 minutes) and `tokenBudget` (200,000). */
  readonly consult?: {
    readonly timeoutMs?: number;
    readonly tokenBudget?: number;
  };
}

export interface ServerExecutorDeps {
  readonly clock: Clock;
  readonly claims: Pick<ClaimService, 'claimServer' | 'claimChild'>;
  readonly reports: RunnerReports;
  readonly runs: Pick<RunService, 'authenticateToken' | 'get'>;
  readonly conversations: Pick<
    ConversationService,
    'streamDraft' | 'syncRun' | 'consultation'
  >;
  /** Where `ask_agent` starts a consultation; runs never consult without it. */
  readonly consultations?: Pick<ConsultationService, 'start'>;
  /** The application's commands a run may run, called with its token; none without a command manifest. */
  readonly commands: (
    identity: CallerIdentity,
    token: string,
  ) => Promise<CommandSurface | undefined>;
  /** One of the run's skills, read for its shell. */
  readonly skill: (skill: RunSkill) => Promise<OnlineSkill>;
  /** Skills every online run gets besides its own (`online.skills`). */
  readonly builtInSkills?: () => readonly OnlineSkill[];
  /**
   * The images among the files sent with a conversation's message (its input's `payload.attachmentIds`), at most
   * `maxBytes` each, shown to the model with the message; without it the files are only listed by name.
   */
  readonly images?: (
    conversationId: string,
    ids: readonly string[],
    maxBytes: number,
  ) => Promise<{ readonly mediaType: string; readonly data: Uint8Array }[]>;
  readonly gateway: Pick<ModelGateway, 'languageModel'>;
  readonly signal: WorkSignal;
  readonly onError?: (message: string, error: unknown) => void;
}

export interface ServerExecutor {
  /** This instance's holder id (`server:…`). */
  readonly id: string;
  /** Starts taking online runs as they are queued. */
  start(): void;
  /** Stops taking runs, hands back the ones it holds, and waits for them. */
  stop(): Promise<void>;
  /** Takes what is queued now and runs it to its end; the number of runs taken. For tests and one-off use. */
  drain(): Promise<number>;
  /** Runs held now. */
  active(): number;
}

/** The failure reason of a model error code. */
export function failureOf(code: ModelErrorCode): FailureReason {
  switch (code) {
    case 'config':
      return 'modelUnavailable';
    case 'auth':
      return 'toolAuth';
    case 'quota':
      return 'toolQuota';
    case 'rateLimit':
      return 'toolRateLimit';
    case 'network':
      return 'toolNetwork';
    case 'contextOverflow':
      return 'contextOverflow';
    case 'aborted':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

/** Why the run's work stopped before it ended on its own; `timeout` and `budget` end a consultation. */
class Stop extends Error {
  public constructor(
    public readonly kind:
      'cancelled' | 'lost' | 'shutdown' | 'timeout' | 'budget',
  ) {
    super(kind);
  }
}

/** A consultation's run, which `ask_agent` runs within its call. */
interface ChildRun {
  /** Its answer as it is written. */
  readonly onDraft: (text: string) => void;
  readonly timeoutMs: number;
  readonly tokenBudget: number;
}

/** A duration in whole seconds, as a failure says it. */
function seconds(ms: number): string {
  const count = Math.max(1, Math.ceil(ms / 1000));
  return `${count} second${count === 1 ? '' : 's'}`;
}

/** A plan a `bash` call created (`plan create`), from its JSON output. */
function planOf(output: string): { id: string; title: string } | null {
  if (!output.startsWith('exit code 0\n')) return null;
  try {
    const envelope = JSON.parse(output.slice(output.indexOf('\n') + 1)) as {
      ok?: unknown;
      command?: unknown;
      result?: { data?: { id?: unknown; title?: unknown } };
    };
    const data = envelope.result?.data;
    if (
      envelope.ok !== true ||
      envelope.command !== 'plan create' ||
      typeof data?.id !== 'string'
    )
      return null;
    return {
      id: data.id,
      title: typeof data.title === 'string' ? data.title : '',
    };
  } catch {
    return null;
  }
}

/** A failure the model port or the loop decided. */
class RunFailure extends Error {
  public constructor(
    public readonly reason: FailureReason,
    message: string,
  ) {
    super(message);
  }
}

/** A model failure as the run's failure. */
function modelFailure(error: unknown): RunFailure {
  const failure = classify(error);
  return new RunFailure(failureOf(failure.code), failure.message);
}

/** A tool's result as the run's transcript and the model read it. */
function resultOf(output: unknown): { ok: boolean; output: string } {
  if (
    output &&
    typeof output === 'object' &&
    typeof (output as { output?: unknown }).output === 'string'
  ) {
    const result = output as { ok?: unknown; output: string };
    return { ok: result.ok !== false, output: result.output };
  }
  return { ok: true, output: JSON.stringify(output ?? null) };
}

/** The run's tools as the SDK runs them: each answers `{ ok, output }`, and the model reads `output`. */
export function toolSetOf(tools: readonly ServerTool[]): ToolSet {
  return Object.fromEntries(
    tools.map((entry) => [
      entry.spec.name,
      tool({
        description: entry.spec.description,
        inputSchema: jsonSchema<unknown>(entry.spec.inputSchema),
        execute: (args: unknown) => entry.invoke(args),
        toModelOutput: ({ output }) => ({
          type: 'text',
          value: resultOf(output).output,
        }),
      }),
    ]),
  );
}

/** One model call's usage, as the run records it. */
function usageRecord(
  modelService: string,
  model: string,
  usage: ModelUsage,
): OnlineUsageRecord {
  return {
    modelService,
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    ...(usage.cacheReadTokens === undefined
      ? {}
      : { cacheReadTokens: usage.cacheReadTokens }),
    ...(usage.cacheWriteTokens === undefined
      ? {}
      : { cacheWriteTokens: usage.cacheWriteTokens }),
    ...(usage.reasoningTokens === undefined
      ? {}
      : { reasoningTokens: usage.reasoningTokens }),
  };
}

export function createServerExecutor(
  deps: ServerExecutorDeps,
  options: ServerExecutorOptions = {},
): ServerExecutor {
  /** The model's user turn: the inputs as text, and the images sent with a conversation's messages among them. */
  async function userTurn(
    turn: string,
    inputs: readonly RunInput[],
  ): Promise<SdkMessage> {
    const text = firstTurn(turn, inputs);
    const images: { mediaType: string; data: Uint8Array }[] = [];
    if (deps.images)
      for (const input of inputs) {
        const payload = input.payload as
          { conversationId?: unknown; attachmentIds?: unknown } | undefined;
        if (
          typeof payload?.conversationId !== 'string' ||
          !Array.isArray(payload.attachmentIds)
        )
          continue;
        const ids = payload.attachmentIds.filter(
          (id): id is string => typeof id === 'string',
        );
        try {
          images.push(
            ...(await deps.images(
              payload.conversationId,
              ids,
              CHAT_IMAGE_TO_MODEL_MAX,
            )),
          );
        } catch (error) {
          // The files stay listed by name; the turn goes on without the pictures.
          deps.onError?.(
            'Agents could not read the images of a message.',
            error,
          );
        }
      }
    if (images.length === 0) return { role: 'user', content: text };
    return {
      role: 'user',
      content: [
        { type: 'text', text },
        ...images.map((image) => ({
          type: 'file' as const,
          data: image.data,
          mediaType: image.mediaType,
        })),
      ],
    };
  }

  const id = options.holderId ?? `server:${randomBytes(12).toString('hex')}`;
  const holder = { id };
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const maxRetries = options.maxRetries ?? 2;
  const consultTimeoutMs =
    options.consult?.timeoutMs ?? DEFAULT_CONSULT_TIMEOUT_MS;
  const consultTokenBudget =
    options.consult?.tokenBudget ?? DEFAULT_CONSULT_TOKEN_BUDGET;
  const idlePollMs = options.idlePollMs ?? IDLE_POLL_MS;
  const running = new Map<
    string,
    { abort: AbortController; done: Promise<void> }
  >();
  const report = (message: string, error: unknown) =>
    deps.onError?.(message, error);
  let loop: Promise<void> | undefined;
  let stopping: AbortController | undefined;

  async function execute(
    claim: ServerClaim,
    abort: AbortController,
    child?: ChildRun,
  ): Promise<ConsultOutcome> {
    const { runId, agent, run, model } = claim;
    const used = { inputTokens: 0, outputTokens: 0 };
    const plans: { id: string; title: string }[] = [];
    let summary = '';
    const outcome = (
      status: ConsultOutcome['status'],
      error: string | null = null,
    ): ConsultOutcome => ({
      status,
      answer: summary,
      error,
      usage: { ...used },
      plans: [...plans],
    });
    let seq = claim.firstSeq;
    const seen = new Set(claim.inputs.map((input) => input.id));
    const fresh: RunInput[] = [];
    const now = () => deps.clock.now().toISOString();
    const events = async (list: Omit<RunEvent, 'seq' | 'at'>[]) => {
      if (list.length === 0) return;
      const at = now();
      await deps.reports.events(holder, runId, {
        events: list.map((event) => ({ ...event, seq: seq++, at })),
      });
    };
    const absorb = (inputs: readonly RunInput[]) => {
      for (const input of inputs)
        if (!seen.has(input.id)) {
          seen.add(input.id);
          fresh.push(input);
        }
    };

    // Lease renewal and cancel requests, beside the loop.
    let lastLease = Date.now();
    const watcher = setInterval(() => {
      void (async () => {
        try {
          if (Date.now() - lastLease >= TIMINGS.leaseRenewMs) {
            lastLease = Date.now();
            const lease = await deps.reports.lease(holder, runId);
            absorb(lease.inputs);
            if (lease.cancelRequested) abort.abort(new Stop('cancelled'));
            return;
          }
          const current = await deps.runs.get(runId);
          if (current.cancelRequestedAt) abort.abort(new Stop('cancelled'));
          else if (current.runnerId !== id) abort.abort(new Stop('lost'));
        } catch (error) {
          if (error instanceof ProtocolError) abort.abort(new Stop('lost'));
        }
      })();
    }, CANCEL_POLL_MS);
    watcher.unref?.();
    const deadline = child
      ? setTimeout(() => abort.abort(new Stop('timeout')), child.timeoutMs)
      : undefined;
    deadline?.unref?.();

    const stopReason = (): Stop | null => {
      const reason: unknown = abort.signal.reason;
      return abort.signal.aborted && reason instanceof Stop ? reason : null;
    };
    const check = () => {
      const stop = stopReason();
      if (stop) throw stop;
    };

    try {
      const started = await deps.reports.start(holder, runId, {
        workDir: '',
        acceptsInput: !child,
      });
      absorb(started.inputs);
      if (started.cancelRequested) throw new Stop('cancelled');
      if (!model)
        throw new RunFailure(
          'modelUnavailable',
          'The agent lists no model, and no model service offers a default chat model.',
        );
      const identity: CallerIdentity = {
        kind: 'run',
        userId: run.actorUserId,
        displayName: agent.name,
        run: await deps.runs.authenticateToken(claim.token),
        agent,
      };
      const surface = await deps.commands(identity, claim.token);
      const skills: OnlineSkill[] = [];
      for (const skill of claim.skills)
        try {
          skills.push(await deps.skill(skill));
        } catch (error) {
          report(
            `Agents could not read skill ${skill.slug} for run ${runId}.`,
            error,
          );
        }
      for (const skill of deps.builtInSkills?.() ?? [])
        if (!skills.some((own) => own.slug === skill.slug)) skills.push(skill);
      const tools: ServerTool[] = onlineTools(
        skills,
        surface ? [cliCommand(surface)] : [],
      );
      let languageModel: LanguageModel;
      try {
        languageModel = await deps.gateway.languageModel({
          modelService: model.modelService,
          model: model.model,
        });
      } catch (error) {
        throw modelFailure(error);
      }
      const handled = new Set(claim.inputs.map((input) => input.id));
      const messages: SdkMessage[] = [await userTurn(claim.turn, claim.inputs)];
      // What arrived before the run started and was not in the claim (a message sent while it was being taken).
      const early = fresh.splice(0).filter((input) => !handled.has(input.id));
      if (early.length > 0) {
        for (const input of early) handled.add(input.id);
        messages.push(await userTurn('', early));
      }
      const toolSet = toolSetOf(tools);
      const consultations = deps.consultations;
      if (consultations && claim.consultable.length > 0)
        toolSet[ASK_AGENT_TOOL] = consultTool({
          parent: claim,
          holder,
          consultations,
          claims: deps.claims,
          run: (childClaim, signal, onDraft) =>
            consult(childClaim, signal, onDraft),
        });
      const settings = {
        model: languageModel,
        // The brief is the same for every model call of the run: the provider may cache it.
        instructions: {
          role: 'system' as const,
          content: claim.system,
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' as const } },
          },
        },
        tools: toolSet,
        toolOrder: Object.keys(toolSet),
        reasoning: reasoningOf(model.effort),
        maxRetries,
      };
      let steps = 0;
      // Consultation cards, written in order, the answer as it streams at most every `CARD_INTERVAL_MS`.
      let cards: Promise<void> = Promise.resolve();
      const cardWritten = new Map<string, number>();
      const writeCard = (card: ConsultationNotice, final: boolean) => {
        const last = cardWritten.get(card.callId);
        if (
          !final &&
          last !== undefined &&
          Date.now() - last < CARD_INTERVAL_MS
        )
          return;
        cardWritten.set(card.callId, Date.now());
        cards = cards
          .then(() => deps.conversations.consultation(run, card))
          .catch((error: unknown) =>
            report(
              `Agents could not show a consultation of run ${runId}.`,
              error,
            ),
          );
      };

      for (;;) {
        check();
        if (steps >= maxSteps)
          throw new RunFailure(
            'stepLimit',
            `The agent called tools ${maxSteps} times without answering.`,
          );
        const agentLoop = new ToolLoopAgent({
          ...settings,
          stopWhen: stepCountIs(maxSteps - steps),
        });
        let pending: Promise<void> = Promise.resolve();
        let text = '';
        let reasoning = '';
        let settled = false;
        let flushed = 0;
        let lastReason: string | undefined;
        let turnSteps = 0;
        const flush = () => {
          const snapshot = text;
          pending = pending
            .then(() =>
              child
                ? child.onDraft(snapshot)
                : deps.conversations.streamDraft(run, snapshot),
            )
            .catch((error: unknown) =>
              report(`Agents could not show the draft of run ${runId}.`, error),
            );
        };
        // A step's text and thinking are written once, before its tool calls; its text becomes the final message
        // before the next step drafts again.
        const settle = async () => {
          if (settled) return;
          settled = true;
          await pending;
          await events([
            ...(reasoning.trim()
              ? [{ type: 'thinking' as const, content: reasoning }]
              : []),
            ...(text.trim() ? [{ type: 'text' as const, content: text }] : []),
          ]);
          if (text.trim()) {
            summary = text;
            await deps.conversations.syncRun(runId);
          }
        };
        let response: { readonly messages: readonly SdkMessage[] };
        try {
          const result = await agentLoop.stream({
            messages,
            abortSignal: abort.signal,
          });
          for await (const part of result.fullStream)
            switch (part.type) {
              case 'start-step':
                text = '';
                reasoning = '';
                settled = false;
                flushed = 0;
                break;
              case 'text-delta':
                text += part.text;
                if (Date.now() - flushed >= DRAFT_INTERVAL_MS) {
                  flushed = Date.now();
                  flush();
                }
                break;
              case 'reasoning-delta':
                reasoning += part.text;
                break;
              case 'tool-call':
                await settle();
                await events([
                  { type: 'toolUse', tool: part.toolName, input: part.input },
                ]);
                break;
              case 'tool-result': {
                if (part.toolName === ASK_AGENT_TOOL) {
                  const consulted = part.output as ConsultOutput;
                  writeCard(consulted.card, !part.preliminary);
                  if (part.preliminary) break;
                  await cards;
                  await events([
                    {
                      type: 'toolResult',
                      tool: part.toolName,
                      output: consultText(consulted),
                      meta: {
                        ok: consulted.card.state === 'completed',
                        ...(consulted.card.runId
                          ? { runId: consulted.card.runId }
                          : {}),
                      },
                    },
                  ]);
                  break;
                }
                const result = resultOf(part.output);
                const plan =
                  part.toolName === 'bash' ? planOf(result.output) : null;
                if (plan) plans.push(plan);
                await events([
                  {
                    type: 'toolResult',
                    tool: part.toolName,
                    output: result.output,
                    meta: { ok: result.ok },
                  },
                ]);
                break;
              }
              case 'tool-error':
                await events([
                  {
                    type: 'toolResult',
                    tool: part.toolName,
                    output: errorOutput(
                      new ProtocolError(
                        'COMMAND_UNKNOWN',
                        part.error instanceof Error
                          ? part.error.message
                          : String(part.error),
                      ),
                    ),
                    meta: { ok: false },
                  },
                ]);
                break;
              case 'finish-step': {
                await settle();
                turnSteps += 1;
                lastReason = part.finishReason;
                const usage = usageOf(part.usage);
                await deps.reports.onlineUsage(
                  holder,
                  runId,
                  usageRecord(
                    model.modelService,
                    part.response.modelId || model.model,
                    usage,
                  ),
                );
                used.inputTokens +=
                  usage.inputTokens +
                  (usage.cacheReadTokens ?? 0) +
                  (usage.cacheWriteTokens ?? 0);
                used.outputTokens += usage.outputTokens;
                if (
                  child &&
                  used.inputTokens + used.outputTokens > child.tokenBudget
                ) {
                  abort.abort(new Stop('budget'));
                  check();
                }
                break;
              }
              case 'error':
                throw modelFailure(part.error);
              case 'abort':
                throw modelFailure(
                  new ModelError('aborted', 'The call was stopped.'),
                );
              default:
                break;
            }
          response = await result.response;
        } catch (error) {
          check();
          if (error instanceof RunFailure) throw error;
          throw modelFailure(error);
        } finally {
          await pending;
          await cards;
        }
        check();
        steps += turnSteps;
        messages.push(...response.messages);
        // The loop stopped at the step limit while the model still called tools.
        if (lastReason === 'tool-calls')
          throw new RunFailure(
            'stepLimit',
            `The agent called tools ${maxSteps} times without answering.`,
          );

        // Answered. Input that arrived meanwhile is answered in the same run.
        absorb((await deps.reports.lease(holder, runId)).inputs);
        lastLease = Date.now();
        const later = fresh.splice(0).filter((input) => !handled.has(input.id));
        if (later.length > 0) {
          for (const input of later) handled.add(input.id);
          await events([
            {
              type: 'input',
              meta: { inputIds: later.map((input) => input.id) },
            },
          ]);
          messages.push(await userTurn('', later));
          continue;
        }
        if (!text.trim() && steps === 1 && !summary)
          throw new RunFailure('unknown', 'The model answered nothing.');
        await deps.reports.complete(holder, runId, {
          summary: summary.slice(0, 10_000),
          handledInputIds: [...handled],
        });
        return outcome('completed');
      }
    } catch (error) {
      return await end(runId, error);
    } finally {
      clearInterval(watcher);
      if (deadline) clearTimeout(deadline);
    }

    async function end(
      runIdEnded: string,
      error: unknown,
    ): Promise<ConsultOutcome> {
      try {
        if (error instanceof Stop) {
          if (error.kind === 'lost')
            return outcome('failed', 'The run was taken over elsewhere.');
          if (error.kind === 'cancelled') {
            await deps.reports.cancelAck(holder, runIdEnded, {});
            return outcome('cancelled', 'It was stopped.');
          }
          if (error.kind === 'timeout' || error.kind === 'budget') {
            const detail =
              error.kind === 'timeout'
                ? `The consultation took longer than ${seconds(child?.timeoutMs ?? 0)}.`
                : `The consultation used more than ${child?.tokenBudget ?? 0} tokens.`;
            await deps.reports.fail(holder, runIdEnded, {
              reason: 'unknown',
              detail,
            });
            return outcome('failed', detail);
          }
          await deps.reports.fail(holder, runIdEnded, {
            reason: 'runnerOffline',
            detail: 'The application stopped while the agent worked.',
          });
          return outcome('failed', 'The application stopped.');
        }
        const failure =
          error instanceof RunFailure
            ? error
            : new RunFailure(
                'unknown',
                error instanceof Error ? error.message : String(error),
              );
        if (!(error instanceof RunFailure))
          report(`Agents' online run ${runIdEnded} failed.`, error);
        await deps.reports.fail(holder, runIdEnded, {
          reason: failure.reason,
          detail: failure.message.slice(0, 2_000),
        });
        return outcome('failed', failure.message.slice(0, 2_000));
      } catch (reportError) {
        // The run moved on (the sweeper took it, or it was cancelled meanwhile): nothing left to report.
        if (!(reportError instanceof ProtocolError))
          report(`Agents could not end online run ${runIdEnded}.`, reportError);
        return outcome(
          'failed',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * Runs a consultation `ask_agent` started, within the asking tool call: aborted with the run that asked (cancelled with
   * it, or handed back when the instance stops), and within the consultation's time and token budget.
   */
  async function consult(
    claim: ServerClaim,
    signal: AbortSignal | undefined,
    onDraft: (text: string) => void,
  ): Promise<ConsultOutcome> {
    const abort = new AbortController();
    const follow = () => {
      const reason: unknown = signal?.reason;
      abort.abort(
        new Stop(
          reason instanceof Stop && reason.kind === 'cancelled'
            ? 'cancelled'
            : 'shutdown',
        ),
      );
    };
    if (signal?.aborted) follow();
    else signal?.addEventListener('abort', follow, { once: true });
    try {
      return await execute(claim, abort, {
        onDraft,
        timeoutMs: consultTimeoutMs,
        tokenBudget: consultTokenBudget,
      });
    } finally {
      signal?.removeEventListener('abort', follow);
    }
  }

  function launch(claim: ServerClaim): void {
    const abort = new AbortController();
    const done = execute(claim, abort)
      .then(() => undefined)
      .catch((error: unknown) =>
        report(`Agents' online run ${claim.runId} failed.`, error),
      )
      .finally(() => running.delete(claim.runId));
    running.set(claim.runId, { abort, done });
  }

  async function take(): Promise<ServerClaim[]> {
    try {
      return await deps.claims.claimServer(holder, CLAIM_BATCH);
    } catch (error) {
      report('Agents could not take online runs.', error);
      return [];
    }
  }

  return {
    id,
    start() {
      if (loop) return;
      stopping = new AbortController();
      const signal = stopping.signal;
      loop = (async () => {
        while (!signal.aborted) {
          const claimed = await take();
          for (const claim of claimed) launch(claim);
          if (claimed.length === 0) await deps.signal.wait(idlePollMs, signal);
        }
      })();
    },
    async stop() {
      stopping?.abort();
      await loop;
      loop = undefined;
      for (const { abort } of running.values())
        abort.abort(new Stop('shutdown'));
      await Promise.all([...running.values()].map((entry) => entry.done));
    },
    async drain() {
      let total = 0;
      for (;;) {
        const claimed = await take();
        if (claimed.length === 0) break;
        total += claimed.length;
        for (const claim of claimed) launch(claim);
        await Promise.all([...running.values()].map((entry) => entry.done));
      }
      await Promise.all([...running.values()].map((entry) => entry.done));
      return total;
    },
    active: () => running.size,
  };
}
