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
  AgentGatewayContractError,
  createActionContract,
  parseStrictObject,
} from './common';

export interface CanonicalObservationEvent extends JsonRecord {
  eventType: string;
  contentJson: JsonRecord;
}

export interface AppendObservationRequest extends JsonRecord {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  events: CanonicalObservationEvent[];
}

export interface AppendRunEventRequest extends JsonRecord {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  source: string;
  sequence: number;
  eventType: string;
  contentJson: JsonRecord;
}

function parseCanonicalEvents(value: JsonRecord) {
  if (!Array.isArray(value.events)) {
    throw new AgentGatewayContractError('events must be an array');
  }
  return {
    ...value,
    events: value.events.map((event, index) =>
      parseStrictObject(
        event,
        [
          'ingestId',
          'sessionIngestId',
          'sequence',
          'eventType',
          'level',
          'message',
          'contentJson',
          'contentText',
          'source',
          'providerEventId',
          'correlationId',
          'capturedAt',
          'emittedAt',
          'createdAt',
          'confidence',
          'sessionId',
        ],
        `events[${index}]`,
      ),
    ),
  } as AppendObservationRequest;
}

export const observationContracts = {
  [AGENT_GATEWAY_API_ACTIONS.appendRunEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
    AppendRunEventRequest,
    JsonRecord
  >(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'ingestId',
    'source',
    'sequence',
    'eventType',
    'level',
    'message',
    'contentJson',
    'emittedAt',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.appendConversationEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
    AppendObservationRequest,
    JsonRecord
  >(
    AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
    ['claimToken', 'claimAttempt', 'leaseVersion', 'events'],
    parseCanonicalEvents,
  ),
  [AGENT_GATEWAY_API_ACTIONS.registerRunArtifact]: createActionContract(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'artifactKey',
    'artifactType',
    'fileName',
    'mimeType',
    'sizeBytes',
    'sourceSha256',
    'uploadId',
    'contentText',
    'metadataJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot]: createActionContract(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'snapshotType',
    'snapshotJson',
    'capturedAt',
    'metadataJson',
  ] as const),
} as const;
