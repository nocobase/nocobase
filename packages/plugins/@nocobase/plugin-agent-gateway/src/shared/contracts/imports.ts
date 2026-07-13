/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import { AGENT_GATEWAY_API_ACTIONS, createActionContract } from './common';

export interface ImportExternalRunRequest extends JsonRecord {
  provider: string;
  externalRunKey: string;
  batchKey?: string;
  title?: string;
  instruction?: string;
  providerSessionId?: string;
  metadataJson?: JsonRecord;
  resultSummaryJson?: JsonRecord;
}

const EXTERNAL_IMPORT_FIELDS = [
  'provider',
  'externalRunKey',
  'batchKey',
  'runCode',
  'title',
  'instruction',
  'providerSessionId',
  'status',
  'requestedAt',
  'startedAt',
  'finishedAt',
  'completedAt',
  'failedAt',
  'canceledAt',
  'errorSummary',
  'metadataJson',
  'resultSummaryJson',
  'sourceCollection',
  'sourceRecordId',
  'outputAgentRunField',
  'logs',
  'artifacts',
  'events',
  'conversationEvents',
] as const;

export const importContracts = {
  [AGENT_GATEWAY_API_ACTIONS.importExternalRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.importExternalRun,
    ImportExternalRunRequest,
    JsonRecord
  >(AGENT_GATEWAY_API_ACTIONS.importExternalRun, EXTERNAL_IMPORT_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations]: createActionContract(
    AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
    [
      'provider',
      'batchKey',
      'title',
      'instruction',
      'providerSessionId',
      'status',
      'requestedAt',
      'startedAt',
      'finishedAt',
      'completedAt',
      'failedAt',
      'canceledAt',
      'errorSummary',
      'metadataJson',
      'resultSummaryJson',
      'logs',
      'artifacts',
      'events',
      'conversationEvents',
    ] as const,
  ),
} as const;
