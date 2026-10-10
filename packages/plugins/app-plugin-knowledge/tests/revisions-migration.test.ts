// @vitest-environment node
/** The proposals learn what they replace and whether they stand for a document's version sent back. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-knowledge',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

describeMigration('202610080010_kb_proposals_add_revisions', {
  sources,
  up: async ({ expectCollection }) => {
    const proposals = expectCollection('kbProposals');
    await proposals.toHaveField('replacesId', { nullable: true });
    await proposals.toHaveField('origin', { nullable: true });
    await proposals.toHaveIndex(['replacesId']);
  },
  down: async ({ expectCollection }) => {
    const proposals = expectCollection('kbProposals');
    await proposals.toExist();
    await proposals.not.toHaveField('replacesId');
    await proposals.not.toHaveField('origin');
  },
});
