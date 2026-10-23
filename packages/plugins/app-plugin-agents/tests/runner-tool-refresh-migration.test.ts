// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

describeMigration('202610290002_ag_add_runner_tool_refresh', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('agConversations').toHaveField('showInChatList', {
      type: 'boolean',
      nullable: false,
    });
    await expectCollection('agRunners').toHaveField('enabledTools', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunners').toHaveField('quotaRevision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('agRunEvents').toHaveIndex(['runId', 'type', 'seq']);
    await expectCollection('agRuns').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('agRuns').not.toHaveIndex([
      'directoryKey',
      'status',
    ]);
    await expectCollection('agRunners').toHaveField('toolsRefreshRequestId', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agConversations').toHaveField('showInChatList', {
      type: 'boolean',
      nullable: false,
    });
    await expectCollection('agRunners').toHaveField('enabledTools', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunners').toHaveField('quotaRevision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('agRunEvents').toHaveIndex(['runId', 'type', 'seq']);
    await expectCollection('agRuns').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('agRuns').not.toHaveIndex([
      'directoryKey',
      'status',
    ]);
    await expectCollection('agRunners').not.toHaveField(
      'toolsRefreshRequestId',
    );
  },
});
