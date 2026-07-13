/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { Readable } from 'stream';

import {
  EXTERNAL_IMPORTED_RUN_STATUSES,
  EXTERNAL_IMPORT_LIMITS,
  ExternalImportedRunStatus,
  ExternalLogFormat,
} from '../shared/externalRunImport';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../shared/apiContract';
import { GatewayRequester, JsonRecord } from './types';

const DEFAULT_LOG_BATCH_BYTES = 6 * 1024 * 1024;
const DEFAULT_LOG_BATCH_LINES = 250;
const DEFAULT_ARTIFACT_CONTENT_BYTES = 6 * 1024 * 1024;

export interface ExternalLogInput {
  format: ExternalLogFormat;
  artifactKey?: string;
  filePath?: string;
  stream?: Readable;
}

export interface ExternalRunUploadOptions {
  requester: GatewayRequester;
  authToken: string;
  provider: string;
  externalRunKey?: string;
  runCode?: string;
  title?: string;
  instruction?: string;
  status?: ExternalImportedRunStatus;
  sourceCollection?: string;
  sourceRecordId?: string;
  outputAgentRunField?: string;
  providerSessionId?: string;
  resultSummary?: JsonRecord;
  metadata?: JsonRecord;
  errorSummary?: string;
  log?: ExternalLogInput;
  artifactPaths?: string[];
  maxLogBatchBytes?: number;
  maxLogBatchLines?: number;
  maxArtifactContentBytes?: number;
}

interface ObservationBatch {
  logs: JsonRecord[];
  artifacts: JsonRecord[];
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getFileMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.json': 'application/json',
    '.jsonl': 'application/x-ndjson',
    '.ndjson': 'application/x-ndjson',
    '.log': 'text/plain',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function isTextMimeType(mimeType: string) {
  return mimeType.startsWith('text/') || mimeType.includes('json') || mimeType === 'image/svg+xml';
}

function getFileArtifactType(filePath: string) {
  const mimeType = getFileMimeType(filePath);
  if (mimeType === 'text/html') {
    return 'html-report';
  }
  if (mimeType.includes('json')) {
    return 'json-report';
  }
  if (mimeType === 'text/markdown') {
    return 'markdown-report';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'text/plain' && path.extname(filePath).toLowerCase() === '.log') {
    return 'log';
  }
  return 'file';
}

function getArtifactKeyFromFile(filePath: string) {
  return `external:${path.basename(filePath)}`
    .replace(/[^A-Za-z0-9_.:/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 240);
}

function getPositiveInteger(value: number | undefined, fallback: number, name: string) {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return result;
}

function getUploadLimits(options: ExternalRunUploadOptions) {
  return {
    maxLogBatchBytes: getPositiveInteger(options.maxLogBatchBytes, DEFAULT_LOG_BATCH_BYTES, 'maxLogBatchBytes'),
    maxLogBatchLines: getPositiveInteger(options.maxLogBatchLines, DEFAULT_LOG_BATCH_LINES, 'maxLogBatchLines'),
    maxArtifactContentBytes: getPositiveInteger(
      options.maxArtifactContentBytes,
      DEFAULT_ARTIFACT_CONTENT_BYTES,
      'maxArtifactContentBytes',
    ),
  };
}

function getLogStream(log: ExternalLogInput) {
  if (log.stream) {
    return log.stream;
  }
  if (log.filePath) {
    return createReadStream(path.resolve(log.filePath));
  }
  throw new Error('External log input requires a filePath or stream');
}

async function* createLogBatches(log: ExternalLogInput, maxBytes: number, maxLines: number) {
  const lines = createInterface({
    input: getLogStream(log),
    crlfDelay: Infinity,
  });
  let batchLines: string[] = [];
  let batchBytes = 0;
  let part = 0;

  const createBatch = () => {
    part += 1;
    const contentText = batchLines.join('\n');
    const batch: ObservationBatch = {
      logs: [
        {
          format: log.format,
          ...(log.artifactKey ? { artifactKey: `${log.artifactKey}:part-${String(part).padStart(6, '0')}` } : {}),
          contentText,
        },
      ],
      artifacts: [],
    };
    batchLines = [];
    batchBytes = 0;
    return batch;
  };

  try {
    for await (const line of lines) {
      const lineBytes = Buffer.byteLength(line);
      if (lineBytes > maxBytes) {
        throw new Error(`External log contains a line larger than the ${maxBytes}-byte upload chunk limit`);
      }
      const separatorBytes = batchLines.length ? 1 : 0;
      if (batchLines.length && (batchBytes + separatorBytes + lineBytes > maxBytes || batchLines.length >= maxLines)) {
        yield createBatch();
      }
      batchLines.push(line);
      batchBytes += (batchLines.length > 1 ? 1 : 0) + lineBytes;
    }
    if (batchLines.length) {
      yield createBatch();
    }
  } finally {
    lines.close();
  }
}

async function readArtifact(filePath: string, maxContentBytes: number) {
  const absolutePath = path.resolve(filePath);
  const mimeType = getFileMimeType(absolutePath);
  const binary = !isTextMimeType(mimeType);
  const stat = await fs.stat(absolutePath);
  const maxSourceBytes = binary ? Math.floor((maxContentBytes - 128) * 0.75) : maxContentBytes;
  if (stat.size > maxSourceBytes) {
    throw new Error(
      `External artifact ${absolutePath} is too large for one upload batch (${stat.size} bytes; maximum ${maxSourceBytes})`,
    );
  }
  const content = binary ? await fs.readFile(absolutePath) : await fs.readFile(absolutePath, 'utf8');
  const contentText = Buffer.isBuffer(content) ? `data:${mimeType};base64,${content.toString('base64')}` : content;
  if (Buffer.byteLength(contentText) > maxContentBytes) {
    throw new Error(`External artifact ${absolutePath} exceeds the encoded upload chunk limit`);
  }
  return {
    artifactKey: getArtifactKeyFromFile(absolutePath),
    artifactType: getFileArtifactType(absolutePath),
    mimeType,
    ...(Buffer.isBuffer(content) ? { sizeBytes: content.byteLength } : {}),
    contentText,
    metadataJson: {
      fileName: path.basename(absolutePath),
      sourcePath: absolutePath,
      ...(Buffer.isBuffer(content) ? { originalSizeBytes: content.byteLength } : {}),
    },
  } satisfies JsonRecord;
}

async function validateArtifactInputs(filePaths: string[], maxContentBytes: number) {
  const artifactKeys = new Set<string>();
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const artifactKey = getArtifactKeyFromFile(absolutePath);
    if (artifactKeys.has(artifactKey)) {
      throw new Error(`External artifacts must have unique file names: ${path.basename(absolutePath)}`);
    }
    artifactKeys.add(artifactKey);
    const mimeType = getFileMimeType(absolutePath);
    const binary = !isTextMimeType(mimeType);
    const stat = await fs.stat(absolutePath);
    const maxSourceBytes = binary ? Math.floor((maxContentBytes - 128) * 0.75) : maxContentBytes;
    if (stat.size > maxSourceBytes) {
      throw new Error(
        `External artifact ${absolutePath} is too large for one upload batch (${stat.size} bytes; maximum ${maxSourceBytes})`,
      );
    }
  }
}

async function validateUploadInputs(options: ExternalRunUploadOptions) {
  if (options.status && !EXTERNAL_IMPORTED_RUN_STATUSES.includes(options.status)) {
    throw new Error(`status must be one of: ${EXTERNAL_IMPORTED_RUN_STATUSES.join(', ')}`);
  }
  if (options.log?.filePath && options.log.stream) {
    throw new Error('External log input cannot define both filePath and stream');
  }
  const limits = getUploadLimits(options);
  await validateArtifactInputs(options.artifactPaths || [], limits.maxArtifactContentBytes);
  await validateReplayableObservationPayloads(options, limits);
  assertPayloadSize(withStableBatchKey(options, 'final', 0, getFinalRunBody(options)));
  return limits;
}

async function* createObservationBatches(
  options: ExternalRunUploadOptions,
  limits: ReturnType<typeof getUploadLimits>,
) {
  if (options.log) {
    yield* createLogBatches(options.log, limits.maxLogBatchBytes, limits.maxLogBatchLines);
  }
  for (const filePath of options.artifactPaths || []) {
    yield {
      logs: [],
      artifacts: [await readArtifact(filePath, limits.maxArtifactContentBytes)],
    } satisfies ObservationBatch;
  }
}

function assertPayloadSize(body: JsonRecord) {
  const payloadBytes = Buffer.byteLength(JSON.stringify(body));
  if (payloadBytes > EXTERNAL_IMPORT_LIMITS.maxPayloadBytes) {
    throw new Error(
      `External import request is ${payloadBytes} bytes and exceeds the ${EXTERNAL_IMPORT_LIMITS.maxPayloadBytes}-byte server limit`,
    );
  }
}

function getIdentityHash(options: ExternalRunUploadOptions) {
  return sha256(`${options.provider}\0${options.externalRunKey || ''}\0${options.runCode || ''}`).slice(0, 16);
}

function withStableBatchKey(
  options: ExternalRunUploadOptions,
  phase: 'observation' | 'final',
  index: number,
  body: JsonRecord,
) {
  return {
    ...body,
    batchKey: `ag-cli-${getIdentityHash(options)}-${phase}-${String(index).padStart(6, '0')}`,
  };
}

function getInitialRunBody(options: ExternalRunUploadOptions) {
  return {
    provider: options.provider,
    title: options.title,
    instruction: options.instruction,
    status: 'running',
    externalRunKey: options.externalRunKey,
    runCode: options.runCode,
    sourceCollection: options.sourceCollection,
    sourceRecordId: options.sourceRecordId,
    outputAgentRunField: options.outputAgentRunField,
    providerSessionId: options.providerSessionId,
    metadataJson: options.metadata || {},
  } satisfies JsonRecord;
}

function getFinalRunBody(options: ExternalRunUploadOptions) {
  return {
    provider: options.provider,
    status: options.status || (options.errorSummary ? 'failed' : 'succeeded'),
    resultSummaryJson: options.resultSummary || {},
    errorSummary: options.errorSummary,
    logs: [],
    artifacts: [],
  } satisfies JsonRecord;
}

function getObservationRunBody(options: ExternalRunUploadOptions, observations: ObservationBatch, batchIndex: number) {
  return withStableBatchKey(
    options,
    'observation',
    batchIndex,
    batchIndex === 1
      ? {
          ...getInitialRunBody(options),
          ...observations,
        }
      : {
          provider: options.provider,
          ...observations,
        },
  );
}

async function validateReplayableObservationPayloads(
  options: ExternalRunUploadOptions,
  limits: ReturnType<typeof getUploadLimits>,
) {
  if (options.log?.stream) {
    for (const filePath of options.artifactPaths || []) {
      const observations: ObservationBatch = {
        logs: [],
        artifacts: [await readArtifact(filePath, limits.maxArtifactContentBytes)],
      };
      assertPayloadSize(getObservationRunBody(options, observations, 1));
      assertPayloadSize(getObservationRunBody(options, observations, 2));
    }
    return;
  }

  let batchIndex = 0;
  for await (const observations of createObservationBatches(options, limits)) {
    batchIndex += 1;
    assertPayloadSize(getObservationRunBody(options, observations, batchIndex));
  }
}

export async function uploadExternalRun(options: ExternalRunUploadOptions) {
  if (!options.externalRunKey && !options.runCode) {
    throw new Error('externalRunKey or runCode is required');
  }
  const limits = await validateUploadInputs(options);
  let runId = '';
  let response: JsonRecord = {};
  let batchIndex = 0;
  for await (const observations of createObservationBatches(options, limits)) {
    batchIndex += 1;
    const body = getObservationRunBody(options, observations, batchIndex);
    assertPayloadSize(body);
    response = await options.requester.request({
      method: 'POST',
      path:
        batchIndex === 1
          ? getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.importExternalRun)
          : getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations, runId),
      authToken: options.authToken,
      body,
    });
    if (batchIndex === 1) {
      runId = typeof response.runId === 'string' ? response.runId : '';
      if (!runId) {
        throw new Error('External run import response did not include runId');
      }
    }
  }
  if (!batchIndex) {
    throw new Error('External run upload requires a non-empty log or artifact');
  }

  const finalBody = withStableBatchKey(options, 'final', 0, getFinalRunBody(options));
  assertPayloadSize(finalBody);
  return await options.requester.request({
    method: 'POST',
    path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations, runId),
    authToken: options.authToken,
    body: finalBody,
  });
}
