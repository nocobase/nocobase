import { validateMigrations } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { readdir } from 'node:fs/promises';

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
    const { directory } = migrations[0]!;
    const files = (await readdir(directory)).filter((file) =>
      file.endsWith('.ts'),
    );
    await expect(validateMigrations(directory)).resolves.toHaveLength(
      files.length,
    );
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

describeMigration('202610150001_agent_sessions_computer_keys', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    const computers = expectCollection('agentSessionComputers');
    await computers.toHaveField('keyHash', { nullable: true });
    await computers.toHaveField('bridgeStartedAt', { nullable: true });
    await computers.toHaveIndex(['keyHash'], { unique: true });
  },
  down: async ({ expectCollection }) => {
    const computers = expectCollection('agentSessionComputers');
    await computers.not.toHaveField('keyHash');
    await computers.not.toHaveField('bridgeStartedAt');
  },
});

describeMigration('202610150002_agent_sessions_images', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    const images = expectCollection('agentSessionImages');
    for (const field of ['disk', 'key', 'mimeType', 'sessionId', 'userId'])
      await images.toHaveField(field, { nullable: false });
    await images.toHaveIndex(['sessionId']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agentSessionImages').not.toExist();
  },
});

describeMigration('202610150003_agent_sessions_seen', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    const sessions = expectCollection('agentSessions');
    await sessions.toHaveField('seenSeq', { nullable: false });
    await sessions.toHaveField('noticedSeq', { nullable: true });
  },
  down: async ({ expectCollection }) => {
    const sessions = expectCollection('agentSessions');
    await sessions.not.toHaveField('seenSeq');
    await sessions.not.toHaveField('noticedSeq');
  },
});
