/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import {
  buildDeclaredArtifactManifestUpload,
  buildTextArtifactUpload,
  processDeclaredArtifactUploads,
} from './artifactUpload';
import { getDeclaredArtifactModifiedSinceMs } from './executionCommand';
import { ExecDriverResult } from './execDriver';
import { AgentGatewayDaemonNodeClient } from './gateway';
import { JsonRecord, RunLease } from './types';

const SUMMARY_ARRAY_SAMPLE_LIMIT = 20;

function getRecord(value: unknown): JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]' ? (value as JsonRecord) : {};
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getArraySample(value: unknown, limit = SUMMARY_ARRAY_SAMPLE_LIMIT) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function getArrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function compactArtifactManifestForSummary(value: unknown): JsonRecord {
  const manifest = getRecord(value);
  if (!Object.keys(manifest).length) {
    return {};
  }
  const artifacts = getArraySample(manifest.artifacts);
  const skipped = getArraySample(manifest.skipped);
  const ignored = getArraySample(manifest.ignored);
  const referencedScreenshots = getArraySample(manifest.referencedScreenshots);
  const missingReferencedScreenshots = getArraySample(manifest.missingReferencedScreenshots);
  return {
    schema: getString(manifest.schema) || undefined,
    generatedAt: getString(manifest.generatedAt) || undefined,
    maxArtifactUploads: manifest.maxArtifactUploads,
    counts: getRecord(manifest.counts),
    artifactSample: artifacts,
    artifactSampleCount: artifacts.length,
    artifactCount: getArrayCount(manifest.artifacts),
    skippedSample: skipped,
    skippedSampleCount: skipped.length,
    skippedCount: getArrayCount(manifest.skipped),
    ignoredSample: ignored,
    ignoredSampleCount: ignored.length,
    ignoredCount: getArrayCount(manifest.ignored),
    referencedScreenshotSample: referencedScreenshots,
    referencedScreenshotSampleCount: referencedScreenshots.length,
    referencedScreenshotCount: getArrayCount(manifest.referencedScreenshots),
    missingReferencedScreenshotSample: missingReferencedScreenshots,
    missingReferencedScreenshotSampleCount: missingReferencedScreenshots.length,
    missingReferencedScreenshotCount: getArrayCount(manifest.missingReferencedScreenshots),
  };
}

export function compactDeclaredArtifactSummary(value: unknown): JsonRecord {
  const summary = getRecord(value);
  if (!Object.keys(summary).length) {
    return {};
  }
  const declaredArtifactKeys = getArraySample(summary.declaredArtifactKeys, 50);
  const declaredArtifactFailures = getArraySample(summary.declaredArtifactFailures);
  return {
    declaredArtifactCount: summary.declaredArtifactCount,
    declaredArtifactKeySample: declaredArtifactKeys,
    declaredArtifactKeySampleCount: declaredArtifactKeys.length,
    declaredArtifactKeyCount: getArrayCount(summary.declaredArtifactKeys),
    declaredArtifactFailedCount: summary.declaredArtifactFailedCount,
    declaredArtifactFailures,
    declaredArtifactFailureSample: declaredArtifactFailures,
    declaredArtifactFailureSampleCount: declaredArtifactFailures.length,
    declaredArtifactFailureCount: getArrayCount(summary.declaredArtifactFailures),
    artifactManifestArtifactKey: 'declared:artifact-manifest.json',
    artifactManifest: compactArtifactManifestForSummary(summary.artifactManifest),
  };
}

async function registerOutputArtifact(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  streamName: 'stdout' | 'stderr';
  output: ExecDriverResult['stdout'];
}) {
  if (options.output.text !== null && (options.output.text || options.output.truncated)) {
    await options.gateway.registerArtifact(options.lease, {
      artifactKey: `${options.streamName}-main`,
      artifactType: options.streamName,
      mimeType: 'text/plain',
      sizeBytes: options.output.sizeBytes,
      contentText: options.output.text,
      metadataJson: {
        originalSizeBytes: options.output.sizeBytes,
        uploadedBytes: Buffer.byteLength(options.output.text),
        truncated: options.output.truncated === true,
        ...(options.output.capturedBytes !== undefined ? { capturedBytes: options.output.capturedBytes } : {}),
        ...(options.output.truncated ? { spoolTruncated: true } : {}),
        sha256: hashText(options.output.text),
        storageMode: 'inline',
      },
    });
    return;
  }
  if (options.output.artifactPath) {
    const artifactUpload = await buildTextArtifactUpload(options.output.artifactPath, options.output.sizeBytes);
    await options.gateway.registerArtifact(options.lease, {
      artifactKey: `${options.streamName}-main`,
      artifactType: options.streamName,
      mimeType: 'text/plain',
      sizeBytes: options.output.sizeBytes,
      contentText: artifactUpload.contentText,
      metadataJson: {
        ...artifactUpload.metadataJson,
        ...(options.output.capturedBytes !== undefined ? { capturedBytes: options.output.capturedBytes } : {}),
        ...(options.output.truncated ? { truncated: true, spoolTruncated: true } : {}),
      },
    });
  }
}

export async function reportExecOutputs(
  gateway: AgentGatewayDaemonNodeClient,
  lease: RunLease,
  result: ExecDriverResult,
) {
  let sequence = 1;
  for (const [streamName, output] of [
    ['stdout', result.stdout],
    ['stderr', result.stderr],
  ] as const) {
    if (output.text) {
      await gateway.appendEvent(lease, {
        source: streamName,
        sequence,
        eventType: 'agent.output.chunk',
        level: streamName === 'stderr' && result.status !== 'succeeded' ? 'error' : 'info',
        message: output.text.slice(0, 4000),
      });
      sequence += 1;
    }
    await registerOutputArtifact({ gateway, lease, streamName, output });
  }
}

export async function reportDeclaredArtifacts(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  payload: JsonRecord;
  cwd: string;
}) {
  const uploadedArtifactKeys: string[] = [];
  const uploadFailures: JsonRecord[] = [];
  const collection = await processDeclaredArtifactUploads({
    payload: options.payload,
    cwd: options.cwd,
    modifiedSinceMs: getDeclaredArtifactModifiedSinceMs(options.getLease(), options.payload),
    onUpload: async (upload) => {
      try {
        await options.gateway.registerArtifact(options.getLease(), upload);
        uploadedArtifactKeys.push(upload.artifactKey);
      } catch (error) {
        uploadFailures.push({
          artifactKey: upload.artifactKey,
          artifactType: upload.artifactType,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });
  const finalManifest = {
    ...collection.manifest,
    counts: {
      ...getRecord(collection.manifest.counts),
      uploaded: uploadedArtifactKeys.length,
      failed: uploadFailures.length,
    },
    ...(uploadFailures.length ? { uploadFailures } : {}),
  };
  const manifestUpload = buildDeclaredArtifactManifestUpload(finalManifest);
  try {
    await options.gateway.registerArtifact(options.getLease(), manifestUpload.upload);
    uploadedArtifactKeys.push(manifestUpload.upload.artifactKey);
  } catch (error) {
    uploadFailures.push({
      artifactKey: manifestUpload.upload.artifactKey,
      artifactType: manifestUpload.upload.artifactType,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    declaredArtifactCount: uploadedArtifactKeys.length,
    declaredArtifactKeys: uploadedArtifactKeys,
    declaredArtifactFailedCount: uploadFailures.length,
    ...(uploadFailures.length ? { declaredArtifactFailures: uploadFailures } : {}),
    artifactManifest: manifestUpload.manifest,
  };
}
