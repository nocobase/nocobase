/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { claudeCodeAdapter } from '../../daemon/adapters/claudeCode';
import { codexAdapter } from '../../daemon/adapters/codex';
import { opencodeAdapter } from '../../daemon/adapters/opencode';
import { AgentAdapter, NormalizedAgentEvent } from '../../daemon/adapters/types';
import { AgentProviderKey } from '../../shared/providerCapabilities';
import { EXTERNAL_IMPORT_LIMITS, EXTERNAL_LOG_FORMATS, ExternalLogFormat } from '../../shared/externalRunImport';
import { JsonRecord, getArray, getRecord, getString } from '../actions/utils';
import { getCanonicalExternalImportJson, hashExternalImportValue } from './externalImportUtils';

export interface PreparedExternalImportLog {
  log: JsonRecord;
  format: ExternalLogFormat;
  contentText: string;
  normalizedEvents: NormalizedAgentEvent[];
  index: number;
}

export interface PreparedExternalObservationBatch {
  logs: PreparedExternalImportLog[];
  artifacts: JsonRecord[];
  payloadSha256: string;
}

const PROVIDER_ADAPTERS: Partial<Record<AgentProviderKey, AgentAdapter>> = {
  codex: codexAdapter,
  opencode: opencodeAdapter,
  'claude-code': claudeCodeAdapter,
};

function getLogFormat(provider: AgentProviderKey, value: unknown): ExternalLogFormat {
  const format = getString(value);
  if (EXTERNAL_LOG_FORMATS.includes(format as ExternalLogFormat)) {
    return format as ExternalLogFormat;
  }
  if (provider === 'codex') {
    return 'codex-jsonl';
  }
  if (provider === 'opencode') {
    return 'opencode-jsonl';
  }
  if (provider === 'claude-code') {
    return 'claude-code-jsonl';
  }
  return 'text';
}

function getLogEntries(values: JsonRecord) {
  const logs = getArray(values.logs).map((entry) => getRecord(entry));
  if (logs.length) {
    return logs;
  }
  const contentText = getString(values.contentText || values.log || values.logsText);
  return contentText
    ? [
        {
          contentText,
          format: values.format,
          artifactKey: values.artifactKey,
        },
      ]
    : [];
}

function getTextLogEvent(line: string): NormalizedAgentEvent {
  return {
    eventType: 'agent.progress',
    level: 'info',
    message: line,
    payloadJson: {
      textKind: 'progress',
    },
  };
}

function normalizeLogEvents(
  provider: AgentProviderKey,
  format: ExternalLogFormat,
  contentText: string,
  maxEvents: number,
) {
  const adapter = PROVIDER_ADAPTERS[provider];
  const events: NormalizedAgentEvent[] = [];
  for (const rawLine of contentText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const lineEvents =
      format === 'text' || !adapter ? [getTextLogEvent(line)] : adapter.normalizeEvent({ rawLine: line });
    if (events.length + lineEvents.length > maxEvents) {
      return { events: [], limitExceeded: true };
    }
    events.push(...lineEvents);
  }
  return { events, limitExceeded: false };
}

export function prepareExternalObservationBatch(
  ctx: Context,
  values: JsonRecord,
  provider: AgentProviderKey,
  batchKey: string,
): PreparedExternalObservationBatch {
  const canonicalPayload = getCanonicalExternalImportJson({ ...values, provider, batchKey }) || '';
  if (Buffer.byteLength(canonicalPayload) > EXTERNAL_IMPORT_LIMITS.maxPayloadBytes) {
    ctx.throw(413, `External import payload must not exceed ${EXTERNAL_IMPORT_LIMITS.maxPayloadBytes} bytes`);
  }

  const logEntries = getLogEntries(values);
  if (logEntries.length > EXTERNAL_IMPORT_LIMITS.maxLogs) {
    ctx.throw(413, `External import supports at most ${EXTERNAL_IMPORT_LIMITS.maxLogs} logs per batch`);
  }
  const artifacts = getArray(values.artifacts).map((entry) => getRecord(entry));
  if (artifacts.length > EXTERNAL_IMPORT_LIMITS.maxArtifacts) {
    ctx.throw(413, `External import supports at most ${EXTERNAL_IMPORT_LIMITS.maxArtifacts} artifacts per batch`);
  }

  let normalizedEventCount = 0;
  const logs = logEntries.flatMap((log, index): PreparedExternalImportLog[] => {
    const contentText = getString(log.contentText || log.text || log.content);
    if (!contentText) {
      return [];
    }
    const format = getLogFormat(provider, log.format || values.format);
    const normalized = normalizeLogEvents(
      provider,
      format,
      contentText,
      EXTERNAL_IMPORT_LIMITS.maxNormalizedEvents - normalizedEventCount,
    );
    if (normalized.limitExceeded) {
      ctx.throw(
        413,
        `External import supports at most ${EXTERNAL_IMPORT_LIMITS.maxNormalizedEvents} normalized events per batch`,
      );
    }
    normalizedEventCount += normalized.events.length;
    return [{ log, format, contentText, normalizedEvents: normalized.events, index }];
  });

  return {
    logs,
    artifacts,
    payloadSha256: hashExternalImportValue(canonicalPayload),
  };
}
