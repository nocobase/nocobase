/** Drives a catalog agent through the same ACP client used by personal sessions. */
import { realpath, stat } from 'node:fs/promises';
import { AGENTS } from '@nocobase/acp-bridge/catalog';
import type { AgentSpec } from '@nocobase/acp-bridge/catalog';
import {
  AgentProcess,
  configureSession,
  continueSession,
  isAuthRequired,
  ModelSelectionError,
  methods,
  resolveAgent,
  sessionModels,
} from '@nocobase/acp-bridge/client';
import type { SessionNotification } from '@nocobase/acp-bridge/client';
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
  createRedactor,
  type ToolCapabilities,
  type AgentTool,
} from '../../protocol/index.ts';

const CLIENT = { name: 'nocobase-runner', version: '1' };

/** A filesystem observation does not start the program or inspect account credentials. */
export async function programFingerprint(
  command: string | undefined,
  args: readonly string[] = [],
): Promise<string> {
  if (!command) return 'missing';
  try {
    const file = await realpath(command);
    const info = await stat(file);
    return JSON.stringify([command, file, args, info.mtimeMs, info.size]);
  } catch {
    return 'missing';
  }
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
  signal?: AbortSignal,
): Promise<ToolDetection & ToolCapabilities> {
  const resolved = await resolveAgent(spec, env);
  if (!resolved)
    return { installed: false, authenticated: false, status: 'notInstalled' };
  return withDetectionEnvironment(
    signal,
    async (cwd) => {
      let process: AgentProcess | undefined;
      try {
        process = await AgentProcess.start(resolved, {
          cwd,
          env,
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
        const models = sessionModels(opened);
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
        return {
          installed: true,
          path: resolved.command,
          authenticated: false,
          status: isAuthRequired(error) ? 'needsLogin' : 'failed',
        };
      } finally {
        await process?.stop();
      }
    },
    env,
  );
}

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
      event.content === undefined ? undefined : capText(event.content);
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
      emit({
        type:
          update.sessionUpdate === 'agent_message_chunk' ? 'text' : 'thinking',
        content: text,
      });
    } else if (
      update.sessionUpdate === 'tool_call' ||
      update.sessionUpdate === 'tool_call_update'
    ) {
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
    } else if (update.sessionUpdate === 'plan')
      emit({
        type: 'status',
        content: 'plan',
        meta: { plan: capInput(update.entries).input },
      });
    else if (
      ['config_option_update', 'current_mode_update', 'usage_update'].includes(
        update.sessionUpdate,
      )
    )
      emit({
        type: 'status',
        content: update.sessionUpdate,
        meta: { update: capInput(update).input },
      });
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
      if (session.resumeSessionId && !resumed)
        emit({
          type: 'status',
          content: 'sessionRecovery',
          meta: { reason: 'The agent could not continue the earlier session.' },
        });
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
            ? `${spec.name} requires login on the runner. Run ${spec.signIn} there, then detect again.`
            : error instanceof ModelSelectionError
              ? error.message
              : 'The ACP agent could not complete the request.',
        },
      };
    } finally {
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
