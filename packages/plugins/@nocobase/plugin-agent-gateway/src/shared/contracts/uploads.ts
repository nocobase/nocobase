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
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

export interface InitFileUploadRequest {
  purpose?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceSha256?: string;
  expiresInSeconds?: number;
  metadataJson?: JsonRecord;
}

export interface AppendFileUploadRequest {
  offset?: number;
  contentBase64?: string;
}

export interface CompleteFileUploadRequest {
  sourceSha256?: string;
  sizeBytes?: number;
}

export interface AbortFileUploadRequest {
  reason?: string;
}

export interface FileUploadDto extends AgentGatewayObjectDto {
  id?: string;
  uploadId?: string;
  chunkSize?: number;
  status?: string;
}

export type InitFileUploadResponse = FileUploadDto;
export type AppendFileUploadResponse = FileUploadDto;
export type CompleteFileUploadResponse = FileUploadDto;
export type AbortFileUploadResponse = FileUploadDto;

export interface UploadActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.initFileUpload]: InitFileUploadRequest;
  [AGENT_GATEWAY_API_ACTIONS.appendFileUpload]: AppendFileUploadRequest;
  [AGENT_GATEWAY_API_ACTIONS.completeFileUpload]: CompleteFileUploadRequest | AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.abortFileUpload]: AbortFileUploadRequest | AgentGatewayEmptyRequest;
}

export interface UploadActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.initFileUpload]: InitFileUploadResponse;
  [AGENT_GATEWAY_API_ACTIONS.appendFileUpload]: AppendFileUploadResponse;
  [AGENT_GATEWAY_API_ACTIONS.completeFileUpload]: CompleteFileUploadResponse;
  [AGENT_GATEWAY_API_ACTIONS.abortFileUpload]: AbortFileUploadResponse;
}

export const uploadContracts = {
  [AGENT_GATEWAY_API_ACTIONS.initFileUpload]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.initFileUpload,
    InitFileUploadRequest,
    InitFileUploadResponse
  >(AGENT_GATEWAY_API_ACTIONS.initFileUpload, [
    'purpose',
    'fileName',
    'mimeType',
    'sizeBytes',
    'sourceSha256',
    'expiresInSeconds',
    'metadataJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.appendFileUpload]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendFileUpload,
    AppendFileUploadRequest,
    AppendFileUploadResponse
  >(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, ['offset', 'contentBase64']),
  [AGENT_GATEWAY_API_ACTIONS.completeFileUpload]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.completeFileUpload,
    CompleteFileUploadRequest,
    CompleteFileUploadResponse
  >(AGENT_GATEWAY_API_ACTIONS.completeFileUpload, ['sourceSha256', 'sizeBytes']),
  [AGENT_GATEWAY_API_ACTIONS.abortFileUpload]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.abortFileUpload,
    AbortFileUploadRequest,
    AbortFileUploadResponse
  >(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, ['reason']),
} as const satisfies AgentGatewayDomainContractMap<UploadActionRequestMap, UploadActionResponseMap>;
