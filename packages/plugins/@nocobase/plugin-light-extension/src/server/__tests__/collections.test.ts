/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

import {
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
} from '../../constants';
import PluginLightExtensionServer from '../plugin';

describe('plugin-light-extension collections', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginLightExtensionServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('loads all phase-0 collections with the canonical lifecycle and health fields', async () => {
    expectCollectionFields('lightExtensionRepos', [
      'id',
      'vscRepoId',
      'name',
      'normalizedName',
      'lifecycleStatus',
      'healthStatus',
      'headCommitId',
      'lastScannedCommitId',
    ]);
    expectCollectionFields('lightExtensionEntries', [
      'id',
      'repoId',
      'target',
      'kind',
      'entryName',
      'entryPath',
      'settingsSchema',
      'activePublicationId',
      'healthStatus',
      'diagnostics',
    ]);
    expectCollectionFields('lightExtensionEntryPublications', [
      'id',
      'repoId',
      'entryId',
      'commitId',
      'artifact',
      'settingsSchemaSnapshot',
      'settingsDefaultsHash',
      'filesHash',
      'runtimeCodeHash',
      'diagnostics',
    ]);
    expectCollectionFields('lightExtensionReferences', [
      'id',
      'repoId',
      'entryId',
      'publicationId',
      'ownerKind',
      'ownerLocator',
      'ownerLocatorHash',
      'versionPolicy',
      'resolvedStatus',
    ]);
    expectCollectionFields('lightExtensionLogs', [
      'id',
      'repoId',
      'entryId',
      'publicationId',
      'level',
      'action',
      'result',
      'requestId',
      'rawResourceAction',
      'denyReason',
      'details',
    ]);

    expect(LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES).toEqual(['enabled', 'disabled', 'archived']);
    expect(LIGHT_EXTENSION_REPO_HEALTH_STATUSES).toEqual(['draft', 'ready', 'partial_failed', 'scan_failed']);
    expect(LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES).toEqual(['ready', 'failed', 'missing']);
    expect(LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES).toEqual([
      'active',
      'repo_disabled',
      'repo_archived',
      'entry_missing',
      'publication_missing',
      'owner_missing',
      'settings_invalid',
      'no_active_publication',
    ]);
  });

  it('persists default statuses without using enabled plus archived booleans', async () => {
    const repo = await app.db.getRepository('lightExtensionRepos').create({
      values: {
        vscRepoId: 'vscr_light_repo_1',
        name: 'demo',
        normalizedName: 'demo',
      },
    });
    const entry = await app.db.getRepository('lightExtensionEntries').create({
      values: {
        repoId: repo.get('id'),
        kind: 'jsBlock',
        entryName: 'main',
        entryPath: 'src/client/index.tsx',
      },
    });

    expect(repo.get('lifecycleStatus')).toBe('enabled');
    expect(repo.get('healthStatus')).toBe('draft');
    expect(repo.get('enabled')).toBeUndefined();
    expect(repo.get('archived')).toBeUndefined();
    expect(entry.get('target')).toBe('client');
    expect(entry.get('healthStatus')).toBe('missing');
  });

  it('stores every derived reference resolvedStatus used by runtime/status APIs', async () => {
    for (const resolvedStatus of LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES) {
      const reference = await app.db.getRepository('lightExtensionReferences').create({
        values: {
          repoId: `repo_${resolvedStatus}`,
          entryId: `entry_${resolvedStatus}`,
          publicationId: `publication_${resolvedStatus}`,
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            flowModelId: `flow_${resolvedStatus}`,
            stepId: 'step_1',
            surface: 'js-block',
            bindingPath: 'props.sourceBinding',
          },
          ownerLocatorHash: `owner_${resolvedStatus}`,
          versionPolicy: 'pinned',
          resolvedStatus,
        },
      });

      expect(reference.get('resolvedStatus')).toBe(resolvedStatus);
    }
  });

  function expectCollectionFields(collectionName: string, fieldNames: string[]) {
    const collection = app.db.getCollection(collectionName) as Collection | undefined;
    expect(collection).toBeTruthy();
    for (const fieldName of fieldNames) {
      expect(collection?.getField(fieldName), `${collectionName}.${fieldName}`).toBeTruthy();
    }
  }
});
