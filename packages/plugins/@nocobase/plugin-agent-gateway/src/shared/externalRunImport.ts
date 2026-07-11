/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const EXTERNAL_IMPORT_SOURCE_TYPE = 'external-import';

export const EXTERNAL_IMPORT_CAPABILITIES = {
  structuredEvents: true,
  terminalOutput: false,
  resumeSession: false,
  liveSemanticMessage: false,
  stdinMessage: false,
  interrupt: false,
  terminate: false,
  artifacts: true,
  detectSessionId: false,
  resumeWithMessage: false,
} as const;

export const EXTERNAL_LOG_FORMATS = ['codex-jsonl', 'opencode-jsonl', 'claude-code-jsonl', 'text'] as const;

export type ExternalLogFormat = (typeof EXTERNAL_LOG_FORMATS)[number];

export const EXTERNAL_IMPORTED_RUN_STATUSES = [
  'running',
  'succeeded',
  'failed',
  'canceled',
  'timeout',
  'abandoned',
] as const;

export type ExternalImportedRunStatus = (typeof EXTERNAL_IMPORTED_RUN_STATUSES)[number];

export const EXTERNAL_IMPORT_LIMITS = {
  maxLogs: 16,
  maxArtifacts: 32,
  maxNormalizedEvents: 2000,
  maxPayloadBytes: 10 * 1024 * 1024,
  observationChunkSize: 100,
} as const;

export const EXTERNAL_IMPORT_OPERATION_PLAN_VERSION = 1;
export const EXTERNAL_IMPORT_BATCH_RECOVERY_TIMEOUT_MS = 60 * 60 * 1000;
export const EXTERNAL_IMPORT_INTERRUPTED_ERROR_SUMMARY =
  'External import processing was interrupted; retry the same payload to resume';
export const EXTERNAL_IMPORT_ABANDONED_ERROR_SUMMARY =
  'External import was abandoned after its retry window expired; retry the same batch payload to resume';
export const EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY = 'External import was canceled by the user';

export const EXTERNAL_IMPORT_BATCH_STATUSES = ['processing', 'completed', 'failed'] as const;

export type ExternalImportBatchStatus = (typeof EXTERNAL_IMPORT_BATCH_STATUSES)[number];
