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

async function createAuthenticatedArchiveServer(content: Buffer, expectedAuthorization: string) {
  const requests: string[] = [];
  const server = http.createServer((request, response) => {
    requests.push(request.headers.authorization || '');
    if (request.headers.authorization !== expectedAuthorization) {
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
    url: `http://127.0.0.1:${address.port}/api/agent-gateway/skill-versions/55555555-5555-4555-8555-555555555555/archive:download`,
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
    });
    expect(installPayloads[1]).toMatchObject({
      nodeId: 'node-1',
      skillVersionId: skillVersion.skillVersionId,
      status: 'installed',
    });
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

  it('sends node-token download headers only for trusted authenticated ZIP archive URLs', async () => {
    const archiveContent = Buffer.from('authenticated archive');
    const server = await createAuthenticatedArchiveServer(archiveContent, 'Bearer ag_node_NODE_TOKEN_SECRET');
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
              auth: 'node-token',
              sha256: sha256(archiveContent),
            },
          },
          extractArchive: async () => {
            throw new Error('unauthorized download should not extract');
          },
        }),
      ).rejects.toThrow(/trusted server URL/);
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
              auth: 'node-token',
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
      ).rejects.toThrow(/configured NocoBase archive endpoint/);
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
            auth: 'node-token',
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
      expect(server.requests).toEqual(['Bearer ag_node_NODE_TOKEN_SECRET']);
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
