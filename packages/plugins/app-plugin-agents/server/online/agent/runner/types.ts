import type { Hash } from 'node:crypto';
import type {
  OnlineAgentUIStreams,
  UIStreamChannel,
} from '../transport/streams.js';
import type { AppUIMessage } from '../../../../shared/online-agent.js';
import type {
  AppUIPhase,
  AppUIMessageMetadata,
} from '../../../../shared/ui-message.js';
import type { ConversationService } from '../../../core/conversations/ports.js';
import type { TxRunner } from '../../../kernel/tx.js';
import type { OnlineAgentConfigurator } from '../configuration.js';

type SourceRecord = NonNullable<AppUIMessageMetadata['sourceRecords']>[number];

export type Execution = {
  id: string;
  userId: string;
  runId?: string;
  cursor: number;
  writer: UIStreamChannel;
  published: Set<string>;
  textLengths: Map<string, number>;
  previewDigests: Map<string, Hash>;
  previewParts: Map<
    string,
    {
      index: number;
      type: 'text' | 'reasoning' | 'tool';
      /** A source read from canonical history, never from a mixed preview snapshot. */
      source?: SourceRecord;
      /** The first projection position of an unsaved part, scoped to this Execution. */
      anchor?: Pick<SourceRecord, 'seq' | 'createdAt'>;
    }
  >;
  /** Each tool part written to the stream, and whether its result was too. */
  toolStates: Map<string, 'input' | 'done'>;
  /** The last run event seq whose tool step was read. */
  stepSeq: number;
  ready: boolean;
  started: boolean;
  /** Where the run stands before its first output, as last written (`data-phase`); `done` once output arrived. */
  phase?: AppUIPhase['phase'] | 'done';
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
