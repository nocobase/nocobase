// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import {
  decideOwnerHandoff,
  ownerHandoffRejectionRecipients,
  ownerHandoffWaiting,
  readOwnerHandoff,
  recordOwnerHandoff,
} from '../../server/issues/owner-handoff.js';

describeMigration('202610240040_studio_issue_owner_handoffs', {
  sources: [
    {
      packageName: 'projects-issues-fixture',
      directory: path.resolve(
        import.meta.dirname,
        '../fixtures/projects-issues',
      ),
    },
    {
      packageName: '@nocobase/studio',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioIssueOwnerHandoffs').toHaveField('waiting');
    await expectCollection('studioIssueOwnerHandoffs').toHaveField(
      'notificationKey',
    );
    const issue = { id: 'handoff', ownerUserId: 'bob' };
    expect(await readOwnerHandoff(connection, issue.id)).toBeNull();
    expect(await ownerHandoffWaiting(connection, issue)).toBe(false);
    const transfer = {
      issueId: issue.id,
      ownerUserId: 'bob',
      previousOwnerUserId: 'alice',
      transferredByUserId: 'carol',
      authenticatedPersonUserId: 'carol',
    };
    const first = await recordOwnerHandoff(connection, transfer);
    expect(await ownerHandoffWaiting(connection, issue)).toBe(true);
    expect(await readOwnerHandoff(connection, issue.id)).toMatchObject(first);

    // A run acting for Bob cannot make Bob's decision, and Alice cannot decide for Bob.
    for (const authenticatedPersonUserId of [null, 'alice']) {
      await expect(
        decideOwnerHandoff(connection, {
          issue,
          authenticatedPersonUserId,
          notificationKey: first.notificationKey,
          decision: 'accept',
        }),
      ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_HANDOFF_REQUIRED' });
    }
    const rejected = await decideOwnerHandoff(connection, {
      issue,
      authenticatedPersonUserId: 'bob',
      notificationKey: first.notificationKey,
      decision: 'reject',
    });
    expect(rejected.waiting).toBe(true);
    expect(rejected.ownerUserId).toBe('bob');
    expect(rejected.rejectedAt).not.toBeNull();
    expect(ownerHandoffRejectionRecipients(rejected)).toEqual([
      'alice',
      'carol',
    ]);
    expect(
      ownerHandoffRejectionRecipients({
        ...rejected,
        transferredByUserId: 'alice',
      }),
    ).toEqual(['alice']);
    await expect(
      decideOwnerHandoff(connection, {
        issue,
        authenticatedPersonUserId: 'bob',
        notificationKey: first.notificationKey,
        decision: 'accept',
      }),
    ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_HANDOFF_STALE' });

    // The current owner and current notice are checked independently: even an ABA transfer cannot reuse the old notice.
    await recordOwnerHandoff(connection, { ...transfer, ownerUserId: 'dave' });
    const latest = await recordOwnerHandoff(connection, transfer);
    expect(latest.notificationKey).not.toBe(first.notificationKey);
    await expect(
      decideOwnerHandoff(connection, {
        issue,
        authenticatedPersonUserId: 'bob',
        notificationKey: first.notificationKey,
        decision: 'accept',
      }),
    ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_HANDOFF_STALE' });
    await expect(
      decideOwnerHandoff(connection, {
        issue: { ...issue, ownerUserId: 'dave' },
        authenticatedPersonUserId: 'dave',
        notificationKey: latest.notificationKey,
        decision: 'accept',
      }),
    ).rejects.toMatchObject({ reason: 'ISSUE_OWNER_HANDOFF_STALE' });
    const accepted = await decideOwnerHandoff(connection, {
      issue,
      authenticatedPersonUserId: 'bob',
      notificationKey: latest.notificationKey,
      decision: 'accept',
    });
    expect(accepted.waiting).toBe(false);
    expect(await ownerHandoffWaiting(connection, issue)).toBe(false);
    expect(
      await ownerHandoffWaiting(connection, { ...issue, ownerUserId: 'dave' }),
    ).toBe(true);

    const claimed = await recordOwnerHandoff(connection, {
      ...transfer,
      authenticatedPersonUserId: 'bob',
      transferredByUserId: 'bob',
    });
    expect(claimed.waiting).toBe(false);
    // Agent and automatic assignment still need confirmation, even when the mapped user is the new owner.
    expect(
      (
        await recordOwnerHandoff(connection, {
          ...transfer,
          transferredByUserId: 'bob',
          authenticatedPersonUserId: null,
        })
      ).waiting,
    ).toBe(true);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioIssueOwnerHandoffs').not.toExist();
  },
});
