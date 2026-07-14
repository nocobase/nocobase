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
import http from 'http';
import { AddressInfo } from 'net';
import os from 'os';
import path from 'path';

import {
  downloadSkillArchive,
  extractSkillZipArchive,
  SKILL_ARCHIVE_ERROR_CODES,
  SKILL_ARCHIVE_LIMITS,
} from '../../node/skillArchive';
import { createSkillZipFixture, createValidSkillZipFixture } from '../../node/__tests__/skillArchiveFixtures';
import { AGENT_GATEWAY_SKILL_CAPABILITY_HEADER } from '../../shared/skillCapability';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../../shared/apiContract';
import {
  createSkillArchiveOriginPolicy,
  NodeSkillInstallPayload,
  persistSkillZipUpload,
  solidifyGitHubSkillSource,
  syncNodeSkillVersion,
} from '../skillSync';

function sha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

async function createRedirectArchiveServer(content: Buffer) {
  const server = http.createServer((request, response) => {
    if (request.url === '/start.zip') {
      response.statusCode = 302;
      response.setHeader('Location', '/final.zip');
      response.end();
      return;
    }
    response.statusCode = 200;
    response.end(content);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/start.zip`,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

async function createCrossOriginRedirectArchiveServers(content: Buffer) {
  const targetRequests: Array<{ originHeader: string }> = [];
  const targetServer = http.createServer((request, response) => {
    targetRequests.push({ originHeader: String(request.headers['x-archive-origin'] || '') });
    response.statusCode = 200;
    response.end(content);
  });
  await new Promise<void>((resolve) => {
    targetServer.listen(0, '127.0.0.1', resolve);
  });
  const targetAddress = targetServer.address() as AddressInfo;
  const targetUrl = `http://127.0.0.1:${targetAddress.port}/final.zip`;

  const sourceRequests: Array<{ originHeader: string }> = [];
  const sourceServer = http.createServer((request, response) => {
    sourceRequests.push({ originHeader: String(request.headers['x-archive-origin'] || '') });
    response.statusCode = 302;
    response.setHeader('Location', targetUrl);
    response.end();
  });
  await new Promise<void>((resolve) => {
    sourceServer.listen(0, '127.0.0.1', resolve);
  });
  const sourceAddress = sourceServer.address() as AddressInfo;
  const sourceUrl = `http://127.0.0.1:${sourceAddress.port}/start.zip`;

  const closeServer = async (server: http.Server) =>
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

  return {
    sourceUrl,
    targetUrl,
    sourceRequests,
    targetRequests,
    close: async () => {
      await closeServer(sourceServer);
      await closeServer(targetServer);
    },
  };
}

async function createAuthenticatedArchiveServer(
  content: Buffer,
  expectedAuthorization: string,
  expectedCapability: string,
) {
  const requests: Array<{ authorization: string; capability: string }> = [];
  const server = http.createServer((request, response) => {
    const capabilityHeader = request.headers[AGENT_GATEWAY_SKILL_CAPABILITY_HEADER];
    const capability = Array.isArray(capabilityHeader) ? capabilityHeader[0] : capabilityHeader || '';
    requests.push({ authorization: request.headers.authorization || '', capability });
    if (request.headers.authorization !== expectedAuthorization || capability !== expectedCapability) {
      response.statusCode = 401;
      response.end('unauthorized');
      return;
    }
    response.statusCode = 200;
    response.end(content);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}${getAgentGatewayApiPath(
      AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
      '55555555-5555-4555-8555-555555555555',
    )}?sha256=${sha256(content)}&runId=run-1&claimAttempt=1`,
    requests,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

async function createStalledArchiveServer() {
  let resolveRequestStarted: () => void = () => {};
  let resolveResponseClosed: () => void = () => {};
  const requestStarted = new Promise<void>((resolve) => {
    resolveRequestStarted = resolve;
  });
  const responseClosed = new Promise<void>((resolve) => {
    resolveResponseClosed = resolve;
  });
  const server = http.createServer((_request, response) => {
    resolveRequestStarted();
    response.once('close', resolveResponseClosed);
    response.writeHead(200, {
      'Content-Type': 'application/zip',
    });
    response.write('partial archive');
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/stalled.zip`,
    requestStarted,
    responseClosed,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

async function createChunkedOversizedArchiveServer(content: Buffer, redirect = false) {
  const server = http.createServer((request, response) => {
    if (redirect && request.url === '/start.zip') {
      response.statusCode = 302;
      response.setHeader('Location', '/oversized.zip');
      response.end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/zip' });
    for (let offset = 0; offset < content.length; offset += 7) {
      response.write(content.subarray(offset, offset + 7));
    }
    response.end();
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/${redirect ? 'start.zip' : 'oversized.zip'}`,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

describe('agent gateway daemon skill version sync', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-skill-sync-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('persists uploaded Skill ZIP bytes as a solidified archive source', async () => {
    const content = Buffer.from('fake zip bytes');
    const source = await persistSkillZipUpload({
      content,
      uploadDir: path.join(tempDir, 'uploads'),
      now: new Date('2026-07-01T00:00:00.000Z'),
    });

    expect(source).toMatchObject({
      type: 'zip',
      sha256: sha256(content),
      sizeBytes: content.byteLength,
      uploadedAt: '2026-07-01T00:00:00.000Z',
    });
    expect(await fs.readFile(String(source.archivePath))).toEqual(content);
  });

  it('rejects floating GitHub refs and solidifies commit sources to immutable archive URLs', () => {
    expect(() =>
      solidifyGitHubSkillSource({
        type: 'github',
        repoUrl: 'https://github.com/example/skills',
        ref: 'main',
      }),
    ).toThrow(/commit SHA/);

    const solidified = solidifyGitHubSkillSource({
      type: 'github',
      repoUrl: 'https://github.com/example/skills.git',
      commitSha: '0123456789abcdef0123456789abcdef01234567',
    });
    expect(solidified).toMatchObject({
      repoUrl: 'https://github.com/example/skills',
      ref: '0123456789abcdef0123456789abcdef01234567',
      archiveUrl: 'https://github.com/example/skills/archive/0123456789abcdef0123456789abcdef01234567.zip',
    });

    const ignoredCustomArchive = solidifyGitHubSkillSource({
      type: 'github',
      repoUrl: 'https://github.com/example/skills',
      commitSha: '0123456789abcdef0123456789abcdef01234567',
      archiveUrl: 'https://archives.example.test/mutable-or-wrong.zip',
    });
    expect(ignoredCustomArchive.archiveUrl).toBe(
      'https://github.com/example/skills/archive/0123456789abcdef0123456789abcdef01234567.zip',
    );

    const hashedCustomArchive = solidifyGitHubSkillSource({
      type: 'github',
      repoUrl: 'https://github.com/example/skills.git',
      archiveUrl: 'https://archives.example.test/solidified.zip',
      sha256: 'solidified-custom-archive-sha256',
    });
    expect(hashedCustomArchive).toMatchObject({
      repoUrl: 'https://github.com/example/skills',
      archiveUrl: 'https://archives.example.test/solidified.zip',
      sha256: 'solidified-custom-archive-sha256',
    });
  });

  it('allows the public GitHub archive redirect to codeload but rejects unrelated origins', () => {
    const source = solidifyGitHubSkillSource({
      type: 'github',
      repoUrl: 'https://github.com/example/skills',
      commitSha: '0123456789abcdef0123456789abcdef01234567',
    });
    const assertOriginAllowed = createSkillArchiveOriginPolicy(source, String(source.archiveUrl));

    expect(() => assertOriginAllowed(new URL(String(source.archiveUrl)))).not.toThrow();
    expect(() =>
      assertOriginAllowed(
        new URL('https://codeload.github.com/example/skills/zip/0123456789abcdef0123456789abcdef01234567'),
      ),
    ).not.toThrow();
    expect(() => assertOriginAllowed(new URL('https://archives.example.test/skill.zip'))).toThrow(
      SKILL_ARCHIVE_ERROR_CODES.downloadOrigin,
    );

    const customSource = solidifyGitHubSkillSource({
      type: 'github',
      repoUrl: 'https://github.com/example/skills',
      archiveUrl: 'https://archives.example.test/solidified.zip',
      sha256: 'solidified-custom-archive-sha256',
    });
    const assertCustomOriginAllowed = createSkillArchiveOriginPolicy(customSource, String(customSource.archiveUrl));
    expect(() => assertCustomOriginAllowed(new URL(String(customSource.archiveUrl)))).not.toThrow();
    expect(() => assertCustomOriginAllowed(new URL('https://codeload.github.com/example/skills/zip/main'))).toThrow(
      SKILL_ARCHIVE_ERROR_CODES.downloadOrigin,
    );
  });

  it('installs a specific skillVersionId idempotently and writes agNodeSkillInstalls payloads', async () => {
    const archiveContent = Buffer.from('fake archive');
    const archivePath = path.join(tempDir, 'skill.zip');
    await fs.writeFile(archivePath, archiveContent);
    const installPayloads: NodeSkillInstallPayload[] = [];
    const skillVersion = {
      skillVersionId: '11111111-1111-4111-8111-111111111111',
      versionLabel: 'v1',
      source: {
        type: 'zip' as const,
        archivePath,
        sha256: sha256(archiveContent),
        capabilityToken: 'ag_skill_INSTALL_CAPABILITY_SECRET',
        runId: 'run-1',
        claimAttempt: 1,
      },
    };

    const first = await syncNodeSkillVersion({
      nodeId: 'node-1',
      skillsRoot: path.join(tempDir, 'skills'),
      skillVersion,
      extractArchive: async (_source, destination) => {
        await fs.writeFile(path.join(destination, 'SKILL.md'), '# Test Skill\n');
      },
      writeInstallStatus: async (payload) => {
        installPayloads.push(payload);
      },
    });
    const second = await syncNodeSkillVersion({
      nodeId: 'node-1',
      skillsRoot: path.join(tempDir, 'skills'),
      skillVersion,
      extractArchive: async () => {
        throw new Error('idempotent install should not extract again');
      },
      writeInstallStatus: async (payload) => {
        installPayloads.push(payload);
      },
    });

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(second.installPath).toBe(first.installPath);
    expect(await fs.readFile(path.join(first.installPath, 'SKILL.md'), 'utf8')).toContain('Test Skill');
    expect(installPayloads).toHaveLength(2);
    expect(installPayloads[0]).toMatchObject({
      nodeId: 'node-1',
      skillVersionId: skillVersion.skillVersionId,
      status: 'installed',
      capabilityToken: 'ag_skill_INSTALL_CAPABILITY_SECRET',
      runId: 'run-1',
      claimAttempt: 1,
      sourceSha256: sha256(archiveContent),
    });
    expect(installPayloads[1]).toMatchObject({
      nodeId: 'node-1',
      skillVersionId: skillVersion.skillVersionId,
      status: 'installed',
    });
    expect(JSON.stringify(installPayloads[0].settingsSnapshotJson)).not.toContain('INSTALL_CAPABILITY_SECRET');
    expect(JSON.stringify(installPayloads)).not.toContain('main');
  });

  it('downloads redirected immutable archives before installing a Skill version', async () => {
    const archiveContent = Buffer.from('redirected archive');
    const server = await createRedirectArchiveServer(archiveContent);
    try {
      const result = await syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot: path.join(tempDir, 'skills'),
        cacheRoot: path.join(tempDir, 'cache'),
        skillVersion: {
          skillVersionId: '44444444-4444-4444-8444-444444444444',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archiveUrl: server.url,
            sha256: sha256(archiveContent),
          },
        },
        extractArchive: async (source, destination) => {
          expect(await fs.readFile(source)).toEqual(archiveContent);
          await fs.writeFile(path.join(destination, 'SKILL.md'), '# Redirected Skill\n');
        },
      });

      expect(result.status).toBe('installed');
      expect(await fs.readFile(path.join(result.installPath, 'SKILL.md'), 'utf8')).toContain('Redirected Skill');
    } finally {
      await server.close();
    }
  });

  it('follows an explicitly allowed GitHub-style cross-origin redirect and reapplies per-hop headers', async () => {
    const archiveContent = Buffer.from('allowed cross-origin archive');
    const servers = await createCrossOriginRedirectArchiveServers(archiveContent);
    const destination = path.join(tempDir, 'allowed-cross-origin.zip');
    const allowedOrigins = new Set([new URL(servers.sourceUrl).origin, new URL(servers.targetUrl).origin]);
    try {
      await downloadSkillArchive({
        archiveUrl: servers.sourceUrl,
        destination,
        timeoutMs: 5000,
        maxBytes: archiveContent.byteLength,
        assertOriginAllowed: (url) => {
          if (!allowedOrigins.has(url.origin)) {
            throw new Error(`unexpected origin: ${url.origin}`);
          }
        },
        getHeaders: (url) => ({
          'X-Archive-Origin': url.origin,
        }),
      });

      expect(await fs.readFile(destination)).toEqual(archiveContent);
      expect(servers.sourceRequests).toEqual([{ originHeader: new URL(servers.sourceUrl).origin }]);
      expect(servers.targetRequests).toEqual([{ originHeader: new URL(servers.targetUrl).origin }]);
      expect((await fs.readdir(tempDir)).filter((name) => name.endsWith('.partial'))).toEqual([]);
    } finally {
      await servers.close();
    }
  });

  it('rejects a generic cross-origin redirect before requesting its body and removes partial files', async () => {
    const archiveContent = Buffer.from('must not be downloaded');
    const servers = await createCrossOriginRedirectArchiveServers(archiveContent);
    const cacheRoot = path.join(tempDir, 'cross-origin-cache');
    try {
      await expect(
        syncNodeSkillVersion({
          nodeId: 'node-1',
          skillsRoot: path.join(tempDir, 'cross-origin-skills'),
          cacheRoot,
          skillVersion: {
            skillVersionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            versionLabel: 'v1',
            source: {
              type: 'zip',
              archiveUrl: servers.sourceUrl,
              sha256: sha256(archiveContent),
            },
          },
          extractArchive: async () => {
            throw new Error('rejected cross-origin download should not extract');
          },
        }),
      ).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.downloadOrigin);

      expect(servers.sourceRequests).toHaveLength(1);
      expect(servers.targetRequests).toHaveLength(0);
      expect(await fs.readdir(cacheRoot)).toEqual([]);
    } finally {
      await servers.close();
    }
  });

  it('destroys an in-flight archive download when synchronization is aborted', async () => {
    const server = await createStalledArchiveServer();
    const controller = new AbortController();
    try {
      const syncPromise = syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot: path.join(tempDir, 'skills'),
        cacheRoot: path.join(tempDir, 'cache'),
        skillVersion: {
          skillVersionId: '77777777-7777-4777-8777-777777777777',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archiveUrl: server.url,
            sha256: 'unused-while-download-is-stalled',
          },
        },
        signal: controller.signal,
        extractArchive: async () => {
          throw new Error('aborted download should not extract');
        },
      });
      const rejected = expect(syncPromise).rejects.toThrow('daemon stopping');

      await server.requestStarted;
      controller.abort(new Error('daemon stopping'));

      await rejected;
      await server.responseClosed;
      expect(await fs.readdir(path.join(tempDir, 'cache')).catch(() => [])).toEqual([]);
    } finally {
      controller.abort();
      await server.close();
    }
  });

  it.each([
    ['chunked response without Content-Length', false],
    ['redirected response', true],
  ])('stops an oversized %s and removes its partial download', async (_label, redirect) => {
    const server = await createChunkedOversizedArchiveServer(Buffer.alloc(129, 1), redirect);
    const destination = path.join(tempDir, redirect ? 'redirected.zip' : 'chunked.zip');
    try {
      await expect(
        downloadSkillArchive({
          archiveUrl: server.url,
          destination,
          timeoutMs: 5000,
          maxBytes: 64,
        }),
      ).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.downloadSize);
      await expect(fs.stat(destination)).rejects.toThrow();
      expect((await fs.readdir(tempDir)).filter((name) => name.endsWith('.partial'))).toEqual([]);
    } finally {
      await server.close();
    }
  });

  it('rejects central-directory limits before creating an extraction destination', async () => {
    const archivePath = path.join(tempDir, 'declared-large.zip');
    const destination = path.join(tempDir, 'must-not-extract');
    await fs.writeFile(
      archivePath,
      createSkillZipFixture([
        { name: 'SKILL.md', content: '# Declared Large\n' },
        {
          name: 'large.bin',
          content: 'x',
          compression: 'deflated',
          declaredCompressedSize: 1024 * 1024,
          declaredUncompressedSize: SKILL_ARCHIVE_LIMITS.maxEntryUncompressedBytes + 1,
        },
      ]),
    );

    await expect(extractSkillZipArchive(archivePath, destination)).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.entrySize);
    await expect(fs.stat(destination)).rejects.toThrow();
  });

  it('rejects an archive file beyond the total compressed limit without reading its sparse body', async () => {
    const archivePath = path.join(tempDir, 'oversized-sparse.zip');
    const destination = path.join(tempDir, 'oversized-destination');
    await fs.writeFile(archivePath, Buffer.alloc(0));
    await fs.truncate(archivePath, SKILL_ARCHIVE_LIMITS.maxTotalCompressedBytes + 1);

    await expect(extractSkillZipArchive(archivePath, destination)).rejects.toThrow(
      SKILL_ARCHIVE_ERROR_CODES.totalCompressedSize,
    );
    await expect(fs.stat(destination)).rejects.toThrow();
  });

  it('removes temporary install directories after rejecting an unsafe archive', async () => {
    const archiveContent = createSkillZipFixture([{ name: '../SKILL.md', content: '# Unsafe\n' }]);
    const archivePath = path.join(tempDir, 'unsafe.zip');
    const skillsRoot = path.join(tempDir, 'skills');
    await fs.writeFile(archivePath, archiveContent);

    await expect(
      syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot,
        skillVersion: {
          skillVersionId: '99999999-9999-4999-8999-999999999999',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archivePath,
            sha256: sha256(archiveContent),
          },
        },
      }),
    ).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
    expect(await fs.readdir(skillsRoot)).toEqual([]);
  });

  it('extracts archives without invoking system zipinfo or unzip executables', async () => {
    const archiveContent = createValidSkillZipFixture('# Node ZIP Skill\n');
    const archivePath = path.join(tempDir, 'skill.zip');
    await fs.writeFile(archivePath, archiveContent);
    const previousPath = process.env.PATH;
    process.env.PATH = '';
    try {
      const result = await syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot: path.join(tempDir, 'skills'),
        skillVersion: {
          skillVersionId: '88888888-8888-4888-8888-888888888888',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archivePath,
            sha256: sha256(archiveContent),
          },
        },
      });
      expect(await fs.readFile(path.join(result.installPath, 'SKILL.md'), 'utf8')).toContain('Node ZIP Skill');
    } finally {
      process.env.PATH = previousPath;
    }
  });

  it('sends node and claim capability headers only for trusted authenticated ZIP archive URLs', async () => {
    const archiveContent = Buffer.from('authenticated archive');
    const capabilityToken = 'ag_skill_SKILL_CAPABILITY_SECRET';
    const server = await createAuthenticatedArchiveServer(
      archiveContent,
      'Bearer ag_node_NODE_TOKEN_SECRET',
      capabilityToken,
    );
    try {
      await expect(
        syncNodeSkillVersion({
          nodeId: 'node-1',
          skillsRoot: path.join(tempDir, 'missing-auth-skills'),
          cacheRoot: path.join(tempDir, 'missing-auth-cache'),
          skillVersion: {
            skillVersionId: '55555555-5555-4555-8555-555555555555',
            versionLabel: 'v1',
            source: {
              type: 'zip',
              archiveUrl: server.url,
              auth: 'skill-capability',
              capabilityToken,
              runId: 'run-1',
              claimAttempt: 1,
              sha256: sha256(archiveContent),
            },
          },
          extractArchive: async () => {
            throw new Error('unauthorized download should not extract');
          },
        }),
      ).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedServer);
      expect(server.requests).toHaveLength(0);

      await expect(
        syncNodeSkillVersion({
          nodeId: 'node-1',
          skillsRoot: path.join(tempDir, 'foreign-auth-skills'),
          cacheRoot: path.join(tempDir, 'foreign-auth-cache'),
          skillVersion: {
            skillVersionId: '55555555-5555-4555-8555-555555555555',
            versionLabel: 'v1',
            source: {
              type: 'zip',
              archiveUrl: server.url,
              auth: 'skill-capability',
              capabilityToken,
              runId: 'run-1',
              claimAttempt: 1,
              sha256: sha256(archiveContent),
            },
          },
          trustedArchiveServerUrl: 'https://nocobase.example.test',
          downloadHeaders: {
            Authorization: 'Bearer ag_node_NODE_TOKEN_SECRET',
          },
          extractArchive: async () => {
            throw new Error('foreign authenticated download should not extract');
          },
        }),
      ).rejects.toThrow(SKILL_ARCHIVE_ERROR_CODES.downloadTrustedEndpoint);
      expect(server.requests).toHaveLength(0);

      const result = await syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot: path.join(tempDir, 'auth-skills'),
        cacheRoot: path.join(tempDir, 'auth-cache'),
        skillVersion: {
          skillVersionId: '55555555-5555-4555-8555-555555555555',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archiveUrl: server.url,
            auth: 'skill-capability',
            capabilityToken,
            runId: 'run-1',
            claimAttempt: 1,
            sha256: sha256(archiveContent),
          },
        },
        downloadHeaders: {
          Authorization: 'Bearer ag_node_NODE_TOKEN_SECRET',
        },
        trustedArchiveServerUrl: server.url,
        extractArchive: async (source, destination) => {
          expect(await fs.readFile(source)).toEqual(archiveContent);
          await fs.writeFile(path.join(destination, 'SKILL.md'), '# Authenticated Skill\n');
        },
      });

      expect(result.status).toBe('installed');
      expect(server.requests).toEqual([
        {
          authorization: 'Bearer ag_node_NODE_TOKEN_SECRET',
          capability: capabilityToken,
        },
      ]);
    } finally {
      await server.close();
    }
  });

  it('rejects extracted Skill archives containing symlinked SKILL.md files', async () => {
    const archiveContent = Buffer.from('fake archive');
    const archivePath = path.join(tempDir, 'symlink.zip');
    const outsideSkillFile = path.join(tempDir, 'outside-SKILL.md');
    await fs.writeFile(archivePath, archiveContent);
    await fs.writeFile(outsideSkillFile, '# Outside Skill\n');

    await expect(
      syncNodeSkillVersion({
        nodeId: 'node-1',
        skillsRoot: path.join(tempDir, 'skills'),
        skillVersion: {
          skillVersionId: '66666666-6666-4666-8666-666666666666',
          versionLabel: 'v1',
          source: {
            type: 'zip',
            archivePath,
            sha256: sha256(archiveContent),
          },
        },
        extractArchive: async (_source, destination) => {
          await fs.symlink(outsideSkillFile, path.join(destination, 'SKILL.md'));
        },
      }),
    ).rejects.toThrow(/symbolic links/);
  });
});
