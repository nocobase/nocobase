import { validateMigrations } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import { migrations } from '../helpers/database.js';

const COLLECTIONS = [
  'agentSessionComputers',
  'agentSessions',
  'agentSessionEvents',
  'agentSessionCommands',
  'agentSessionLinks',
];

describe('@nocobase/app-plugin-agent-sessions', () => {
  it('loads its migrations', async () => {
    await expect(
      validateMigrations(migrations[0]!.directory),
    ).resolves.toHaveLength(3);
  });
});

describeMigration('202610130001_agent_sessions_create', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('agentSessions').toHaveField('pendingPermissions', {
      nullable: false,
    });
    await expectCollection('agentSessions').toHaveField('state', {
      nullable: true,
    });
    await expectCollection('agentSessionLinks').toHaveField('decidedAt', {
      nullable: true,
    });
    await expectCollection('agentSessionEvents').toHaveField('data', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of COLLECTIONS) await expectCollection(name).not.toExist();
  },
});

describeMigration('202610140001_agent_sessions_told_work', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('agentSessions').toHaveField('toldWork', {
      nullable: true,
    });
    await expectCollection('agentSessions').toHaveField('locale', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agentSessions').not.toHaveField('toldWork');
    await expectCollection('agentSessions').not.toHaveField('locale');
  },
});

describeMigration('202610140002_agent_sessions_told_instructions', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('agentSessions').toHaveField('toldInstructions', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agentSessions').not.toHaveField('toldInstructions');
  },
});
