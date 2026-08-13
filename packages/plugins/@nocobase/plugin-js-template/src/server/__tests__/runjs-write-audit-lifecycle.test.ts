/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';

import { registerJsTemplateRunJSWriteAuditActions } from '../runJSWriteAuditLifecycle';

type AuditAction = {
  name: string;
  getMetaData?: (ctx: Context) => Promise<Record<string, unknown>>;
};

function createAuditManager() {
  const resources = new Map<string, Map<string, unknown>>();
  return {
    resources,
    registerAction(action: AuditAction) {
      const [resourceName, actionName] = action.name.split(':');
      const resource = resources.get(resourceName) || new Map<string, unknown>();
      resources.set(resourceName, resource);
      resource.set(actionName, action);
    },
  };
}

describe('JS Template raw-write audit lifecycle', () => {
  it('restores the previous action only while the plugin still owns the registration', () => {
    const auditManager = createAuditManager();
    const previous = { name: 'vscFile:push', owner: 'previous' };
    auditManager.registerAction(previous);

    const unregister = registerJsTemplateRunJSWriteAuditActions(auditManager, {} as Database);
    const owned = auditManager.resources.get('vscFile')?.get('push');
    expect(owned).not.toBe(previous);

    unregister();
    expect(auditManager.resources.get('vscFile')?.get('push')).toBe(previous);

    const unregisterSecond = registerJsTemplateRunJSWriteAuditActions(auditManager, {} as Database);
    const later = { name: 'vscFile:push', owner: 'later' };
    auditManager.registerAction(later);
    unregisterSecond();
    expect(auditManager.resources.get('vscFile')?.get('push')).toBe(later);
  });

  it('keeps only safe locator, count, size and hash metadata', async () => {
    const auditManager = createAuditManager();
    registerJsTemplateRunJSWriteAuditActions(auditManager, {
      getRepository: () => ({ findOne: async () => null }),
    } as unknown as Database);
    const action = auditManager.resources.get('runJSSources')?.get('saveChanges') as AuditAction;
    const source = 'ctx.render("credential secret");';
    const metadata = await action.getMetaData?.({
      action: {
        actionName: 'saveChanges',
        params: {
          values: {
            locator: {
              kind: 'flowModel.step',
              modelUid: 'fm_safe',
              flowKey: 'settings',
              stepKey: 'runjs',
              paramPath: ['code'],
            },
            repoId: 'repo_safe',
            message: 'sensitive commit message',
            credentials: 'credential value',
            changes: [
              {
                path: '/secret/source.ts',
                operation: 'upsert',
                content: source,
              },
            ],
          },
        },
      },
      body: {
        data: {
          locatorKind: 'flowModel.step',
          repository: { id: 'repo_safe', ownerType: 'runjs-source', ownerId: 'owner_safe' },
          commit: { id: 'commit_safe', repoId: 'repo_safe' },
          artifact: {
            entryPath: '/secret/source.ts',
            filesHash: 'a'.repeat(64),
            runtimeCodeHash: 'b'.repeat(64),
            code: 'compiled secret',
            sourceMap: 'source map secret',
            diagnostics: [{ message: 'stderr secret' }],
          },
        },
      },
    } as unknown as Context);

    expect(metadata).toMatchObject({
      resource: 'runJSSources',
      action: 'saveChanges',
      locatorKind: 'flowModel.step',
      ownerId: 'fm_safe',
      repoId: 'repo_safe',
      commitId: 'commit_safe',
      request: {
        params: {},
        query: {},
        headers: {},
        body: {
          locatorKind: 'flowModel.step',
          repoId: 'repo_safe',
          totalSize: Buffer.byteLength(source, 'utf8'),
          contentHashes: [expect.stringMatching(/^[a-f0-9]{64}$/u)],
        },
      },
      response: {
        body: {
          repository: { id: 'repo_safe', ownerType: 'runjs-source', ownerId: 'owner_safe' },
          commit: { id: 'commit_safe', repoId: 'repo_safe' },
          artifact: { filesHash: 'a'.repeat(64), runtimeCodeHash: 'b'.repeat(64), diagnosticsCount: 1 },
        },
      },
    });
    const serialized = JSON.stringify(metadata);
    for (const forbidden of [
      '/secret/source.ts',
      'credential secret',
      'sensitive commit message',
      'credential value',
      'compiled secret',
      'source map secret',
      'stderr secret',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
