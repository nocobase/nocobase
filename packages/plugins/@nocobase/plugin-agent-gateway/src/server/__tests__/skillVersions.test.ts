/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { MockServer, createMockServer } from '@nocobase/test';

import PluginAgentGatewayServer from '../plugin';
import { createNodeToken, toStoredTokenFields } from '../security';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function sha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function crc32(content: Buffer) {
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime() {
  const year = 2026;
  const month = 7;
  const day = 1;
  const hour = 0;
  const minute = 0;
  const second = 0;
  return {
    dosTime: (hour << 11) | (minute << 5) | Math.floor(second / 2),
    dosDate: ((year - 1980) << 9) | (month << 5) | day,
  };
}

function createStoredZip(entries: Record<string, string>) {
  const localFileParts: Buffer[] = [];
  const centralDirectoryParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime();

  for (const [entryName, entryText] of Object.entries(entries)) {
    const name = Buffer.from(entryName);
    const content = Buffer.from(entryText);
    const crc = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(10, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localFileParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(10, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectoryParts.push(centralHeader, name);
    offset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(Object.keys(entries).length, 8);
  endOfCentralDirectory.writeUInt16LE(Object.keys(entries).length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);
  return Buffer.concat([...localFileParts, centralDirectory, endOfCentralDirectory]);
}

function binaryParser(response: NodeJS.ReadableStream, callback: (error: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });
  response.on('error', (error) => {
    callback(error);
  });
}

describe('agent gateway Skill version upload APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let storageDir: string;
  let originalStoragePath: string | undefined;

  beforeEach(async () => {
    originalStoragePath = process.env.STORAGE_PATH;
    storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-skill-version-upload-'));
    process.env.STORAGE_PATH = storageDir;
    app = await createMockServer({
      plugins: [
        'system-settings',
        'field-sort',
        'users',
        'departments',
        'auth',
        'acl',
        'data-source-manager',
        'error-handler',
        [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
      ],
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  async function createRunner() {
    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'skill-version-download-node',
        displayName: 'Skill version download node',
        status: 'active',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    return {
      nodeId: String(node.get('id')),
      nodeToken: nodeToken.token,
    };
  }

  it('lets managers upload ZIP bytes and solidifies them onto one Skill version', async () => {
    const firstContent = createStoredZip({
      'SKILL.md': '# Test Skill v1\n',
    });
    const firstResponse = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'nb-opencode-ui-batch',
      displayName: 'NocoBase OpenCode UI Batch',
      description: 'Builds NocoBase UI pages through OpenCode.',
      versionLabel: '2026-07-01',
      contentBase64: firstContent.toString('base64'),
      manifest: {
        name: 'nb-opencode-ui-batch',
      },
      metadata: {
        channel: 'smoke',
      },
    });
    const firstUpload = getData(firstResponse);

    expect(firstResponse.status).toBe(200);
    expect(firstUpload).toMatchObject({
      skillKey: 'nb-opencode-ui-batch',
      versionLabel: '2026-07-01',
      status: 'active',
      idempotent: false,
      source: {
        type: 'zip',
        sha256: sha256(firstContent),
        sizeBytes: firstContent.byteLength,
        auth: 'node-token',
      },
    });
    expect(JSON.stringify(firstUpload)).not.toContain(firstContent.toString('base64'));

    const source = firstUpload.source as Record<string, unknown>;
    expect(source.archivePath).toBeUndefined();
    expect(String(source.archiveUrl)).toContain(`/agentGatewayApi:downloadSkillVersion/${firstUpload.skillVersionId}`);

    const skillVersion = await app.db.getRepository('agSkillVersions').findOne({
      filterByTk: firstUpload.skillVersionId,
    });
    expect(skillVersion).toBeTruthy();
    expect(skillVersion.get('metadataJson')).toMatchObject({
      channel: 'smoke',
      source: {
        type: 'zip',
        sha256: sha256(firstContent),
        sizeBytes: firstContent.byteLength,
      },
    });
    const metadataSource = (skillVersion.get('metadataJson') as Record<string, Record<string, unknown>>).source;
    const archivePath = String(metadataSource.archivePath);
    expect(archivePath.startsWith(path.join(storageDir, 'agent-gateway', 'skill-uploads'))).toBe(true);
    expect(await fs.readFile(archivePath)).toEqual(firstContent);

    const runner = await createRunner();
    const archiveUrl = new URL(String(source.archiveUrl));
    const archiveRequestPath = `${archiveUrl.pathname.replace(/^\/api/, '')}${archiveUrl.search}`;
    const forbiddenDownloadResponse = await app.agent().get(archiveRequestPath);
    expect(forbiddenDownloadResponse.status).toBe(401);

    const downloadResponse = await app
      .agent()
      .get(archiveRequestPath)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .buffer(true)
      .parse(binaryParser);
    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.body).toEqual(firstContent);

    const secondContent = createStoredZip({
      'SKILL.md': '# Test Skill v2\n',
    });
    const secondResponse = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'nb-opencode-ui-batch',
      versionLabel: '2026-07-01',
      contentBase64: secondContent.toString('base64'),
      metadata: {
        channel: 'updated',
      },
    });
    const secondUpload = getData(secondResponse);

    expect(secondResponse.status).toBe(200);
    expect(secondUpload.skillVersionId).toBe(firstUpload.skillVersionId);
    expect(secondUpload).toMatchObject({
      idempotent: false,
      source: {
        sha256: sha256(secondContent),
        sizeBytes: secondContent.byteLength,
      },
    });
    expect(await app.db.getRepository('agSkillVersions').count()).toBe(1);
    const updatedSkillVersion = await app.db.getRepository('agSkillVersions').findOne({
      filterByTk: firstUpload.skillVersionId,
    });
    expect(updatedSkillVersion.get('metadataJson')).toMatchObject({
      channel: 'updated',
      source: {
        sha256: sha256(secondContent),
      },
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listSkillVersions');
    expect(listResponse.status).toBe(200);
    const listedSkillVersions = listResponse.body.data as Array<Record<string, unknown>>;
    expect(listedSkillVersions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstUpload.skillVersionId,
          skillVersionId: firstUpload.skillVersionId,
          skillKey: 'nb-opencode-ui-batch',
          displayName: 'NocoBase OpenCode UI Batch',
          versionLabel: '2026-07-01',
          status: 'active',
          skillStatus: 'active',
          sourceType: 'zip',
          sourceSha256: sha256(secondContent),
          sourceSizeBytes: secondContent.byteLength,
        }),
      ]),
    );
  });

  it('uploads Skill ZIP files in bounded chunks before creating the version', async () => {
    const content = createStoredZip({
      'SKILL.md': '# Chunked Skill\n',
    });
    const initResponse = await rootAgent.post('/agentGatewayApi:initFileUpload').send({
      purpose: 'skill-version',
      fileName: 'chunked-skill.zip',
      mimeType: 'application/zip',
      sizeBytes: content.byteLength,
    });
    expect(initResponse.status).toBe(200);
    const upload = getData(initResponse);
    const uploadId = String(upload.id);
    expect(upload.chunkSize).toBe(1024 * 1024);

    const midpoint = Math.floor(content.byteLength / 2);
    const firstChunk = content.subarray(0, midpoint);
    const secondChunk = content.subarray(midpoint);
    const firstAppendResponse = await rootAgent.post(`/agentGatewayApi:appendFileUpload/${uploadId}`).send({
      offset: 0,
      contentBase64: firstChunk.toString('base64'),
    });
    expect(firstAppendResponse.status).toBe(200);
    const retryResponse = await rootAgent.post(`/agentGatewayApi:appendFileUpload/${uploadId}`).send({
      offset: 0,
      contentBase64: firstChunk.toString('base64'),
    });
    expect(retryResponse.status).toBe(200);
    expect(getData(retryResponse)).toMatchObject({ idempotent: true, receivedBytes: firstChunk.byteLength });
    const secondAppendResponse = await rootAgent.post(`/agentGatewayApi:appendFileUpload/${uploadId}`).send({
      offset: firstChunk.byteLength,
      contentBase64: secondChunk.toString('base64'),
    });
    expect(secondAppendResponse.status).toBe(200);

    const completeResponse = await rootAgent.post(`/agentGatewayApi:completeFileUpload/${uploadId}`).send({});
    expect(completeResponse.status).toBe(200);
    expect(getData(completeResponse)).toMatchObject({
      id: uploadId,
      status: 'completed',
      sha256: sha256(content),
    });

    const createResponse = await rootAgent.post('/agentGatewayApi:createSkillVersionFromUpload').send({
      uploadId,
      skillKey: 'chunked-skill',
      displayName: 'Chunked Skill',
      versionLabel: 'v1',
    });
    expect(createResponse.status).toBe(200);
    expect(getData(createResponse)).toMatchObject({
      skillKey: 'chunked-skill',
      versionLabel: 'v1',
      status: 'active',
    });

    const storedUpload = await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId });
    expect(storedUpload?.get('status')).toBe('consumed');
    await expect(fs.stat(String(storedUpload?.get('storagePath')))).rejects.toThrow();
  });

  it('rejects ZIP uploads without Agent Gateway management permission', async () => {
    const memberUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-skill-upload-member',
        roles: ['member'],
      },
    });
    const memberAgent = await app.agent().login(memberUser);

    const response = await memberAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'blocked-skill',
      versionLabel: 'v1',
      contentBase64: Buffer.from('fake skill zip bytes').toString('base64'),
    });

    expect(response.status).toBe(403);
    expect((await memberAgent.get('/agentGatewayApi:listSkillVersions')).status).toBe(403);
    expect(await app.db.getRepository('agSkillVersions').count()).toBe(0);
  });

  it('rejects archive downloads outside the upload directory or with mismatched bytes', async () => {
    const archiveContent = createStoredZip({
      'SKILL.md': '# Secure Skill\n',
    });
    const uploadResponse = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'secure-download-skill',
      versionLabel: 'v1',
      contentBase64: archiveContent.toString('base64'),
    });
    const upload = getData(uploadResponse);
    const versionRepo = app.db.getRepository('agSkillVersions');
    const skillVersion = await versionRepo.findOne({
      filterByTk: upload.skillVersionId,
    });
    const metadata = skillVersion.get('metadataJson') as Record<string, Record<string, unknown>>;
    const originalSource = metadata.source;
    const archiveUrl = new URL(String((upload.source as Record<string, unknown>).archiveUrl));
    const runner = await createRunner();

    const outsideArchivePath = path.join(storageDir, 'outside-skill.zip');
    await fs.writeFile(outsideArchivePath, archiveContent);
    await versionRepo.update({
      filterByTk: upload.skillVersionId,
      values: {
        metadataJson: {
          ...metadata,
          source: {
            ...originalSource,
            archivePath: outsideArchivePath,
          },
        },
      },
    });
    const outsideResponse = await app
      .agent()
      .get(`${archiveUrl.pathname.replace(/^\/api/, '')}${archiveUrl.search}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`);
    expect(outsideResponse.status).toBe(404);
    expect(JSON.stringify(outsideResponse.body)).not.toContain(storageDir);

    await versionRepo.update({
      filterByTk: upload.skillVersionId,
      values: {
        metadataJson: {
          ...metadata,
          source: originalSource,
        },
      },
    });
    await fs.writeFile(String(originalSource.archivePath), createStoredZip({ 'SKILL.md': '# Tampered Skill\n' }));
    const tamperedResponse = await app
      .agent()
      .get(`${archiveUrl.pathname.replace(/^\/api/, '')}${archiveUrl.search}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`);
    expect(tamperedResponse.status).toBe(404);
    expect(JSON.stringify(tamperedResponse.body)).not.toContain(String(originalSource.archivePath));
  });

  it('rejects invalid ZIP uploads before creating Skill versions', async () => {
    const response = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'invalid-skill',
      versionLabel: 'v1',
      contentBase64: Buffer.from('fake skill zip bytes').toString('base64'),
    });

    expect(response.status).toBe(400);
    const message = String(response.body.errors?.[0]?.message || '');
    expect(message).toBe('Invalid Skill ZIP archive');
    expect(JSON.stringify(response.body)).not.toContain(storageDir);
    expect(JSON.stringify(response.body)).not.toContain('zipinfo');
    expect(await app.db.getRepository('agSkillVersions').count()).toBe(0);
  });
});
