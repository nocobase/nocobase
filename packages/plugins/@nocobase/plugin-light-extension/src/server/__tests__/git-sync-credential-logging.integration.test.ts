/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { computeRemoteSnapshotContentHash, RemoteSyncAdapterRegistry, type VscRemoteSnapshot } from '../vsc-file';
import PluginVscFileServer from '../vsc-file';
import type { AuditLog } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import PluginLightExtensionServer from '../plugin';
import { gitSyncRemoteConfig, validGitSyncFiles } from './helpers/gitSyncAcceptance';

describe('light extension Git credential logging integration', () => {
  it('keeps rejected credentials and raw provider failures out of every logging surface', async () => {
    const app = await createApp();
    const requestLogs: unknown[] = [];
    const auditLogs: AuditLog[] = [];
    try {
      vi.spyOn(app.requestLogger, 'info').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      vi.spyOn(app.requestLogger, 'warn').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      vi.spyOn(app.requestLogger, 'error').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      app.auditManager.setLogger({
        log: async (auditLog) => {
          auditLogs.push(auditLog);
        },
      });

      const adapter = getGitHubAdapter(app);
      const baseSnapshot = createSnapshot('remote-base', 'Base');
      const nextSnapshot = createSnapshot('remote-next', 'Remote next');
      vi.spyOn(adapter, 'probe').mockResolvedValue({ revision: baseSnapshot.revision, metadata: { branch: 'main' } });
      const fetchSnapshot = vi.spyOn(adapter, 'fetchSnapshot').mockResolvedValue(baseSnapshot);

      const user = await app.db.getRepository('users').findOne();
      const agent = await app.agent().login(user);
      const createResponse = await agent.post('/lightExtensionSync:createFromGit').send({
        provider: 'github',
        config: gitSyncRemoteConfig,
        name: 'Credential logging integration',
      });
      expect(createResponse.status).toBe(200);
      const repoId = requireString(toRecord(responseData(createResponse.body).repo).id, 'repo id');

      fetchSnapshot.mockResolvedValue(nextSnapshot);
      const planResponse = await agent.post('/lightExtensionSync:plan').send({ repoId });
      expect(planResponse.status).toBe(200);
      const plan = toRecord(responseData(planResponse.body).plan);
      const local = toRecord(plan.local);
      const remote = toRecord(plan.remote);
      expect(plan).toMatchObject({ state: 'remote-ahead', action: 'pull' });
      const restrictedAgent = await createRestrictedAgent(app);

      requestLogs.length = 0;
      auditLogs.length = 0;
      const token = 'github_pat_cross_layer_012345678901234567890123456789';
      const authorization = `Bearer ${token}`;
      const requestValues = { repoId, provider: 'github', config: gitSyncRemoteConfig };
      const bodyResponse = await agent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-body-rejected')
        .send({ ...requestValues, authRef: token });
      const queryResponse = await restrictedAgent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-query-rejected')
        .query({ authRef: token })
        .send(requestValues);
      const headerResponse = await agent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-header-rejected')
        .set('x-git-credential', authorization)
        .send(requestValues);

      expect(bodyResponse.status).toBe(400);
      expect(queryResponse.status).toBe(403);
      expect(headerResponse.status).toBe(400);

      const rawProviderError = Object.assign(new Error(`provider raw failure: ${authorization}`), {
        cause: new Error(token),
        config: { headers: { Authorization: authorization } },
        request: { body: token },
        response: { data: { token } },
      });
      fetchSnapshot.mockRejectedValueOnce(rawProviderError);
      app.auditManager.registerAction('lightExtensionSync:pull');
      const pullResponse = await agent
        .post('/lightExtensionSync:pull')
        .set('x-request-id', 'provider-error-rejected')
        .send({
          repoId,
          expectedHeadCommitId: local.headCommitId ?? null,
          expectedRemoteRevision: remote.revision ?? null,
          expectedRemoteTargetVersion: plan.remoteTargetVersion,
          planFingerprint: plan.fingerprint,
        });

      expect(pullResponse.status).toBe(502);
      expect(pullResponse.body).toMatchObject({
        errors: [{ code: 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE' }],
      });
      expect(requestLogs).toHaveLength(8);
      expect(requestLogs.filter((entry) => toRecord(entry).message?.toString().startsWith('request '))).toHaveLength(4);
      expect(auditLogs).toHaveLength(4);
      expect(auditLogs.find((log) => log.action === 'pull')).toMatchObject({
        resource: 'lightExtensionSync',
        action: 'pull',
        status: 502,
      });

      const persistedLogs = await app.db.getRepository('lightExtensionLogs').find({
        filter: { action: 'syncPull', result: 'blocked' },
      });
      expect(persistedLogs).toHaveLength(1);
      expect(persistedLogs[0]).toMatchObject({
        requestId: 'provider-error-rejected',
        reasonCode: 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
      });

      const serialized = JSON.stringify({
        responses: [bodyResponse.body, queryResponse.body, headerResponse.body, pullResponse.body],
        requestLogs,
        auditLogs,
        persistedLogs: persistedLogs.map((log) => log.toJSON()),
      });
      expect(serialized).toContain('[REDACTED]');
      expect(serialized).not.toContain(token);
      expect(serialized).not.toContain(authorization);
      expect(serialized).not.toContain('provider raw failure');
      expect(serialized).not.toMatch(/"cause"|"Authorization"/u);
    } finally {
      vi.restoreAllMocks();
      await app.destroy();
    }
  });
});

type VscPluginInternals = {
  remoteAdapters: RemoteSyncAdapterRegistry;
};

async function createApp(): Promise<MockServer> {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'field-sort',
      'users',
      'auth',
      'acl',
      'data-source-manager',
      'system-settings',
      PluginVscFileServer,
      PluginLightExtensionServer,
    ],
  });
}

function getGitHubAdapter(app: MockServer) {
  const plugin = app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  const registry = (plugin as unknown as VscPluginInternals).remoteAdapters;
  const adapter = registry.get('github');
  if (!adapter) {
    throw new Error('Expected the GitHub remote adapter');
  }
  return adapter;
}

async function createRestrictedAgent(app: MockServer) {
  const roleName = 'credentialLoggingRestricted';
  app.acl.define({
    role: roleName,
    strategy: {
      actions: false,
      allowConfigure: false,
    },
  });
  await app.db.getRepository('roles').create({ values: { name: roleName, allowConfigure: false } });
  const user = await app.db.getRepository('users').create({
    values: { nickname: roleName, roles: [roleName] },
  });
  return (await app.agent().login(user)).set('x-role', roleName);
}

function createSnapshot(revision: string, label: string): VscRemoteSnapshot {
  const files = validGitSyncFiles(label);
  return {
    revision,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: { branch: 'main' },
  };
}

function responseData(body: unknown): Record<string, unknown> {
  const record = toRecord(body);
  return isRecord(record.data) ? record.data : record;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Expected ${label}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
