/**
 * A stand-in for the Agent SDK's `query()`: replays scripted SDK messages
 * and lets a script read the streaming input and invoke the permission
 * callbacks the way Claude Code does.
 */
import type {
  ModelInfo,
  Options,
  SDKMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';

export interface FakeContext {
  options: Options;
  /** Model-facing text from hook denials or permission callbacks. */
  toolFeedback: string[];
  /** Next user message from the streaming input; undefined once it is closed. */
  nextInput(): Promise<SDKUserMessage | undefined>;
  /** Run the PreToolUse hook, then canUseTool when the hook does not deny. */
  callTool(
    name: string,
    input: Record<string, unknown>,
    toolUseId: string,
  ): Promise<'allow' | 'deny'>;
  /** Resolves when the abort controller fires. */
  aborted: Promise<void>;
}

export type FakeScript = (ctx: FakeContext) => AsyncGenerator<SDKMessage, void>;

export interface FakeCall {
  options: Options;
  closed: boolean;
}

export const calls: FakeCall[] = [];

let script: FakeScript = async function* () {};

export function setScript(next: FakeScript): void {
  script = next;
}

let models: (options: Options) => Promise<ModelInfo[]> = async () => [];

/** What `supportedModels()` answers. */
export function setSupportedModels(
  next: (options: Options) => Promise<ModelInfo[]>,
): void {
  models = next;
}

export function replay(messages: readonly SDKMessage[]): FakeScript {
  return async function* (ctx) {
    await ctx.nextInput();
    for (const message of messages) yield message;
  };
}

export function fakeQuery({
  prompt,
  options = {},
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): AsyncGenerator<SDKMessage, void> & {
  close(): void;
  supportedModels(): Promise<ModelInfo[]>;
} {
  const call: FakeCall = { options, closed: false };
  calls.push(call);
  if (typeof prompt === 'string')
    throw new Error('the adapter must use streaming input');
  const iterator = prompt[Symbol.asyncIterator]();
  const abortSignal = options.abortController?.signal;
  const aborted = new Promise<void>((resolve) => {
    if (abortSignal?.aborted) resolve();
    abortSignal?.addEventListener('abort', () => resolve(), { once: true });
  });
  const ctx: FakeContext = {
    options,
    toolFeedback: [],
    aborted,
    async nextInput() {
      const r = await iterator.next();
      return r.done ? undefined : r.value;
    },
    async callTool(name, input, toolUseId) {
      for (const matcher of options.hooks?.PreToolUse ?? []) {
        for (const hook of matcher.hooks) {
          const out = await hook(
            {
              hook_event_name: 'PreToolUse',
              tool_name: name,
              tool_input: input,
              tool_use_id: toolUseId,
              session_id: 's',
              transcript_path: '/dev/null',
              cwd: options.cwd ?? '',
            },
            toolUseId,
            { signal: new AbortController().signal },
          );
          const specific = (
            out as {
              hookSpecificOutput?: {
                permissionDecision?: string;
                permissionDecisionReason?: string;
              };
            }
          ).hookSpecificOutput;
          if (specific?.permissionDecision === 'deny') {
            ctx.toolFeedback.push(specific.permissionDecisionReason ?? '');
            return 'deny';
          }
        }
      }
      if (!options.canUseTool) return 'allow';
      const result = await options.canUseTool(name, input, {
        signal: new AbortController().signal,
        toolUseID: toolUseId,
        requestId: `req-${toolUseId}`,
      });
      if (result?.behavior === 'deny')
        ctx.toolFeedback.push(
          "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.",
        );
      return result?.behavior === 'allow' ? 'allow' : 'deny';
    },
  };
  const inner = script(ctx);
  const outer = (async function* () {
    const abortError = aborted.then(() => {
      const error = new Error('Claude Code process aborted by user');
      error.name = 'AbortError';
      throw error;
    });
    while (true) {
      const next = await Promise.race([inner.next(), abortError]);
      if (next.done) return;
      yield next.value;
    }
  })();
  return Object.assign(outer, {
    close() {
      call.closed = true;
    },
    supportedModels: () => models(options),
  });
}
