/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderKey } from '../../../shared/providerCapabilities';
import { ExternalLogFormat } from '../../../shared/externalRunImport';
import { JsonRecord, getRecord, getString } from '../../actions/utils';
import { PreparedExternalObservationBatch as PreparedObservationBatch } from '../../services/externalImportLogs';
import {
  hashExternalImportValue as getHash,
  sanitizeExternalImportKeyPart as sanitizeKeyPart,
} from '../../services/externalImportUtils';
import { ObservationOperation } from './serialization';

const EXTERNAL_INITIAL_EVENT_SOURCE = 'external-import-task';

function getSourceKey(...parts: string[]) {
  const source = parts.filter(Boolean).join(':');
  const hash = getHash(source).slice(0, 16);
  const prefix = sanitizeKeyPart(source, 163) || 'external-import';
  return `${prefix}:${hash}`;
}

function getRawLogArtifactValues(options: {
  log: JsonRecord;
  provider: AgentProviderKey;
  format: ExternalLogFormat;
  batchKey: string;
  index: number;
  contentText: string;
}) {
  const artifactKey =
    getString(options.log.artifactKey || options.log.key) ||
    getSourceKey('raw-log', options.provider, options.format, options.batchKey, String(options.index));
  return {
    artifactKey,
    artifactType: 'log',
    mimeType: options.format === 'text' ? 'text/plain' : 'application/x-ndjson',
    contentText: options.contentText,
    metadata: {
      externalImport: true,
      provider: options.provider,
      format: options.format,
      batchKey: options.batchKey,
      logIndex: options.index,
      storageMode: 'inline',
    },
  };
}

function getExternalArtifactValues(artifactValues: JsonRecord, batchKey: string, index: number) {
  const artifactKey =
    getString(artifactValues.artifactKey) ||
    getSourceKey(
      'artifact',
      batchKey,
      String(index),
      getHash(
        [
          getString(artifactValues.artifactType),
          getString(artifactValues.mimeType),
          getString(artifactValues.contentText),
        ].join(':'),
      ).slice(0, 16),
    );
  return {
    ...artifactValues,
    artifactKey,
    metadataJson: {
      ...getRecord(artifactValues.metadataJson),
      externalImport: true,
      batchKey,
    },
  };
}

export function getObservationOperations(options: {
  values: JsonRecord;
  preparedBatch: PreparedObservationBatch;
  provider: AgentProviderKey;
  batchKey: string;
  includeInitialConversation: boolean;
}) {
  const sequenceBySource = new Map<string, number>();
  const operations: ObservationOperation[] = [];
  const instruction = getString(options.values.instruction || options.values.prompt);
  if (options.includeInitialConversation && instruction) {
    operations.push({
      type: 'initial-conversation',
      values: {
        source: EXTERNAL_INITIAL_EVENT_SOURCE,
        sequence: 0,
        eventType: 'agent.user.message',
        providerEventId: 'initial-task',
        confidence: 1,
        contentText: instruction,
        contentJson: {
          participant: { id: 'user:requester', type: 'user', name: 'You' },
          title: getString(options.values.title) || null,
        },
      },
    });
  }

  const runEventSource = getSourceKey('external-import', options.batchKey);
  const batchEventIndex = operations.length;
  for (const preparedLog of options.preparedBatch.logs) {
    operations.push({
      type: 'artifact',
      values: getRawLogArtifactValues({
        log: preparedLog.log,
        provider: options.provider,
        format: preparedLog.format,
        batchKey: options.batchKey,
        index: preparedLog.index,
        contentText: preparedLog.contentText,
      }),
    });
    const source = getSourceKey(
      'external',
      options.provider,
      preparedLog.format,
      options.batchKey,
      String(preparedLog.index),
    );
    for (const normalizedEvent of preparedLog.normalizedEvents) {
      const sequence = (sequenceBySource.get(source) || 0) + 1;
      sequenceBySource.set(source, sequence);
      operations.push({
        type: 'conversation-event',
        values: {
          source,
          sequence,
          eventType: normalizedEvent.eventType,
          providerEventId: normalizedEvent.providerEventId || null,
          correlationId: normalizedEvent.correlationId || null,
          confidence: normalizedEvent.confidence ?? null,
          contentText: normalizedEvent.message || null,
          contentJson: {
            ...(normalizedEvent.payloadJson || {}),
            ...(normalizedEvent.rawEvent ? { rawProviderEvent: normalizedEvent.rawEvent } : {}),
            ...(normalizedEvent.rawLine ? { rawLine: normalizedEvent.rawLine } : {}),
          },
        },
      });
    }
  }
  for (let index = 0; index < options.preparedBatch.artifacts.length; index += 1) {
    operations.push({
      type: 'artifact',
      values: getExternalArtifactValues(options.preparedBatch.artifacts[index], options.batchKey, index),
    });
  }
  if (operations.length) {
    operations.splice(batchEventIndex, 0, {
      type: 'run-event',
      source: runEventSource,
      sequence: 1,
      eventType: 'external.import.batch.received',
      message: 'External import batch received',
      payload: { batchKey: options.batchKey, provider: options.provider },
    });
  }
  return operations;
}
