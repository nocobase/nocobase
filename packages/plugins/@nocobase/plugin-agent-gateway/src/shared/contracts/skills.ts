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

export interface AgentGatewaySkillVersionSummary {
  id: string;
  skillVersionId: string;
  skillId: string | null;
  skillKey: string | null;
  displayName: string | null;
  skillStatus: string | null;
  versionLabel: string;
  status: string;
  sourceType: string | null;
  sourceSha256: string | null;
  sourceSizeBytes: number | null;
  sourceUploadedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const skillContracts = {
  [AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion]: createActionContract(AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion, [
    'skillKey',
    'displayName',
    'description',
    'versionLabel',
    'status',
    'contentBase64',
    'metadataJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload]: createActionContract(
    AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload,
    ['skillKey', 'displayName', 'description', 'versionLabel', 'status', 'uploadId', 'metadataJson'] as const,
  ),
  [AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall]: createActionContract(
    AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
    [
      'skillVersionId',
      'status',
      'installedAt',
      'lastSeenAt',
      'capabilitiesSnapshotJson',
      'settingsSnapshotJson',
      'capabilityToken',
      'runId',
      'claimAttempt',
      'sourceSha256',
    ] as const,
  ),
} as const;
