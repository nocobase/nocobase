/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { uploadExternalRun } from '../externalRunUploader';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';
import { EXTERNAL_IMPORT_LIMITS } from '../../shared/externalRunImport';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../../shared/apiContract';

class UploadRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    return {
      runId: 'run-1',
      requestNumber: this.calls.length,
    } as T;
  }
}

function getBody(call: GatewayRequestOptions) {
  return call.body as JsonRecord;
}

describe('external run uploader', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-external-upload-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('streams large logs through stable observation batches and finalizes separately', async () => {
    const logPath = path.join(tempDir, 'codex.jsonl');
    await fs.writeFile(logPath, ['line-1', 'line-2', 'line-3', 'line-4', 'line-5'].join('\n'));
    const firstRequester = new UploadRequester();
    const secondRequester = new UploadRequester();
    const uploadOptions = {
      authToken: 'api-token',
      provider: 'codex',
      externalRunKey: 'external-1',
      title: 'Imported run',
      resultSummary: {
        totalTokens: 42,
      },
      log: {
        filePath: logPath,
        format: 'codex-jsonl' as const,
        artifactKey: 'raw-codex-log',
      },
      maxLogBatchLines: 2,
      maxLogBatchBytes: 1024,
    };

    const firstResult = await uploadExternalRun({
      ...uploadOptions,
      requester: firstRequester,
    });
    await uploadExternalRun({
      ...uploadOptions,
      requester: secondRequester,
    });

    expect(firstRequester.calls).toHaveLength(4);
    expect(firstRequester.calls.map((call) => call.path)).toEqual([
      getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
      getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations, 'run-1'),
      getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations, 'run-1'),
      getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations, 'run-1'),
    ]);
    expect(firstRequester.calls.map((call) => getBody(call).batchKey)).toEqual(
      secondRequester.calls.map((call) => getBody(call).batchKey),
    );
    expect(getBody(firstRequester.calls[0])).toMatchObject({
      status: 'running',
      externalRunKey: 'external-1',
      logs: [
        {
          artifactKey: 'raw-codex-log:part-000001',
          contentText: 'line-1\nline-2',
        },
      ],
    });
    expect(getBody(firstRequester.calls[2])).toMatchObject({
      logs: [
        {
          artifactKey: 'raw-codex-log:part-000003',
          contentText: 'line-5',
        },
      ],
    });
    expect(getBody(firstRequester.calls[3])).toMatchObject({
      status: 'succeeded',
      resultSummary: {
        totalTokens: 42,
      },
      logs: [],
      artifacts: [],
    });
    expect(firstResult).toMatchObject({
      runId: 'run-1',
      requestNumber: 4,
    });
  });

  it('keeps batch keys stable when a retry payload changes so the server can reject it', async () => {
    const logPath = path.join(tempDir, 'mutable.log');
    const firstRequester = new UploadRequester();
    const secondRequester = new UploadRequester();
    await fs.writeFile(logPath, 'first payload');
    await uploadExternalRun({
      requester: firstRequester,
      authToken: 'api-token',
      provider: 'generic-cli',
      externalRunKey: 'mutable-run',
      log: {
        filePath: logPath,
        format: 'text',
      },
    });
    await fs.writeFile(logPath, 'changed payload');
    await uploadExternalRun({
      requester: secondRequester,
      authToken: 'api-token',
      provider: 'generic-cli',
      externalRunKey: 'mutable-run',
      log: {
        filePath: logPath,
        format: 'text',
      },
    });

    expect(getBody(firstRequester.calls[0]).batchKey).toBe(getBody(secondRequester.calls[0]).batchKey);
    expect(getBody(firstRequester.calls[0]).logs).not.toEqual(getBody(secondRequester.calls[0]).logs);
  });

  it('uploads artifacts one at a time instead of combining them into one request', async () => {
    const firstArtifact = path.join(tempDir, 'first.txt');
    const secondArtifact = path.join(tempDir, 'second.txt');
    await fs.writeFile(firstArtifact, 'first artifact');
    await fs.writeFile(secondArtifact, 'second artifact');
    const requester = new UploadRequester();

    await uploadExternalRun({
      requester,
      authToken: 'api-token',
      provider: 'generic-cli',
      runCode: 'external_artifacts_1',
      artifactPaths: [firstArtifact, secondArtifact],
    });

    expect(requester.calls).toHaveLength(3);
    expect((getBody(requester.calls[0]).artifacts as JsonRecord[])[0]).toMatchObject({
      artifactKey: 'external:first.txt',
      contentText: 'first artifact',
    });
    expect((getBody(requester.calls[1]).artifacts as JsonRecord[])[0]).toMatchObject({
      artifactKey: 'external:second.txt',
      contentText: 'second artifact',
    });
    expect(getBody(requester.calls[2])).toMatchObject({
      status: 'succeeded',
      artifacts: [],
    });
  });

  it('preserves unknown binary artifacts with base64 encoding', async () => {
    const artifactPath = path.join(tempDir, 'binary.bin');
    const content = Buffer.from([0, 255, 1, 254, 2, 253]);
    await fs.writeFile(artifactPath, content);
    const requester = new UploadRequester();

    await uploadExternalRun({
      requester,
      authToken: 'api-token',
      provider: 'generic-cli',
      externalRunKey: 'binary-artifact',
      artifactPaths: [artifactPath],
    });

    expect((getBody(requester.calls[0]).artifacts as JsonRecord[])[0]).toMatchObject({
      mimeType: 'application/octet-stream',
      sizeBytes: content.byteLength,
      contentText: `data:application/octet-stream;base64,${content.toString('base64')}`,
    });
  });

  it('rejects one oversized log line before issuing a partial import', async () => {
    const logPath = path.join(tempDir, 'oversized.log');
    await fs.writeFile(logPath, 'x'.repeat(65));
    const requester = new UploadRequester();

    await expect(
      uploadExternalRun({
        requester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'oversized-line',
        log: {
          filePath: logPath,
          format: 'text',
        },
        maxLogBatchBytes: 64,
      }),
    ).rejects.toThrow('line larger than the 64-byte upload chunk limit');
    expect(requester.calls).toHaveLength(0);
  });

  it('rejects an artifact that cannot fit in one bounded request', async () => {
    const artifactPath = path.join(tempDir, 'oversized.txt');
    await fs.writeFile(artifactPath, 'x'.repeat(65));
    const requester = new UploadRequester();

    await expect(
      uploadExternalRun({
        requester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'oversized-artifact',
        artifactPaths: [artifactPath],
        maxArtifactContentBytes: 64,
      }),
    ).rejects.toThrow('is too large for one upload batch');
    expect(requester.calls).toHaveLength(0);
  });

  it('preflights later file failures and duplicate artifact keys before creating a run', async () => {
    const validLogPath = path.join(tempDir, 'valid.log');
    const invalidLogPath = path.join(tempDir, 'invalid.log');
    const firstArtifact = path.join(tempDir, 'first', 'duplicate.txt');
    const secondArtifact = path.join(tempDir, 'second', 'duplicate.txt');
    await fs.mkdir(path.dirname(firstArtifact), { recursive: true });
    await fs.mkdir(path.dirname(secondArtifact), { recursive: true });
    await fs.writeFile(validLogPath, 'valid');
    await fs.writeFile(invalidLogPath, 'x'.repeat(65));
    await fs.writeFile(firstArtifact, 'first');
    await fs.writeFile(secondArtifact, 'second');
    const requester = new UploadRequester();

    await expect(
      uploadExternalRun({
        requester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'duplicate-artifacts',
        log: {
          filePath: validLogPath,
          format: 'text',
        },
        artifactPaths: [firstArtifact, secondArtifact],
      }),
    ).rejects.toThrow('External artifacts must have unique file names');
    expect(requester.calls).toHaveLength(0);

    await expect(
      uploadExternalRun({
        requester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'later-invalid-log',
        log: {
          filePath: invalidLogPath,
          format: 'text',
        },
        artifactPaths: [firstArtifact],
        maxLogBatchBytes: 64,
      }),
    ).rejects.toThrow('line larger than the 64-byte upload chunk limit');
    expect(requester.calls).toHaveLength(0);
  });

  it('preflights JSON-escaped file payloads and final summaries before creating a run', async () => {
    const logPath = path.join(tempDir, 'escaped.log');
    const escapedLine = '\\'.repeat(Math.floor(EXTERNAL_IMPORT_LIMITS.maxPayloadBytes / 2) + 1024);
    await fs.writeFile(logPath, `valid-first-batch\n${escapedLine}`);
    const logRequester = new UploadRequester();

    await expect(
      uploadExternalRun({
        requester: logRequester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'escaped-log',
        log: {
          filePath: logPath,
          format: 'text',
        },
        maxLogBatchLines: 1,
      }),
    ).rejects.toThrow('exceeds the');
    expect(logRequester.calls).toHaveLength(0);

    const finalRequester = new UploadRequester();
    await fs.writeFile(logPath, 'valid log');
    await expect(
      uploadExternalRun({
        requester: finalRequester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'oversized-final-summary',
        log: {
          filePath: logPath,
          format: 'text',
        },
        resultSummary: {
          output: '\\'.repeat(Math.floor(EXTERNAL_IMPORT_LIMITS.maxPayloadBytes / 2) + 1024),
        },
      }),
    ).rejects.toThrow('exceeds the');
    expect(finalRequester.calls).toHaveLength(0);
  });

  it('rejects unsupported final statuses before uploading observations', async () => {
    const logPath = path.join(tempDir, 'status.log');
    await fs.writeFile(logPath, 'status validation');
    const requester = new UploadRequester();

    await expect(
      uploadExternalRun({
        requester,
        authToken: 'api-token',
        provider: 'generic-cli',
        externalRunKey: 'invalid-status',
        status: 'invalid' as 'succeeded',
        log: {
          filePath: logPath,
          format: 'text',
        },
      }),
    ).rejects.toThrow('status must be one of');
    expect(requester.calls).toHaveLength(0);
  });
});
