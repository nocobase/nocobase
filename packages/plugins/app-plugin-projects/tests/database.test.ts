// @vitest-environment node
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from './harness.js';

let harness: Harness | undefined;
afterEach(async () => {
  await harness?.close();
  harness = undefined;
});

describe('database', () => {
  it('creates the collections with their relations', async () => {
    harness = await createHarness();
    const collections = harness.database.connection().collections;
    const names = [
      'pmMembers',
      'pmSettings',
      'pmProjects',
      'pmProjectMembers',
      'pmProjectResources',
      'pmLabels',
      'pmIssues',
      'pmIssueLabels',
      'pmActivities',
      'pmWorkflows',
      'pmIssueChecklistItems',
      'pmApprovalRequests',
      'pmComments',
      'pmCommentReactions',
      'pmIssueSubscriptions',
      'pmIssueDependencies',
    ];
    const missing = [];
    for (const name of names)
      if (!(await collections.get(name))) missing.push(name);
    expect(missing).toEqual([]);
    const issues = await collections.get('pmIssues');
    expect(issues?.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['owner', 'project', 'parent', 'labels', 'stage']),
    );
  });

  it('seeds the settings row, and no workflow and no roles', async () => {
    harness = await createHarness();
    const query = harness.database.connection().query;
    expect(
      await query
        .selectFrom('pmSettings')
        .select(['issuePrefix', 'issueCounter'])
        .execute(),
    ).toEqual([{ issuePrefix: 'PM', issueCounter: 0 }]);
    // Projects use the built-in statuses until a workflow is the default; templates come from other plugins.
    expect(
      await query.selectFrom('pmWorkflows').select('id').execute(),
    ).toEqual([]);
    // Roles belong to the application that assembles the plugin (Acme seeds its own).
    const sets = await query
      .selectFrom('authorizationPermissionSets')
      .select('key')
      .execute();
    expect(
      sets.map((set) => set.key).filter((key) => key.startsWith('pm-')),
    ).toEqual([]);
  });

  it('stores any kind in the kind columns', async () => {
    harness = await createHarness();
    harness.services.kinds.add({
      key: 'bot',
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
      },
    });
    await harness.addUser('alice', 'Alice');
    const issue = await harness.services.issues.create(
      harness.viewer('alice'),
      { title: 'A', executor: { type: 'bot', id: 'b1' } },
    );
    expect(issue.executor).toEqual({ type: 'bot', id: 'b1' });
  });

  it('rolls its migrations back', async () => {
    harness = await createHarness();
    const { database } = harness;
    // This plugin's migrations are the last batch the harness applied.
    await database
      .createMigrator({
        directory: path.resolve(import.meta.dirname, '../database/migrations'),
        packageName: '@nocobase/app-plugin-projects',
      })
      .rollback();
    expect(
      await database.connection().collections.get('pmIssues'),
    ).toBeUndefined();
    expect(
      await database.connection().collections.get('pmMembers'),
    ).toBeUndefined();
  });
});
