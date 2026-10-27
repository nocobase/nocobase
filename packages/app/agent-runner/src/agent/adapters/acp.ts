import { StreamOutput } from './stream-output.ts';
/** Drives a catalog agent through the same ACP client used by personal sessions. */
import { execFile } from 'node:child_process';
import { AGENTS } from '@nocobase/acp-bridge/catalog';
import type { AgentSpec } from '@nocobase/acp-bridge/catalog';
import type { ResolvedAgent } from '@nocobase/acp-bridge/client';
import {
  AgentProcess,
  configureSession,
  continueSession,
  errorMessage,
  isAuthRequired,
  ModelSelectionError,
  methods,
  resolveAgent,
  sessionModels,
} from '@nocobase/acp-bridge/client';
import type { SessionNotification } from '@nocobase/acp-bridge/client';
import { programFingerprint } from './program-fingerprint.ts';
import { withDetectionEnvironment } from './detection.ts';
import { EventQueue } from './echo.ts';
import { capInput, capText } from './codex/util.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AdapterSession,
  AgentAdapter,
  ToolDetection,
} from './types.ts';
import {
  AcpToolModelSchema,
  MAX_TOOL_MODELS,
  MAX_STATUS_DETAIL_LENGTH,
  createRedactor,
  type ToolCapabilities,
  type AgentTool,
  type ToolStatusReason,
} from '../../protocol/index.ts';

const CLIENT = { name: 'nocobase-runner', version: '1' };

/** `message`, redacted and with its control characters stripped; empty becomes absent. */
function sanitizeMessage(
  message: string,
  maxLength: number,
): string | undefined {
  const redacted = createRedactor()
    .text(message)
    // eslint-disable-next-line no-control-regex -- stripping the control characters the protocol schemas refuse.
    .replace(/[\u0000-\u001f\u007f]/gu, ' ')
    .trim();
  return redacted ? redacted.slice(0, maxLength) : undefined;
}

/** The tool's own words about a detection failure, cut to what `ToolInfo.statusDetail` accepts. */
export function statusDetailOf(message: string): string | undefined {
  return sanitizeMessage(message, MAX_STATUS_DETAIL_LENGTH);
}

/** How long a run failure's message may be: generous enough for an ACP error's own detail, far under `FailRequest.detail`. */
const MAX_RUN_FAILURE_MESSAGE_LENGTH = 2000;

/** The tool's own words about a run failure, in place of a one-size-fits-all placeholder. */
export function runFailureMessage(error: unknown, fallback: string): string {
  return (
    sanitizeMessage(errorMessage(error), MAX_RUN_FAILURE_MESSAGE_LENGTH) ??
    fallback
  );
}

/** How the ACP handshake or first session failed, when `error` says enough to tell. */
export function classifyHandshakeFailure(error: unknown): {
  status: 'needsLogin' | 'failed';
  reason?: ToolStatusReason;
} {
  if (isAuthRequired(error))
    return { status: 'needsLogin', reason: 'notLoggedIn' };
  const message = error instanceof Error ? error.message : String(error);
  if (
    /did not answer within|detection cancelled|agent exited before/iu.test(
      message,
    )
  )
    return { status: 'failed', reason: 'timeout' };
  // A generic heuristic, not tool-specific wording confirmed against a real handshake failure (goose with no
  // provider set, for one): most agents name the missing piece when they refuse to start a session over it.
  if (
    /\bno (?:model|provider)\b|\bprovider\b.{0,20}\b(?:missing|not set|required)\b|\bnot configured\b/iu.test(
      message,
    )
  )
    return { status: 'failed', reason: 'notConfigured' };
  return { status: 'failed', reason: 'startFailed' };
}

/**
 * Whether `resolved` really is `spec`'s agent, when it declares `identify`: false when the program's own output to
 * the identify probe matches the reject pattern (another program of the same name). True when it declares none, or
 * the probe itself could not be run or timed out — an agent CLI that does not answer `identify.args` cleanly is for
 * its own handshake to fail on, not for this heuristic to guess about.
 */
export function identifyProgram(
  resolved: ResolvedAgent,
  spec: AgentSpec,
  env: Record<string, string>,
  signal: AbortSignal,
): Promise<boolean> {
  if (!spec.identify) return Promise.resolve(true);
  const { args, reject, timeoutMs = 5000 } = spec.identify;
  return new Promise((resolvePromise) => {
    const child = execFile(
      resolved.command,
      args,
      { env, timeout: timeoutMs, windowsHide: true },
      (_error, stdout, stderr) =>
        resolvePromise(!reject.test(`${stdout}${stderr}`)),
    );
    signal.addEventListener('abort', () => child.kill(), { once: true });
  });
}

export function createAcpAdapter(
  spec: AgentSpec,
  env: Record<string, string>,
): AgentAdapter {
  return {
    kind: spec.id as AgentTool,
    features: () => [],
    fingerprint: async () => {
      const resolved = await resolveAgent(spec, env);
      return programFingerprint(resolved?.command, resolved?.args);
    },
    detect: (signal) => inspect(spec, env, signal),
    start: (session) => start(spec, session),
  };
}

async function inspect(
  spec: AgentSpec,
  env: Record<string, string>,
  stop?: AbortSignal,
): Promise<ToolDetection & ToolCapabilities> {
  const deadline = AbortSignal.timeout(30_000);
  const signal = stop ? AbortSignal.any([stop, deadline]) : deadline;
  signal.throwIfAborted();
  const resolved = await resolveAgent(spec, env);
  if (!resolved)
    return { installed: false, authenticated: false, status: 'notInstalled' };
  if (!(await identifyProgram(resolved, spec, env, signal)))
    return {
      installed: false,
      authenticated: false,
      status: 'notInstalled',
      statusReason: 'otherProgram',
      statusDetail: statusDetailOf(
        `${resolved.command} answers to ${spec.identify!.args.join(' ')} like a different program.`,
      ),
    };
  return withDetectionEnvironment(
    signal,
    async (cwd, guardedEnv) => {
      let process: AgentProcess | undefined;
      try {
        process = await AgentProcess.start(resolved, {
          cwd,
          env: guardedEnv,
          client: CLIENT,
          signal,
          initializeTimeoutMs: 30_000,
          permissionDefaults: false,
          handlers: {
            update: () => {},
            permission: () =>
              Promise.resolve({ outcome: { outcome: 'cancelled' } }),
          },
        });
        const opened = await process.agent.request(methods.agent.session.new, {
          cwd,
          mcpServers: [],
        });
        const models = spec.modelsAreNotModels
          ? undefined
          : sessionModels(opened);
        const safe =
          models === undefined
            ? undefined
            : [
                ...new Map(
                  models.slice(0, MAX_TOOL_MODELS).flatMap((model) => {
                    const base = AcpToolModelSchema.safeParse({ id: model.id });
                    if (!base.success) return [];
                    const named = AcpToolModelSchema.safeParse(model);
                    return [
                      [
                        model.id,
                        named.success ? named.data : base.data,
                      ] as const,
                    ];
                  }),
                ).values(),
              ];
        const version = process.initialize.agentInfo?.version;
        const safeVersion =
          version &&
          version.length <= 64 &&
          createRedactor().text(version) === version
            ? version
            : undefined;
        // Amp v0.9.0 initializes and opens sessions without checking credentials. Its authenticate implementation
        // acknowledges a configured adapter key, but AUTH_REQUIRED says nothing about the native CLI's accounts.
        // See https://github.com/tao12345666333/amp-acp/blob/v0.9.0/src/server.ts#L218 and src/index.ts#L171.
        // Never infer state from authMethods, including an empty list. Unknown implementations remain failed.
        if (spec.signInUnconfirmable) {
          const check = spec.authenticationCheck;
          const supported =
            check &&
            process.initialize.agentInfo?.name === check.agentName &&
            check.versions.includes(safeVersion ?? '');
          let confirmed = false;
          let detail = `${spec.name} ${safeVersion ?? '(release unknown)'} has no reviewed noninteractive authentication check. The handshake cannot confirm login; use an adapter with a supported authentication check, then detect again.`;
          if (supported) {
            try {
              await process.agent.request(methods.agent.authenticate, {
                methodId: check.methodId,
              });
              confirmed = true;
            } catch (error) {
              detail = isAuthRequired(error)
                ? check.unconfirmedDetail
                : `${spec.name}'s authentication check failed: ${errorMessage(error)}`;
            }
          }
          if (!confirmed)
            return {
              installed: true,
              path: resolved.command,
              version: safeVersion,
              authenticated: false,
              status: 'failed',
              statusReason: 'signInUnconfirmed',
              statusDetail: statusDetailOf(detail),
            };
        }
        return {
          installed: true,
          path: resolved.command,
          version: safeVersion,
          authenticated: true,
          status: 'ready',
          ...(safe ? { models: safe } : {}),
          modelsDetectionStatus:
            models === undefined
              ? 'unsupported'
              : models.length > 0 && !safe?.length
                ? 'failed'
                : 'detected',
          modelsDetectedAt: new Date().toISOString(),
        };
      } catch (error) {
        const classified = classifyHandshakeFailure(error);
        const detail = statusDetailOf(
          error instanceof Error ? error.message : String(error),
        );
        return {
          installed: true,
          path: resolved.command,
          authenticated: false,
          status: classified.status,
          ...(classified.reason ? { statusReason: classified.reason } : {}),
          ...(detail ? { statusDetail: detail } : {}),
        };
      } finally {
        await process?.stop();
      }
    },
    env,
    { guardHostCli: true },
  );
}

/** How long a run of same-typed text/thinking chunks may accumulate before it becomes one event. */
const MERGE_FLUSH_MS = 1000;
/** How large the accumulated text of one merged event may grow before it flushes early. */
const MERGE_FLUSH_BYTES = 4 * 1024;

function start(spec: AgentSpec, session: AdapterSession): AdapterHandle {
  const events = new EventQueue<AdapterEvent>();
  let process: AgentProcess | undefined;
  let sessionId: string | undefined;
  let replaying = false;
  let cancelled = false;
  let finished = false;
  let summary = '';
  const opening = new AbortController();
  const toolCalls = new Map<
    string,
    { name: string; input: unknown; finished: boolean }
  >();
  const emit = (event: Omit<AdapterEvent, 'at'>): void => {
    if (replaying || finished) return;
    const content =
      event.content === undefined || event.meta?.output
        ? undefined
        : capText(event.content);
    const output =
      event.output === undefined ? undefined : capText(event.output);
    const input = event.input === undefined ? undefined : capInput(event.input);
    events.push({
      ...event,
      ...(content ? { content: content.text } : {}),
      ...(output ? { output: output.text } : {}),
      ...(input ? { input: input.input } : {}),
      meta: {
        ...event.meta,
        ...(content?.truncated || output?.truncated || input?.truncated
          ? { truncated: true }
          : {}),
      },
      at: new Date().toISOString(),
    });
  };
  const streaming = new StreamOutput(emit);
  let chunkId = 0;
  let chunkType: 'text' | 'thinking' | undefined;
  let streamPieces: string[] = [];
  const flushStreamChunk = (interrupted = false): void => {
    if (chunkType) {
      if (interrupted) streaming.close(String(chunkId));
      else
        streaming.complete(String(chunkId), chunkType, streamPieces.join(''));
    }
    streamPieces = [];
    chunkType = undefined;
  };
  const emitStreamChunk = (type: 'text' | 'thinking', text: string): void => {
    if (replaying || finished) return;
    if (chunkType !== type) {
      flushStreamChunk();
      chunkType = type;
      chunkId++;
    }
    streamPieces.push(text);
    streaming.delta(String(chunkId), type, text);
  };
  // Zed-style agents stream a text or thinking turn as dozens of small chunks, one `session/update` each. Buffering
  // consecutive same-typed chunks into one event cuts that to about one a second, in the order they arrived; anything
  // else (a tool call, the run ending) flushes what is pending first, so order never changes.
  let pendingChunk: { type: 'text' | 'thinking'; content: string } | undefined;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  const flushLegacyChunk = (): void => {
    if (pendingTimer !== undefined) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    if (!pendingChunk) return;
    const chunk = pendingChunk;
    pendingChunk = undefined;
    emit({ type: chunk.type, content: chunk.content });
  };
  const emitLegacyChunk = (type: 'text' | 'thinking', text: string): void => {
    if (replaying || finished) return;
    pendingChunk =
      pendingChunk && pendingChunk.type === type
        ? { type, content: pendingChunk.content + text }
        : (flushLegacyChunk(), { type, content: text });
    if (pendingChunk.content.length >= MERGE_FLUSH_BYTES) {
      flushLegacyChunk();
      return;
    }
    pendingTimer ??= setTimeout(flushPendingChunk, MERGE_FLUSH_MS);
  };
  const flushPendingChunk = () =>
    session.outputBlocks ? flushStreamChunk() : flushLegacyChunk();
  const emitChunk = (type: 'text' | 'thinking', text: string) =>
    session.outputBlocks
      ? emitStreamChunk(type, text)
      : emitLegacyChunk(type, text);
  const update = ({ update }: SessionNotification): void => {
    if (replaying) return;
    if (
      (update.sessionUpdate === 'agent_message_chunk' ||
        update.sessionUpdate === 'agent_thought_chunk') &&
      update.content.type === 'text'
    ) {
      const text = update.content.text;
      if (update.sessionUpdate === 'agent_message_chunk')
        summary = (summary + text).slice(-64 * 1024);
      emitChunk(
        update.sessionUpdate === 'agent_message_chunk' ? 'text' : 'thinking',
        text,
      );
    } else if (
      update.sessionUpdate === 'tool_call' ||
      update.sessionUpdate === 'tool_call_update'
    ) {
      flushPendingChunk();
      const previous = toolCalls.get(update.toolCallId);
      const call = {
        name: update.title ?? previous?.name ?? 'Tool',
        input: update.rawInput ?? previous?.input,
        finished: previous?.finished ?? false,
      };
      if (!previous)
        emit({
          type: 'toolUse',
          tool: call.name,
          input: call.input,
          meta: { toolUseId: update.toolCallId },
        });
      if (
        !call.finished &&
        (update.status === 'completed' || update.status === 'failed')
      ) {
        call.finished = true;
        const output =
          update.rawOutput === undefined
            ? JSON.stringify(update.content ?? [])
            : typeof update.rawOutput === 'string'
              ? update.rawOutput
              : JSON.stringify(update.rawOutput);
        emit({
          type: 'toolResult',
          tool: call.name,
          output,
          meta: {
            toolUseId: update.toolCallId,
            isError: update.status === 'failed',
          },
        });
      }
      toolCalls.set(update.toolCallId, call);
    } else if (update.sessionUpdate === 'plan') {
      flushPendingChunk();
      emit({
        type: 'status',
        content: 'plan',
        meta: { plan: capInput(update.entries).input },
      });
    } else if (
      ['config_option_update', 'current_mode_update', 'usage_update'].includes(
        update.sessionUpdate,
      )
    ) {
      flushPendingChunk();
      emit({
        type: 'status',
        content: update.sessionUpdate,
        meta: { update: capInput(update).input },
      });
    }
  };
  let stopping: Promise<void> | undefined;
  const stop = (): Promise<void> =>
    (stopping ??= (async () => {
      cancelled = true;
      if (process && sessionId) {
        // Cancellation is a notification, followed by a bounded grace period for the turn to settle.
        void process.agent
          .notify(methods.agent.session.cancel, { sessionId })
          .catch(() => {});
        await Promise.race([
          result.then(() => {}),
          new Promise<void>((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
      opening.abort();
      await process?.stop();
    })());
  const aborted = (): void => {
    void stop();
  };
  session.abort.addEventListener('abort', aborted, { once: true });
  const result: Promise<AdapterResult> = (async () => {
    try {
      session.abort.throwIfAborted();
      const resolved = await resolveAgent(spec, session.env);
      if (!resolved)
        throw new Error('The selected coding tool is not installed.');
      process = await AgentProcess.start(resolved, {
        cwd: session.workDir,
        env: session.env,
        client: CLIENT,
        signal: opening.signal,
        handlers: {
          update,
          permission: async (request, signal) => {
            if (cancelled || signal.aborted)
              return { outcome: { outcome: 'cancelled' } };
            const decision = await session.permission(
              request.toolCall.title ?? 'Tool',
              { input: request.toolCall.rawInput },
            );
            if (cancelled || signal.aborted)
              return { outcome: { outcome: 'cancelled' } };
            flushPendingChunk();
            const option =
              decision === 'allow'
                ? (request.options.find(
                    (item) => item.kind === 'allow_always',
                  ) ??
                  request.options.find((item) => item.kind === 'allow_once'))
                : (request.options.find(
                    (item) => item.kind === 'reject_once',
                  ) ??
                  request.options.find(
                    (item) => item.kind === 'reject_always',
                  ));
            emit({
              type: 'permission',
              tool: request.toolCall.title ?? 'Tool',
              input: request.toolCall.rawInput,
              meta: { decision: decision === 'allow' ? 'allow' : 'deny' },
            });
            return {
              outcome: option
                ? { outcome: 'selected', optionId: option.optionId }
                : { outcome: 'cancelled' },
            };
          },
        },
      });
      const resumed = session.resumeSessionId
        ? await continueSession(
            process,
            session.resumeSessionId,
            session.workDir,
            (active) => {
              replaying = active;
            },
          )
        : undefined;
      const opened =
        resumed ??
        (await process.agent.request(methods.agent.session.new, {
          cwd: session.workDir,
          mcpServers: [],
        }));
      sessionId = resumed
        ? session.resumeSessionId
        : 'sessionId' in opened
          ? String(opened.sessionId)
          : undefined;
      if (!sessionId) throw new Error('The agent did not return a session id.');
      if (session.resumeSessionId && !resumed) {
        flushPendingChunk();
        emit({
          type: 'status',
          content: 'sessionRecovery',
          meta: { reason: 'The agent could not continue the earlier session.' },
        });
      }
      await configureSession(process, sessionId, opened, spec, session.model);
      if (cancelled) return { exit: 'aborted', usage: [], sessionId };
      const response = await process.agent.request(
        methods.agent.session.prompt,
        {
          sessionId,
          prompt: [
            { type: 'text', text: session.systemPrompt },
            ...(session.skills
              ? [
                  {
                    type: 'text' as const,
                    text: `Read the provided skills in ${session.skills.dir}: ${session.skills.slugs.join(', ')}.`,
                  },
                ]
              : []),
            { type: 'text', text: session.prompt },
          ],
        },
      );
      const usage = response.usage
        ? [
            {
              tool: spec.id as AgentTool,
              ...(session.model ? { model: session.model } : {}),
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              ...(response.usage.cachedReadTokens == null
                ? {}
                : { cacheReadTokens: response.usage.cachedReadTokens }),
              ...(response.usage.cachedWriteTokens == null
                ? {}
                : { cacheWriteTokens: response.usage.cachedWriteTokens }),
              ...(response.usage.thoughtTokens == null
                ? {}
                : { reasoningTokens: response.usage.thoughtTokens }),
            },
          ]
        : [];
      if (session.outputBlocks) flushStreamChunk();
      else flushLegacyChunk();
      if (usage.length) emit({ type: 'usage', meta: { usage } });
      if (cancelled || response.stopReason === 'cancelled')
        return { exit: 'aborted', usage, sessionId };
      if (response.stopReason !== 'end_turn')
        return {
          exit: 'error',
          usage,
          sessionId,
          error: {
            reason:
              response.stopReason === 'max_tokens'
                ? 'contextOverflow'
                : 'toolProcess',
            message: `The agent stopped: ${response.stopReason}.`,
          },
        };
      return { exit: 'completed', usage, sessionId, summary };
    } catch (error) {
      if (session.outputBlocks && cancelled) flushStreamChunk();
      return {
        exit: cancelled ? 'aborted' : 'error',
        usage: [],
        ...(sessionId ? { sessionId } : {}),
        error: {
          reason: isAuthRequired(error)
            ? 'toolAuth'
            : error instanceof ModelSelectionError
              ? 'modelUnavailable'
              : 'toolProcess',
          message: isAuthRequired(error)
            ? `${spec.name} requires login on the runner. Run ${spec.signIn} there, then detect again. (${runFailureMessage(error, 'no further detail from the tool.')})`
            : error instanceof ModelSelectionError
              ? error.message
              : runFailureMessage(
                  error,
                  'The ACP agent could not complete the request.',
                ),
        },
      };
    } finally {
      if (session.outputBlocks) flushStreamChunk(true);
      else flushLegacyChunk();
      session.abort.removeEventListener('abort', aborted);
      await process?.stop();
      finished = true;
      events.close();
    }
  })();
  return { events, result, steer: () => Promise.resolve(false), stop };
}

export function acpSpec(id: string): AgentSpec | undefined {
  return AGENTS.find((spec) => spec.id === id);
}
