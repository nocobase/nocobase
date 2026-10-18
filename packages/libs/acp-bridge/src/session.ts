/**
 * One application session on this computer: its agent process and ACP session, the prompts waiting for their turn and
 * the permission requests waiting for a person. What it observes goes out through `SessionContext.emit`, and its
 * `state` is read whenever the bridge reports.
 *
 * The agent process starts with the first command that needs it and keeps the session until the session closes or the
 * process dies; the next command then starts a new process and continues the agent's own session (`session/resume`,
 * or `session/load` without reporting the history it replays). The person's choices (`SessionTarget.settings`) and
 * the agent's full-access mode (`AgentSpec.modes`) are applied every time the session opens. A new session may instead
 * take over the agent that discovering its choices started (`SessionContext.warm`), already initialized with an open
 * ACP session, and only apply its choices. While the agent opens, `startup` says what the bridge is doing.
 */
import { randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';

import * as acp from '@agentclientprotocol/sdk';

import {
  AgentProcess,
  errorMessage,
  isAuthRequired,
  type AgentClientHandlers,
} from './agent-process.js';
import { allowedDir } from './folders.js';
import type { ResolvedAgent } from './agents.js';
import {
  MAX_EVENT_TEXT,
  type DiscoveredChoices,
  type BridgeCommand,
  type BridgeEvent,
  type PromptContent,
  type SessionChoice,
  type SessionStartup,
  type SessionState,
  type SessionTarget,
  type TurnUsage,
} from './protocol.js';

export interface SessionContext {
  /** Must authorize before opening an agent or sending a prompt; transport failures keep the head waiting. */
  readonly claim?:
    | ((promptId: string, seq: number | undefined) => Promise<boolean>)
    | undefined;
  readonly client: acp.Implementation;
  readonly env: NodeJS.ProcessEnv;
  /** The directories sessions may work in. */
  readonly roots: readonly string[];
  /** How to start an agent here; throws a message for the person when it cannot start. */
  readonly resolve: (agentId: string) => Promise<ResolvedAgent>;
  readonly emit: (event: BridgeEvent) => void;
  readonly stateChanged: () => void;
  /** Discovery cannot grant tool permissions and is bounded by the bridge's shutdown/timeout signal. */
  readonly discoverySignal?: AbortSignal | undefined;
  readonly prepareSession?:
    | ((agentId: string, sessionId: string) => Promise<NodeJS.ProcessEnv>)
    | undefined;
  /** Local instructions prepended to each ACP prompt, including after resume or discovery takeover. */
  readonly sessionInstructions?:
    | ((agentId: string, sessionId: string) => Promise<string | undefined>)
    | undefined;
  /** The agent discovering this new session's choices started for it, to take over instead of starting another. */
  readonly warm?: Promise<WarmAgent | undefined> | undefined;
}

/**
 * An agent that discovering a new session's choices started for that session (`BridgeSession.release`): its process,
 * with the session's environment, and the ACP session it opened, waiting for the session's first prompt.
 */
export interface WarmAgent {
  readonly agentId: string;
  readonly process: AgentProcess;
  readonly acpSessionId: string;
  readonly choices: readonly SessionChoice[];
  readonly modesOnly: boolean;
  readonly configurationSupported: boolean;
  /** What the agent said about its session since the discovery answered, for the session that takes it over. */
  readonly updates: readonly acp.SessionNotification[];
}

/** How long a permission request waits for a person before it is declined. */
const PERMISSION_TIMEOUT_MS = 30 * 60_000;

/** The commands that act on a session, each naming it in full. */
type SessionCommand = Extract<
  BridgeCommand,
  { readonly session: SessionTarget }
>;
type Resolution = 'answered' | 'cancelled' | 'timedOut';
type OpenedSession = Pick<acp.NewSessionResponse, 'configOptions' | 'modes'>;

export class BridgeSession {
  readonly #context: SessionContext;
  #target: SessionTarget;
  #acpSessionId: string | null;
  #process: AgentProcess | undefined;
  #opening: Promise<AgentProcess> | undefined;
  #replaying = false;
  #initialized = false;
  #closed = false;
  #choices: SessionChoice[] = [];
  /** The agent offers session modes and no configuration options: the `mode` choice is set with `session/set_mode`. */
  #modesOnly = false;
  /** The agent offers no full-access mode, so the session allows what it asks permission for (`AgentSpec.allowAll`). */
  #allowAll = false;
  #commands: SessionState['commands'] = [];
  #title: string | null = null;
  #usage: SessionState['context'] = null;
  #configurationSupported = false;
  #startup: SessionStartup | null = null;
  #warm: Promise<WarmAgent | undefined> | undefined;
  readonly #queue: {
    readonly promptId: string;
    readonly seq?: number | undefined;
    readonly content: readonly PromptContent[];
  }[] = [];
  readonly #seen = new Set<string>();
  #pumping = false;
  #pending:
    | { readonly promptId: string; removed: boolean; cancelled: boolean }
    | undefined;
  #turn: string | undefined;
  /** The running turn was cancelled; until its prompt reaches the agent, only this remembers it. */
  #turnCancelled = false;
  readonly #permissions = new Map<
    string,
    (optionId: string | null, resolution: Resolution) => void
  >();

  constructor(target: SessionTarget, context: SessionContext) {
    this.#target = target;
    this.#acpSessionId = target.acpSessionId;
    this.#context = context;
    this.#warm = context.warm;
  }

  /** Opens an isolated ACP session without a prompt; the caller always closes this disposable session. */
  async discover(): Promise<DiscoveredChoices> {
    await this.#open();
    return {
      status: this.#configurationSupported ? 'available' : 'unsupported',
      choices: this.#choices,
    };
  }

  /**
   * Hands the agent this discovery opened to the session it was started for, instead of stopping it: the process keeps
   * its open ACP session and remembers what the agent says until a session takes it over. Undefined when there is no
   * agent to hand over; after it, closing this discovery leaves the agent running.
   */
  release(): WarmAgent | undefined {
    const agent = this.#process;
    if (!this.#initialized || !this.#acpSessionId || !agent?.alive)
      return undefined;
    this.#process = undefined;
    this.#initialized = false;
    const updates: acp.SessionNotification[] = [];
    agent.handOver({
      update: (notification) => updates.push(notification),
      // No one can answer for the agent before its session takes it over.
      permission: () => Promise.resolve({ outcome: { outcome: 'cancelled' } }),
    });
    return {
      agentId: this.#target.agentId,
      process: agent,
      acpSessionId: this.#acpSessionId,
      choices: this.#choices,
      modesOnly: this.#modesOnly,
      configurationSupported: this.#configurationSupported,
      updates,
    };
  }

  /** What the bridge is doing to open the agent, null when it is open or not opening. */
  get startup(): SessionStartup | null {
    return this.#startup;
  }

  /** Null until the agent's session is open and its explicit settings have been validated. */
  get state(): SessionState | null {
    if (!this.#initialized || !this.#acpSessionId || !this.#process)
      return null;
    return {
      acpSessionId: this.#acpSessionId,
      agent: this.#process.description,
      choices: this.#choices,
      commands: this.#commands,
      title: this.#title,
      context: this.#usage,
    };
  }

  handle(command: SessionCommand): void {
    if (this.#closed) return;
    this.#target = command.session;
    switch (command.type) {
      case 'prompt':
        if (this.#seen.has(command.promptId)) return;
        this.#seen.add(command.promptId);
        this.#queue.push({
          promptId: command.promptId,
          seq: command.seq,
          content: command.content,
        });
        void this.#pump();
        return;
      case 'cancel':
        this.#cancel();
        return;
      case 'permission':
        this.#permissions.get(command.requestId)?.(
          command.optionId,
          'answered',
        );
        return;
      case 'choose':
        void this.#choose(command.choiceId, command.value);
        return;
    }
  }

  /** Removes one waiting prompt, including a head waiting for authorization; never cancels a running turn. */
  withdraw(promptId: string): boolean {
    if (this.#turn === promptId) return false;
    this.#seen.add(promptId);
    const index = this.#queue.findIndex((item) => item.promptId === promptId);
    if (index >= 0) this.#queue.splice(index, 1);
    if (this.#pending?.promptId === promptId) this.#pending.removed = true;
    return true;
  }

  async close(): Promise<void> {
    this.#closed = true;
    this.#cancel();
    await (this.#opening?.catch(() => undefined) ?? Promise.resolve());
    await this.#process?.stop();
    // Closed before its first prompt took over the agent started for it.
    const warm = this.#warm;
    this.#warm = undefined;
    await (await warm?.catch(() => undefined))?.process.stop();
  }

  async #pump(): Promise<void> {
    if (this.#pumping || this.#closed) return;
    const next = this.#queue.shift();
    if (!next) return;
    this.#pumping = true;
    const pending = {
      promptId: next.promptId,
      removed: false,
      cancelled: false,
    };
    this.#pending = pending;
    const execute = this.#context.claim
      ? await this.#context.claim(next.promptId, next.seq)
      : true;
    this.#pending = undefined;
    if (!execute || pending.removed || this.#closed) {
      this.#pumping = false;
      void this.#pump();
      return;
    }
    this.#turn = next.promptId;
    this.#turnCancelled = pending.cancelled;
    this.#emit({ kind: 'turnStarted', at: now(), promptId: next.promptId });
    let stopReason: string | null = null;
    let usage: TurnUsage | null = null;
    let error: string | null = null;
    try {
      if (pending.cancelled) {
        stopReason = 'cancelled';
        return;
      }
      const agent = await this.#open();
      const instructions = await this.#context.sessionInstructions?.(
        this.#target.agentId,
        this.#target.id,
      );
      // Cancelled while the agent was starting, which it never heard: the prompt is not sent at all.
      if (this.#turnCancelled) {
        stopReason = 'cancelled';
      } else {
        const response = await agent.agent.request(
          acp.methods.agent.session.prompt,
          {
            sessionId: this.#acpSessionId!,
            prompt: [
              ...(instructions
                ? [{ type: 'text' as const, text: instructions }]
                : []),
              ...next.content.map(toContentBlock),
            ],
          },
        );
        stopReason = response.stopReason;
        usage = response.usage ? usageOf(response.usage) : null;
      }
    } catch (cause) {
      error = this.#explain(cause);
      if (isAuthRequired(cause)) {
        // A process may retain the login state it read at start. Continue this session in a fresh process next time.
        const failed = this.#process;
        this.#process = undefined;
        await failed?.stop();
      }
    } finally {
      this.#resolvePermissions('cancelled');
      this.#turn = undefined;
      this.#pumping = false;
      this.#emit({
        kind: 'turnEnded',
        seq: next.seq,
        at: now(),
        promptId: next.promptId,
        stopReason,
        usage,
        error,
      });
      void this.#pump();
    }
  }

  #cancel(): void {
    if (this.#pending) this.#pending.cancelled = true;
    for (const dropped of this.#queue.splice(0)) {
      this.#emit({
        kind: 'turnEnded',
        seq: dropped.seq,
        at: now(),
        promptId: dropped.promptId,
        stopReason: 'cancelled',
        usage: null,
        error: null,
      });
    }
    this.#resolvePermissions('cancelled');
    if (this.#turn !== undefined) this.#turnCancelled = true;
    if (
      this.#turn !== undefined &&
      this.#acpSessionId &&
      this.#process?.alive
    ) {
      this.#process.agent
        .notify(acp.methods.agent.session.cancel, {
          sessionId: this.#acpSessionId,
        })
        .catch(() => undefined);
    }
  }

  async #choose(choiceId: string, value: string): Promise<void> {
    try {
      const agent = await this.#open();
      const choice = this.#choices.find(
        (candidate) => candidate.id === choiceId,
      );
      if (choice && choice.currentValue !== value)
        await this.#set(agent, choice, value);
    } catch (cause) {
      this.#emit({
        kind: 'notice',
        at: now(),
        level: 'error',
        message: this.#explain(cause),
      });
    }
  }

  #open(): Promise<AgentProcess> {
    if (this.#initialized && this.#process?.alive && this.#acpSessionId)
      return Promise.resolve(this.#process);
    this.#opening ??= this.#start().finally(() => {
      this.#opening = undefined;
    });
    return this.#opening;
  }

  async #start(): Promise<AgentProcess> {
    this.#initialized = false;
    await this.#process?.stop();
    this.#process = undefined;
    const target = this.#target;
    const warm = await this.#takeWarm(target);
    this.#phase(warm ? 'configuring' : 'starting');
    let agent: AgentProcess;
    let resolved: ResolvedAgent;
    try {
      resolved = await this.#context.resolve(target.agentId);
      if (warm) {
        agent = warm.process;
      } else {
        const cwd = await this.#workDir(target.cwd);
        // A discovery prepares a session only when it was started for one, which may take its agent over.
        const sessionEnv = this.#context.prepareSession
          ? await this.#context.prepareSession(target.agentId, target.id)
          : {};
        agent = await AgentProcess.start(resolved, {
          cwd,
          env: { ...this.#context.env, ...sessionEnv },
          client: this.#context.client,
          handlers: this.#handlers(),
          signal: this.#context.discoverySignal,
        });
      }
    } catch (cause) {
      await warm?.process.stop();
      this.#phase(null);
      throw cause;
    }
    try {
      if (warm) {
        agent.handOver(this.#handlers());
        this.#acpSessionId = warm.acpSessionId;
        this.#configurationSupported = warm.configurationSupported;
        this.#choices = [...warm.choices];
        this.#modesOnly = warm.modesOnly;
        this.#process = agent;
        for (const notification of warm.updates) this.#update(notification);
      } else {
        this.#phase('opening');
        const cwd = await this.#workDir(target.cwd);
        const mcpServers: acp.McpServer[] = [];
        let opened = this.#acpSessionId
          ? await this.#continue(agent, this.#acpSessionId, cwd, mcpServers)
          : undefined;
        if (!opened) {
          const created = await agent.agent.request(
            acp.methods.agent.session.new,
            { cwd, mcpServers },
          );
          this.#acpSessionId = created.sessionId;
          opened = created;
        }
        this.#process = agent;
        this.#configurationSupported =
          opened.configOptions != null || opened.modes != null;
        this.#readChoices(opened.configOptions, opened.modes);
      }
      this.#allowAll = resolved.spec.allowAll === true;
      this.#phase('configuring');
      await this.#applySettings(
        agent,
        resolved.spec.modes ?? [],
        target.settings,
      );
      this.#initialized = true;
      this.#startup = null;
      this.#context.stateChanged();
      return agent;
    } catch (cause) {
      this.#phase(null);
      await agent.stop();
      this.#process = undefined;
      // A failed opening must retry initialization and explicit settings before any later prompt.
      this.#acpSessionId = target.acpSessionId;
      if (isAuthRequired(cause)) {
        throw new Error(
          `${resolved.spec.name} is not signed in on this computer. Run \`${resolved.spec.signIn}\` in a terminal there and sign in, then ${this.#context.discoverySignal ? 'retry settings' : 'send the message again'}.`,
          { cause },
        );
      }
      throw new Error(agent.explain(cause), { cause });
    }
  }

  /**
   * The agent started for this session while its choices were discovered, once: when it is still running and the
   * session has not opened an ACP session of its own. One it cannot use is stopped.
   */
  async #takeWarm(target: SessionTarget): Promise<WarmAgent | undefined> {
    const pending = this.#warm;
    this.#warm = undefined;
    if (!pending) return undefined;
    this.#phase('starting');
    const warm = await pending.catch(() => undefined);
    if (!warm) return undefined;
    if (
      warm.process.alive &&
      warm.agentId === target.agentId &&
      this.#acpSessionId === null &&
      !this.#closed
    )
      return warm;
    await warm.process.stop();
    return undefined;
  }

  #handlers(): AgentClientHandlers {
    return {
      update: (notification) => this.#update(notification),
      permission: (request, signal) => this.#permission(request, signal),
    };
  }

  #phase(startup: SessionStartup | null): void {
    if (this.#startup === startup) return;
    this.#startup = startup;
    this.#context.stateChanged();
  }

  /** Continues the agent's earlier session, or says why it cannot and returns undefined. */
  async #continue(
    agent: AgentProcess,
    sessionId: string,
    cwd: string,
    mcpServers: acp.McpServer[],
  ): Promise<OpenedSession | undefined> {
    const capabilities = agent.initialize.agentCapabilities;
    let reason = 'the agent cannot continue earlier sessions';
    try {
      if (capabilities?.sessionCapabilities?.resume) {
        return await agent.agent.request(acp.methods.agent.session.resume, {
          sessionId,
          cwd,
          mcpServers,
        });
      }
      if (capabilities?.loadSession) {
        this.#replaying = true;
        return (
          (await agent.agent.request(acp.methods.agent.session.load, {
            sessionId,
            cwd,
            mcpServers,
          })) ?? {}
        );
      }
    } catch (cause) {
      if (isAuthRequired(cause)) throw cause;
      reason = errorMessage(cause);
    } finally {
      this.#replaying = false;
    }
    this.#acpSessionId = null;
    this.#emit({
      kind: 'notice',
      at: now(),
      level: 'warning',
      message: `The agent's earlier conversation could not be continued (${reason}), so this message starts a new one.`,
    });
    return undefined;
  }

  #readChoices(
    configOptions: readonly acp.SessionConfigOption[] | null | undefined,
    modes: acp.SessionModeState | null | undefined,
  ): void {
    const selects = (configOptions ?? []).flatMap((option): SessionChoice[] =>
      option.type === 'select'
        ? [
            {
              id: option.id,
              name: option.name,
              ...(option.category ? { category: option.category } : {}),
              currentValue: option.currentValue,
              options: option.options
                .flatMap((entry) =>
                  'group' in entry ? entry.options : [entry],
                )
                .map(valueOf),
            },
          ]
        : [],
    );
    if (selects.length > 0 || !modes) {
      this.#choices = selects;
      this.#modesOnly = false;
      return;
    }
    this.#modesOnly = true;
    this.#choices = [
      {
        id: 'mode',
        name: 'Mode',
        category: 'mode',
        currentValue: modes.currentModeId,
        options: modes.availableModes.map((mode) =>
          valueOf({
            value: mode.id,
            name: mode.name,
            description: mode.description,
          }),
        ),
      },
    ];
  }

  /** Applies the first of the agent's full-access modes it offers, then what the person chose, wherever they differ. */
  async #applySettings(
    agent: AgentProcess,
    fullAccess: readonly string[],
    settings: Readonly<Record<string, string>>,
  ): Promise<void> {
    const mode = this.#choices.find((choice) => choice.category === 'mode');
    const defaultMode = fullAccess.find((value) =>
      mode?.options.some((option) => option.value === value),
    );
    const wanted: Record<string, string> = {
      ...(mode && defaultMode ? { [mode.id]: defaultMode } : {}),
      ...settings,
    };
    const modelId = this.#choices.find(
      (choice) => choice.category === 'model',
    )?.id;
    const ordered = Object.entries(wanted).sort(
      ([a], [b]) => Number(b === modelId) - Number(a === modelId),
    );
    for (const [id, value] of ordered) {
      const choice = this.#choices.find((candidate) => candidate.id === id);
      if (!choice?.options.some((option) => option.value === value))
        throw new Error(
          `The agent no longer supports setting "${id}" to "${value}". Choose settings again before sending.`,
        );
      if (choice.currentValue !== value) {
        await this.#set(agent, choice, value);
      }
    }
    for (const [id, value] of Object.entries(wanted)) {
      if (
        this.#choices.find((choice) => choice.id === id)?.currentValue !== value
      )
        throw new Error(
          `The agent did not apply setting "${id}" to "${value}". Choose settings again before sending.`,
        );
    }
  }

  async #set(
    agent: AgentProcess,
    choice: SessionChoice,
    value: string,
  ): Promise<void> {
    const sessionId = this.#acpSessionId!;
    if (this.#modesOnly) {
      await agent.agent.request(acp.methods.agent.session.setMode, {
        sessionId,
        modeId: value,
      });
      this.#setCurrent(choice.id, value);
    } else {
      const response = await agent.agent.request(
        acp.methods.agent.session.setConfigOption,
        {
          sessionId,
          configId: choice.id,
          value,
        },
      );
      if (response.configOptions)
        this.#readChoices(response.configOptions, null);
      else this.#setCurrent(choice.id, value);
    }
    this.#context.stateChanged();
  }

  #setCurrent(choiceId: string, value: string): void {
    this.#choices = this.#choices.map((choice) =>
      choice.id === choiceId ? { ...choice, currentValue: value } : choice,
    );
  }

  #update(notification: acp.SessionNotification): void {
    if (this.#replaying) return;
    const update = notification.update;
    switch (update.sessionUpdate) {
      case 'current_mode_update': {
        const mode = this.#choices.find((choice) => choice.category === 'mode');
        if (mode) this.#setCurrent(mode.id, update.currentModeId);
        this.#context.stateChanged();
        return;
      }
      case 'config_option_update':
        this.#readChoices(update.configOptions, null);
        this.#context.stateChanged();
        return;
      case 'available_commands_update':
        this.#commands = update.availableCommands.map((command) => ({
          name: command.name,
          description: command.description,
        }));
        this.#context.stateChanged();
        return;
      case 'session_info_update':
        if (typeof update.title === 'string') {
          this.#title = update.title.slice(0, 500);
          this.#context.stateChanged();
        }
        return;
      case 'usage_update':
        this.#usage = {
          used: update.used,
          size: update.size,
          ...(update.cost
            ? {
                cost: {
                  amount: update.cost.amount,
                  currency: update.cost.currency,
                },
              }
            : {}),
        };
        this.#context.stateChanged();
        return;
      default:
        this.#emit({
          kind: 'update',
          at: now(),
          update: capStrings(update) as Record<string, unknown>,
        });
    }
  }

  async #permission(
    request: acp.RequestPermissionRequest,
    signal: AbortSignal,
  ): Promise<acp.RequestPermissionResponse> {
    if (this.#context.discoverySignal)
      return { outcome: { outcome: 'cancelled' } };
    if (this.#allowAll) {
      const allow =
        request.options.find((option) => option.kind === 'allow_always') ??
        request.options.find((option) => option.kind === 'allow_once');
      if (allow)
        return { outcome: { outcome: 'selected', optionId: allow.optionId } };
    }
    const requestId = randomUUID();
    this.#emit({
      kind: 'permissionRequested',
      at: now(),
      requestId,
      toolCall: capStrings(request.toolCall) as Record<string, unknown>,
      options: request.options.map(({ optionId, name, kind }) => ({
        optionId,
        name,
        kind,
      })),
    });
    const optionId = await new Promise<string | null>((resolve) => {
      const finish = (choice: string | null, resolution: Resolution) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        this.#permissions.delete(requestId);
        if (resolution !== 'answered') {
          this.#emit({
            kind: 'permissionResolved',
            at: now(),
            requestId,
            optionId: null,
            reason: resolution,
          });
        }
        // Left unanswered, the request is declined rather than the whole turn cancelled.
        resolve(
          resolution === 'timedOut'
            ? (request.options.find((option) => option.kind === 'reject_once')
                ?.optionId ?? null)
            : choice,
        );
      };
      const timer = setTimeout(
        () => finish(null, 'timedOut'),
        PERMISSION_TIMEOUT_MS,
      );
      const onAbort = () => finish(null, 'cancelled');
      signal.addEventListener('abort', onAbort, { once: true });
      this.#permissions.set(requestId, finish);
    });
    return optionId &&
      request.options.some((option) => option.optionId === optionId)
      ? { outcome: { outcome: 'selected', optionId } }
      : { outcome: { outcome: 'cancelled' } };
  }

  #resolvePermissions(resolution: Resolution): void {
    for (const finish of [...this.#permissions.values()])
      finish(null, resolution);
  }

  async #workDir(cwd: string): Promise<string> {
    const resolved = allowedDir(this.#context.roots, cwd);
    const info = await stat(resolved).catch(() => undefined);
    if (!info?.isDirectory())
      throw new Error(`${cwd} is not a directory on this computer.`);
    return resolved;
  }

  #explain(cause: unknown): string {
    return this.#process ? this.#process.explain(cause) : errorMessage(cause);
  }

  #emit(event: BridgeEvent): void {
    this.#context.emit(event);
  }
}

function toContentBlock(content: PromptContent): acp.ContentBlock {
  return content.type === 'text'
    ? { type: 'text', text: content.text }
    : { type: 'image', mimeType: content.mimeType, data: content.data };
}

function usageOf(usage: acp.Usage): TurnUsage {
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    ...(usage.cachedReadTokens == null
      ? {}
      : { cachedReadTokens: usage.cachedReadTokens }),
    ...(usage.cachedWriteTokens == null
      ? {}
      : { cachedWriteTokens: usage.cachedWriteTokens }),
    ...(usage.thoughtTokens == null
      ? {}
      : { thoughtTokens: usage.thoughtTokens }),
    totalTokens: usage.totalTokens,
  };
}

function valueOf(option: {
  readonly value: string;
  readonly name: string;
  readonly description?: string | null;
}): SessionChoice['options'][number] {
  return {
    value: option.value,
    name: option.name,
    ...(option.description ? { description: option.description } : {}),
  };
}

/** `value` with every string longer than `MAX_EVENT_TEXT` cut, so one huge tool output cannot fill a report. */
export function capStrings(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_EVENT_TEXT
      ? `${value.slice(0, MAX_EVENT_TEXT)}\n…[truncated]`
      : value;
  }
  if (Array.isArray(value)) return value.map(capStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, capStrings(entry)]),
    );
  }
  return value;
}

function now(): string {
  return new Date().toISOString();
}
