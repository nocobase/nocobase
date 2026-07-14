/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import {
  AGENT_GATEWAY_API_ACTIONS,
  createActionContract,
  parseCanonicalListResponse,
  parseOpaqueResponse,
  type AgentGatewayCanonicalListResponse,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

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

export interface UploadSkillVersionRequest {
  skillKey?: string;
  displayName?: string;
  description?: string;
  versionLabel?: string;
  status?: string;
  contentBase64?: string;
  manifestJson?: JsonRecord;
  inputSchemaJson?: JsonRecord;
  outputSchemaJson?: JsonRecord;
  metadataJson?: JsonRecord;
}

export interface CreateSkillVersionFromUploadRequest extends Omit<UploadSkillVersionRequest, 'contentBase64'> {
  uploadId?: string;
}

export interface UpsertNodeSkillInstallRequest {
  skillVersionId?: string;
  status?: string;
  installedAt?: string;
  lastSeenAt?: string;
  capabilitiesSnapshotJson?: JsonRecord;
  settingsSnapshotJson?: JsonRecord;
  capabilityToken?: string;
  runId?: string;
  claimAttempt?: number;
  sourceSha256?: string;
}

export interface ListSkillVersionsQuery {
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string;
}

export interface DownloadSkillVersionQuery {
  runId?: string;
  claimAttempt?: number | string;
  sha256?: string;
}

export interface SkillVersionDto extends AgentGatewayObjectDto, AgentGatewaySkillVersionSummary {}

export type UpsertNodeSkillInstallResponse = AgentGatewayObjectDto;
export type UploadSkillVersionResponse = SkillVersionDto;
export type CreateSkillVersionFromUploadResponse = SkillVersionDto;
export type ListSkillVersionsResponse = AgentGatewayCanonicalListResponse<SkillVersionDto>;
export type GetSkillVersionResponse = SkillVersionDto;
export type DownloadSkillVersionResponse = string | Uint8Array | ArrayBuffer;

export interface SkillActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall]: UpsertNodeSkillInstallRequest;
  [AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion]: UploadSkillVersionRequest;
  [AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload]: CreateSkillVersionFromUploadRequest;
  [AGENT_GATEWAY_API_ACTIONS.listSkillVersions]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getSkillVersion]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion]: AgentGatewayEmptyRequest;
}

export interface SkillActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall]: UpsertNodeSkillInstallResponse;
  [AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion]: UploadSkillVersionResponse;
  [AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload]: CreateSkillVersionFromUploadResponse;
  [AGENT_GATEWAY_API_ACTIONS.listSkillVersions]: ListSkillVersionsResponse;
  [AGENT_GATEWAY_API_ACTIONS.getSkillVersion]: GetSkillVersionResponse;
  [AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion]: DownloadSkillVersionResponse;
}

export const skillContracts = {
  [AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion,
    UploadSkillVersionRequest,
    UploadSkillVersionResponse
  >(AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion, [
    'skillKey',
    'displayName',
    'description',
    'versionLabel',
    'status',
    'contentBase64',
    'manifestJson',
    'inputSchemaJson',
    'outputSchemaJson',
    'metadataJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload,
    CreateSkillVersionFromUploadRequest,
    CreateSkillVersionFromUploadResponse
  >(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload, [
    'skillKey',
    'displayName',
    'description',
    'versionLabel',
    'status',
    'uploadId',
    'manifestJson',
    'inputSchemaJson',
    'outputSchemaJson',
    'metadataJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
    UpsertNodeSkillInstallRequest,
    UpsertNodeSkillInstallResponse
  >(AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall, [
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
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.listSkillVersions]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listSkillVersions,
    AgentGatewayEmptyRequest,
    ListSkillVersionsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listSkillVersions, [], undefined, parseCanonicalListResponse<SkillVersionDto>),
  [AGENT_GATEWAY_API_ACTIONS.getSkillVersion]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getSkillVersion,
    AgentGatewayEmptyRequest,
    GetSkillVersionResponse
  >(AGENT_GATEWAY_API_ACTIONS.getSkillVersion, []),
  [AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
    AgentGatewayEmptyRequest,
    DownloadSkillVersionResponse
  >(AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion, [], undefined, parseOpaqueResponse<DownloadSkillVersionResponse>),
} as const satisfies AgentGatewayDomainContractMap<SkillActionRequestMap, SkillActionResponseMap>;
