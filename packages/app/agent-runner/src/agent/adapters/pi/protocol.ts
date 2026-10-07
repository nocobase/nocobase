/**
 * The subset of Pi's RPC protocol the adapter reads and writes, and the
 * mapping from Pi failures to protocol FailureReasons.
 *
 * Source: the docs shipped in @earendil-works/pi-coding-agent 0.99.2
 * (2026-09-30): docs/rpc.md, docs/rpc-commands.md, docs/json.md,
 * docs/rpc-extension-ui.md and docs/message-types.md. Only fields the adapter
 * uses are declared; everything else passes through untyped.
 */
import { classifyClaudeFailure } from '../classify.ts';
import type { ClassifiedFailure } from '../classify.ts';

export interface PiUsage {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  reasoning?: number;
  totalTokens?: number;
  cost?: { total?: number };
}

export type PiContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string; redacted?: boolean }
  | {
      type: 'toolCall';
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | { type: 'image'; data: string; mimeType: string };

export interface PiMessage {
  role: string;
  content?: string | PiContentBlock[];
  model?: string;
  provider?: string;
  usage?: PiUsage;
  stopReason?: string;
  errorMessage?: string;
}

export interface PiResponse {
  type: 'response';
  id?: string;
  command: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PiUiRequest {
  type: 'extension_ui_request';
  id: string;
  method: string;
  title?: string;
  placeholder?: string;
  message?: string;
  notifyType?: string;
}

/** Any record Pi writes to stdout. */
export interface PiRecord {
  type: string;
  [key: string]: unknown;
}

/** Text of a user or tool-result message's content. */
export function contentText(content: PiMessage['content']): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) =>
      block.type === 'text'
        ? block.text
        : block.type === 'image'
          ? '[image]'
          : '',
    )
    .filter(Boolean)
    .join('\n');
}

/** Pi-specific wording checked before the shared rules. */
const PI_RULES: readonly (readonly [RegExp, ClassifiedFailure['reason']])[] = [
  [
    /no api key|api key (is )?(missing|not found|required)|no models available|no credentials|\/login\b|pi auth/i,
    'toolAuth',
  ],
  [
    /context (window|length)|maximum context|context_length_exceeded/i,
    'contextOverflow',
  ],
];

export interface PiFailureSignal {
  aborted?: boolean;
  /** An error message from Pi (assistant errorMessage, failed response, stderr). */
  message: string;
}

export function classifyPiFailure(signal: PiFailureSignal): ClassifiedFailure {
  const message = signal.message || 'Pi run failed';
  if (signal.aborted) return { reason: 'cancelled', message };
  for (const [pattern, reason] of PI_RULES) {
    if (pattern.test(message)) return { reason, message };
  }
  const shared = classifyClaudeFailure({ error: new Error(message) });
  return { reason: shared.reason, message };
}
