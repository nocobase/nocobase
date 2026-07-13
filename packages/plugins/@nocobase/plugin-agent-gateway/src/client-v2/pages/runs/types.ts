/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DataSource } from '@nocobase/flow-engine';

import type { AgentCapabilityKey } from '../../../shared/providerCapabilities';
import type { AgentGatewaySkillVersionSummary } from '../../../shared/apiContract';
import type { AgentTimelineEventRecord } from '../../components/AgentTimeline';
import type {
  ApiCallLogRecord,
  RunArtifactRecord,
  RunEventRecord,
  RunSnapshotRecord,
} from '../../hooks/useRunObservabilityDetails';
import type {
  BuildSkillVersionOption,
  BuildTaskArtifactDeclarationFormValue,
} from '../AgentGatewayTaskParameterFormItems';
import type { AgentGatewayContext, JsonRecord } from '../AgentGatewayPageUtils';

export interface TokenUsageRecord extends JsonRecord {
  inputTokens?: number | string | null;
  cachedInputTokens?: number | string | null;
  outputTokens?: number | string | null;
  reasoningOutputTokens?: number | string | null;
  totalTokens?: number | string | null;
}

export interface RunRecord {
  id: string;
  runCode: string;
  taskTitle?: string | null;
  status: string;
  nodeId?: string | null;
  agentProfileId?: string | null;
  sourceType?: string | null;
  sourceCollection?: string | null;
  sourceRecordId?: string | null;
  taskTemplateId?: string | null;
  taskTemplateJson?: RunTaskTemplateSummary | null;
  cancelRequested?: boolean;
  resultSummaryJson?: JsonRecord;
  tokenUsageJson?: TokenUsageRecord | null;
  errorSummary?: string | null;
  terminalBackend?: string | null;
  terminalStatus?: string | null;
  terminalStartedAt?: string;
  terminalEndedAt?: string;
  terminalLastActivityAt?: string;
  terminalExitCode?: number | null;
  agentSessionId?: string | null;
  parentRunId?: string | null;
  resumedFromRunId?: string | null;
  continuationReason?: string | null;
  agentSessionProviderId?: string | null;
  provider?: string | null;
  capabilitySource?: string | null;
  capabilitiesSnapshotJson?: JsonRecord;
  agentSessionCapabilitiesJson?: JsonRecord;
  agentGatewayActionPermissionsJson?: {
    resumeAgentSession?: boolean;
    readSessionMessages?: boolean;
    readTerminal?: boolean;
    readArtifacts?: boolean;
    readRawLogs?: boolean;
    cancelRun?: boolean;
  };
  agentGatewayControlActionsJson?: {
    interruptRun?: boolean;
    terminateRun?: boolean;
  };
  runnerStatusJson?: RunnerStatusRecord;
  requestedAt?: string;
  queuedAt?: string;
  claimedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export interface RunTaskTemplateSummary {
  id: string;
  templateKey: string;
  displayName?: string;
  skillVersionIds?: string[];
  skills?: BuildSkillVersionOption[];
}

export interface TaskTemplateDetailRecord {
  id: string;
  templateKey: string;
  displayName?: string | null;
  description?: string | null;
  status?: string | null;
  defaultTitle?: string | null;
  defaultPrompt?: string | null;
  cwd?: string | null;
  skillVersionIdsJson?: string[];
  artifactRoot?: string | null;
  artifactsJson?: JsonRecord[];
}

export type SkillVersionDetailRecord = AgentGatewaySkillVersionSummary;

export interface TerminalSnapshot {
  backend?: string | null;
  terminalStatus?: string | null;
  runStatus?: string;
  available: boolean;
  output: string;
  capturedAt: string;
  inputEnabled: boolean;
  unsupported?: boolean;
  unsupportedCapability?: AgentCapabilityKey;
  message?: string;
}

export interface TerminalSnapshotState {
  runId: string;
  snapshot: TerminalSnapshot | null;
}

export interface RunDetails {
  run: RunRecord;
  conversationEvents: AgentTimelineEventRecord[];
  events: RunEventRecord[];
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  apiCallLogs: ApiCallLogRecord[];
  warnings: RunDetailsWarnings;
}

export interface RunDetailsWarnings {
  conversationEvents?: string;
  events?: string;
  artifacts?: string;
  snapshots?: string;
  apiCallLogs?: string;
}

export type RunActionPermissionKey = keyof NonNullable<RunRecord['agentGatewayActionPermissionsJson']>;

export interface ResumeAgentSessionResult {
  runId: string;
  runCode?: string;
  agentSessionId: string;
  parentRunId?: string;
  resumedFromRunId?: string;
  deduped: boolean;
}

export interface ControlRequestResult {
  runId?: string;
  controlRequestId?: string;
  controlRequestStatus?: 'accepted' | 'delivered' | 'succeeded' | 'failed';
}

export interface ControlRequestState {
  action: 'interrupt' | 'terminate';
  runId: string;
  status: 'accepted' | 'delivered' | 'succeeded' | 'failed';
  controlRequestId?: string;
}

export interface ControlRequestStatusPoll {
  action: 'interrupt' | 'terminate';
  runId: string;
  controlRequestId: string;
}

export interface RunnerStatusRecord {
  online?: boolean;
  reason?: string;
  nodeId?: string | null;
  nodeKey?: string | null;
  nodeStatus?: string | null;
  lastHeartbeatAt?: string | null;
  agentProfileId?: string | null;
  profileKey?: string | null;
  profileProvider?: string | null;
  profileStatus?: string | null;
}

export interface RunListMeta {
  count?: number;
  page?: number;
  pageSize?: number;
  totalPage?: number;
  taskTemplates?: RunTaskTemplateFilterOption[];
}

export interface RunListData {
  runs: RunRecord[];
  meta: RunListMeta;
}

export interface RunTaskTemplateFilterOption {
  id: string;
  templateKey?: string;
  displayName?: string;
}

export type RunDetailTabKey = 'summary' | 'agent-sessions' | 'logs' | 'artifacts' | 'api-logs';

export interface BuildTaskFormValues {
  taskTemplateId?: string;
  title?: string;
  prompt?: string;
  skillVersionIds?: string[];
  runner?: string;
  cwd?: string;
  artifactRoot?: string;
  artifactDeclarations?: BuildTaskArtifactDeclarationFormValue[];
}

export interface SkillUploadFormValues {
  skillKey?: string;
  displayName?: string;
  versionLabel?: string;
}

export interface SkillUploadResult {
  skillId?: string;
  skillKey?: string;
  skillVersionId: string;
  versionLabel?: string;
  status?: string;
  idempotent?: boolean;
}

export interface CreateBuildRunResult {
  runId: string;
  runCode?: string;
  run?: RunRecord;
  runnerStatus?: RunnerStatusRecord;
}

export interface ExternalRunImportFormValues {
  provider?: string;
  format?: string;
  title?: string;
  instruction?: string;
  status?: string;
  externalRunKey: string;
  providerSessionId?: string;
  sourceCollection?: string;
  sourceRecordId?: string;
  outputAgentRunField?: string;
}

export interface ExternalRunImportResult {
  runId?: string;
  runCode?: string;
  run?: RunRecord;
  deduped?: boolean;
}

export type ReadableArtifactItemKind = 'message' | 'tool' | 'error' | 'event';

export interface ReadableArtifactItem {
  key: string;
  kind: ReadableArtifactItemKind;
  label: string;
  text: string;
  defaultOpen: boolean;
}

export interface ReadableArtifactPreview {
  mode: 'jsonl' | 'json' | 'text';
  summary: string;
  items: ReadableArtifactItem[];
  text: string;
  rawPreview: string;
  rawTruncated: boolean;
}

export type TFunction = (key: string, options?: Record<string, unknown>) => string;

export type AgentGatewayPageContext = AgentGatewayContext & {
  dataSourceManager?: {
    getDataSource(key: string): DataSource | undefined;
  };
};
