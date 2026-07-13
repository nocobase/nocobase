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

import { SKILL_ARCHIVE_ERROR_CODES, SKILL_ARCHIVE_LIMITS } from '../../node/skillArchive';
import { createSkillZipFixture } from '../../node/__tests__/skillArchiveFixtures';
import { AGENT_GATEWAY_SKILL_CAPABILITY_HEADER } from '../../shared/skillCapability';
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

function createStoredZip(entries: Record<string, string>) {
  return createSkillZipFixture(
    Object.entries(entries).map(([name, content]) => ({
      name,
      content,
    })),
  );
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

  async function createRunner(options: { nodeKey?: string; maxConcurrency?: number } = {}) {
    const nodeToken = createNodeToken();
    const now = new Date();
    const nodeKey = options.nodeKey || 'skill-version-download-node';
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey,
        displayName: nodeKey,
        status: 'active',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey: 'skill-test',
        displayName: 'Skill test',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
      },
    });
    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
    };
  }

  async function claimSkill(runner: Awaited<ReturnType<typeof createRunner>>, skillVersionId: string, runCode: string) {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode,
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        requestedAt: now,
        queuedAt: now,
        executionPayloadJson: {
          commandKey: 'skill-test',
          executionPolicyKey: 'skill-test',
          resolvedSkills: [{ skillVersionId }],
        },
      },
    });
    const response = await app
      .agent()
      .post(`/agentGatewayApi:claimRun/${runner.nodeId}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({ runId: run.get('id'), profileKey: 'skill-test' });
    expect(response.status).toBe(200);
    const claim = getData(response);
    expect(claim.claimed).toBe(true);
    const claimedRun = claim.run as Record<string, unknown>;
    const executionPayload = claimedRun.executionPayloadJson as Record<string, unknown>;
    const skillVersions = executionPayload.skillVersions as Array<Record<string, unknown>>;
    return {
      run,
      claim,
      source: skillVersions[0].source as Record<string, unknown>,
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

    const archiveUrl = new URL(String(source.archiveUrl));
    const archiveRequestPath = `${archiveUrl.pathname.replace(/^\/api/, '')}${archiveUrl.search}`;
    const forbiddenDownloadResponse = await app.agent().get(archiveRequestPath);
    expect(forbiddenDownloadResponse.status).toBe(401);

    const runner = await createRunner();
    const genericNodeDownloadResponse = await app
      .agent()
      .get(archiveRequestPath)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .buffer(true)
      .parse(binaryParser);
    expect(genericNodeDownloadResponse.status).toBe(404);

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
    expect(listResponse.body.meta).toMatchObject({
      count: 1,
      page: 1,
      pageSize: 20,
      totalPage: 1,
    });
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

    const detailResponse = await rootAgent.get(`/agentGatewayApi:getSkillVersion/${firstUpload.skillVersionId}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data).toMatchObject({
      id: firstUpload.skillVersionId,
      skillVersionId: firstUpload.skillVersionId,
      skillKey: 'nb-opencode-ui-batch',
      sourceSha256: sha256(secondContent),
    });

    const emptyPageResponse = await rootAgent.get('/agentGatewayApi:listSkillVersions?page=2&pageSize=1');
    expect(emptyPageResponse.status).toBe(200);
    expect(emptyPageResponse.body.data).toEqual([]);
    expect(emptyPageResponse.body.meta).toMatchObject({
      count: 1,
      page: 2,
      pageSize: 1,
      totalPage: 1,
    });
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

  it('authorizes archive downloads only for the bound node, run, claim attempt, digest, and expiry', async () => {
    const content = createStoredZip({
      'SKILL.md': '# Capability Skill\n',
    });
    const uploadResponse = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: 'capability-skill',
      versionLabel: 'v1',
      contentBase64: content.toString('base64'),
    });
    const upload = getData(uploadResponse);
    const runnerA = await createRunner({ nodeKey: 'skill-node-a', maxConcurrency: 2 });
    const runnerB = await createRunner({ nodeKey: 'skill-node-b' });
    const firstClaim = await claimSkill(runnerA, String(upload.skillVersionId), 'skill-capability-run-a');
    const firstUrl = new URL(String(firstClaim.source.archiveUrl));
    const firstPath = `${firstUrl.pathname.replace(/^\/api/, '')}${firstUrl.search}`;
    const firstCapabilityToken = String(firstClaim.source.capabilityToken);

    expect(firstClaim.source).toMatchObject({
      auth: 'skill-capability',
      runId: firstClaim.run.get('id'),
      claimAttempt: 1,
      sha256: sha256(content),
    });
    expect(firstCapabilityToken).toMatch(/^ag_skill_/);

    const authorized = await app
      .agent()
      .get(firstPath)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, firstCapabilityToken)
      .buffer(true)
      .parse(binaryParser);
    expect(authorized.status).toBe(200);
    expect(authorized.body).toEqual(content);

    const nodeTokenOnly = await app.agent().get(firstPath).set('Authorization', `Bearer ${runnerA.nodeToken}`);
    expect(nodeTokenOnly.status).toBe(404);
    const wrongNode = await app
      .agent()
      .get(firstPath)
      .set('Authorization', `Bearer ${runnerB.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, firstCapabilityToken);
    expect(wrongNode.status).toBe(404);

    const secondClaim = await claimSkill(runnerA, String(upload.skillVersionId), 'skill-capability-run-b');
    const secondCapabilityToken = String(secondClaim.source.capabilityToken);
    const wrongRunCapability = await app
      .agent()
      .get(firstPath)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, secondCapabilityToken);
    expect(wrongRunCapability.status).toBe(404);

    const wrongAttemptUrl = new URL(firstUrl);
    wrongAttemptUrl.searchParams.set('claimAttempt', '2');
    const wrongAttempt = await app
      .agent()
      .get(`${wrongAttemptUrl.pathname.replace(/^\/api/, '')}${wrongAttemptUrl.search}`)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, firstCapabilityToken);
    expect(wrongAttempt.status).toBe(404);

    const wrongShaUrl = new URL(firstUrl);
    wrongShaUrl.searchParams.set('sha256', '0'.repeat(64));
    const wrongSha = await app
      .agent()
      .get(`${wrongShaUrl.pathname.replace(/^\/api/, '')}${wrongShaUrl.search}`)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, firstCapabilityToken);
    expect(wrongSha.status).toBe(404);

    const firstCapability = await app.db.getRepository('agSkillDownloadCapabilities').findOne({
      filter: {
        runId: firstClaim.run.get('id'),
      },
    });
    expect(firstCapability).toBeTruthy();
    expect(firstCapability.get('tokenHash')).not.toBe(firstCapabilityToken);
    expect(JSON.stringify(firstCapability.toJSON())).not.toContain(firstCapabilityToken);
    await app.db.getRepository('agSkillDownloadCapabilities').update({
      filterByTk: firstCapability.get('id'),
      values: {
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const expired = await app
      .agent()
      .get(firstPath)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, firstCapabilityToken);
    expect(expired.status).toBe(404);

    await app.db.getRepository('agRuns').update({
      filterByTk: secondClaim.run.get('id'),
      values: {
        status: 'succeeded',
        claimExpiresAt: null,
      },
    });
    const secondUrl = new URL(String(secondClaim.source.archiveUrl));
    const terminalRun = await app
      .agent()
      .get(`${secondUrl.pathname.replace(/^\/api/, '')}${secondUrl.search}`)
      .set('Authorization', `Bearer ${runnerA.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, secondCapabilityToken);
    expect(terminalRun.status).toBe(404);

    const apiLogs = await app.db.getRepository('agApiCallLogs').find({
      filter: {
        path: {
          $includes: '/agentGatewayApi:claimRun/',
        },
      },
    });
    expect(JSON.stringify(apiLogs.map((log) => log.toJSON()))).not.toContain(firstCapabilityToken);
    expect(JSON.stringify(apiLogs.map((log) => log.toJSON()))).not.toContain(secondCapabilityToken);
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
    expect((await memberAgent.get('/agentGatewayApi:getSkillVersion/missing')).status).toBe(403);
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
    const runner = await createRunner();
    const claimed = await claimSkill(runner, String(upload.skillVersionId), 'secure-download-run');
    const archiveUrl = new URL(String(claimed.source.archiveUrl));
    const capabilityToken = String(claimed.source.capabilityToken);

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
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, capabilityToken);
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
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, capabilityToken);
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
    expect(message).toBe(SKILL_ARCHIVE_ERROR_CODES.invalidZip);
    expect(JSON.stringify(response.body)).not.toContain(storageDir);
    expect(JSON.stringify(response.body)).not.toContain('zipinfo');
    expect(await app.db.getRepository('agSkillVersions').count()).toBe(0);
  });

  it('rejects bounded malicious ZIP fixtures with stable 4xx error codes and no persisted versions', async () => {
    expect(SKILL_ARCHIVE_LIMITS).toEqual({
      maxDownloadBytes: 50 * 1024 * 1024,
      maxEntryCount: 1000,
      maxEntryUncompressedBytes: 25 * 1024 * 1024,
      maxTotalUncompressedBytes: 100 * 1024 * 1024,
      maxTotalCompressedBytes: 50 * 1024 * 1024,
      maxCompressionRatio: 100,
      maxPathBytes: 1024,
      maxDirectoryDepth: 20,
      maxFileNameBytes: 255,
      maxRedirects: 5,
    });

    const fixtures: Array<{ name: string; archive: Buffer; code: string }> = [
      {
        name: 'entry-count',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Entry Count\n' },
          ...Array.from({ length: SKILL_ARCHIVE_LIMITS.maxEntryCount }, (_, index) => ({
            name: `dir-${index}/`,
          })),
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.entryCount,
      },
      {
        name: 'single-entry-size',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Entry Size\n' },
          {
            name: 'large.bin',
            content: 'x',
            compression: 'deflated',
            declaredCompressedSize: 1024 * 1024,
            declaredUncompressedSize: SKILL_ARCHIVE_LIMITS.maxEntryUncompressedBytes + 1,
          },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.entrySize,
      },
      {
        name: 'total-uncompressed-size',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Total Size\n' },
          ...Array.from({ length: 4 }, (_, index) => ({
            name: `large-${index}.bin`,
            content: 'x',
            compression: 'deflated' as const,
            declaredCompressedSize: 256 * 1024,
            declaredUncompressedSize: SKILL_ARCHIVE_LIMITS.maxEntryUncompressedBytes,
          })),
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.totalUncompressedSize,
      },
      {
        name: 'compression-ratio',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# ZIP Bomb\n' },
          { name: 'bomb.bin', content: Buffer.alloc(1024 * 1024), compression: 'deflated' },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.compressionRatio,
      },
      {
        name: 'path-traversal',
        archive: createSkillZipFixture([{ name: '../SKILL.md', content: '# Traversal\n' }]),
        code: SKILL_ARCHIVE_ERROR_CODES.unsafePath,
      },
      {
        name: 'absolute-path',
        archive: createSkillZipFixture([{ name: '/SKILL.md', content: '# Absolute\n' }]),
        code: SKILL_ARCHIVE_ERROR_CODES.unsafePath,
      },
      {
        name: 'path-length',
        archive: createSkillZipFixture([
          { name: `${Array.from({ length: 5 }, () => 'a'.repeat(210)).join('/')}/SKILL.md`, content: '# Long\n' },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.pathLength,
      },
      {
        name: 'path-depth',
        archive: createSkillZipFixture([
          { name: `${Array.from({ length: 22 }, () => 'd').join('/')}/SKILL.md`, content: '# Deep\n' },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.pathDepth,
      },
      {
        name: 'file-name-length',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Long Name\n' },
          { name: 'n'.repeat(256), content: 'x' },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.fileNameLength,
      },
      {
        name: 'symlink',
        archive: createSkillZipFixture([{ name: 'SKILL.md', content: 'target', unixMode: 0o120777 }]),
        code: SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType,
      },
      {
        name: 'device',
        archive: createSkillZipFixture([{ name: 'SKILL.md', unixMode: 0o020666 }]),
        code: SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType,
      },
      {
        name: 'case-conflict',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Duplicate\n' },
          { name: 'skill.md', content: '# Case Conflict\n' },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.duplicatePath,
      },
      {
        name: 'hardlink-offset',
        archive: createSkillZipFixture([
          { name: 'SKILL.md', content: '# Hardlink\n' },
          { name: 'README.md', content: 'alias', localHeaderOffset: 0 },
        ]),
        code: SKILL_ARCHIVE_ERROR_CODES.hardlink,
      },
    ];

    for (const fixture of fixtures) {
      const response = await rootAgent.post('/agentGatewayApi:uploadSkillVersion').send({
        skillKey: `malicious-${fixture.name}`,
        versionLabel: 'v1',
        contentBase64: fixture.archive.toString('base64'),
      });
      expect(response.status, fixture.name).toBe(400);
      expect(String(response.body.errors?.[0]?.message || ''), fixture.name).toBe(fixture.code);
      expect(JSON.stringify(response.body), fixture.name).not.toContain(storageDir);
      expect(await app.db.getRepository('agSkillVersions').count(), fixture.name).toBe(0);
    }

    const uploadDir = path.join(storageDir, 'agent-gateway', 'skill-uploads');
    const uploadFiles = await fs.readdir(uploadDir).catch(() => []);
    expect(uploadFiles).toEqual([]);
  });
});
