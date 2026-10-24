import type {
  OnlineAgentUIStreams,
  UIStreamChannel,
} from '../transport/streams.js';
import type { AppUIMessage } from '../../../../shared/online-agent.js';
import type { ConversationService } from '../../../core/conversations/ports.js';
import type { TxRunner } from '../../../kernel/tx.js';
import type { OnlineAgentConfigurator } from '../configuration.js';

export type Execution = {
  id: string;
  userId: string;
  runId?: string;
  cursor: number;
  writer: UIStreamChannel;
  published: Set<string>;
  textLengths: Map<string, number>;
  previewParts: Map<string, { index: number; type: 'text' | 'reasoning' }>;
  ready: boolean;
  started: boolean;
  snapshot?: AppUIMessage;
  pending?: Promise<void>;
  again: boolean;
  timer?: ReturnType<typeof setTimeout>;
  cleared?: boolean;
};

export type RunnerDependencies = {
  tx: TxRunner;
  conversations: ConversationService;
  streams: OnlineAgentUIStreams;
  configurator: OnlineAgentConfigurator;
  now(): string;
  basePath(): string;
  onError(error: unknown): void;
  measure?(phase: string, durationMs: number): void;
};
export type RunnerState = {
  active: Map<string, Execution>;
  admitting: Set<string>;
  admissions: Set<Promise<unknown>>;
  stopping: boolean;
  detaching: boolean;
};
export type RunnerSessionHost = {
  deps: RunnerDependencies;
  state: RunnerState;
  refresh(execution: Execution): Promise<void>;
  finalizeSavedRun(userId: string, id: string, runId: string): Promise<void>;
};
