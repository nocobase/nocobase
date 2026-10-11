// @vitest-environment node
import {
  loadTestDatabaseProvisioner,
  testDatabaseDialect,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from './harness.js';
import { toProjectsApiError } from '../server/kernel/http.js';
import { DomainError } from '../server/kernel/errors.js';

/** MySQL permits an existing repeatable-read snapshot to survive acquiring a row write lock. */
describe.skipIf(testDatabaseDialect() !== 'mysql')(
  'dependency graph with a MySQL repeatable-read snapshot',
  () => {
    let h: Harness;
    beforeEach(async () => {
      const provisioner = await loadTestDatabaseProvisioner(
        testDatabaseDialect(),
      );
      h = await createHarness({
        provisioner: {
          ...provisioner,
          async provision(options) {
            const provisioned = await provisioner.provision(options);
            return {
              ...provisioned,
              connection: {
                ...provisioned.connection,
                pool: {
                  ...provisioned.connection.pool,
                  // Applied after the driver's READ COMMITTED default, just as an application's pool hook is.
                  afterCreate(
                    connection: {
                      query(
                        sql: string,
                        callback: (error: Error | null) => void,
                      ): void;
                    },
                    done: (error: Error | null, connection: unknown) => void,
                  ) {
                    connection.query(
                      'SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ',
                      (error) => done(error, connection),
                    );
                  },
                },
              },
            };
          },
        },
      });
      await h.addUser('alice');
    });
    afterEach(() => h.close());

    it.each([false, true])(
      'rejects an old snapshot after a concurrent addition (create first: %s), rolling back its unit and events',
      async (createFirst) => {
        const viewer = h.viewer('alice');
        const a = await h.services.issues.create(viewer, { title: 'A' });
        const b = await h.services.issues.create(viewer, { title: 'B' });
        const c = await h.services.issues.create(viewer, { title: 'C' });
        const ab = await h.services.subtasks.addDependency(viewer, a.id, {
          dependsOnIssueId: b.id,
          type: 'relatedTo',
        });
        await h.services.subtasks.addDependency(viewer, b.id, {
          dependsOnIssueId: c.id,
        });
        const snapshotRead = Promise.withResolvers<void>();
        const added = Promise.withResolvers<void>();
        const events: string[] = [];
        let snapshotBlockers: unknown;
        const off = h.services.events.on('issue.changed', (event) => {
          events.push(event.issueId);
        });
        const pending = h.services.tx
          .unit(async (tx) => {
            const before = await h.services.issueQueries.detail(viewer, a.id);
            snapshotRead.resolve();
            await added.promise;
            // Reads really remain on the old snapshot, even though the other transaction has now committed C -> A.
            snapshotBlockers = (
              await h.services.issueQueries.detail(viewer, c.id)
            ).blockedBy;
            // A plan can create an unrelated issue before adding dependencies. Its counter update must not refresh
            // the graph revision while the graph itself still comes from the old snapshot.
            if (createFirst)
              await h.services.issues.create(viewer, {
                title: 'Also rolled back',
              });
            await h.services.issues.update(viewer, a.id, {
              revision: before.revision,
              title: 'Rolled back',
            });
            return h.services.tx.savepoint(tx, () =>
              h.services.subtasks.updateDependency(
                viewer,
                a.id,
                ab.dependencyId,
                { expectedType: 'relatedTo', type: 'blockedBy' },
              ),
            );
          })
          .catch((error: unknown) => error);
        await snapshotRead.promise;
        try {
          await h.services.subtasks.addDependency(viewer, c.id, {
            dependsOnIssueId: a.id,
          });
          events.length = 0;
        } finally {
          added.resolve();
        }
        const error: unknown = await pending;
        off();
        expect(snapshotBlockers).toEqual([]);
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toMatchObject({
          kind: 'conflict',
          code: 'DEPENDENCY_GRAPH_CHANGED',
        });
        expect(toProjectsApiError(error as DomainError).status).toBe('ABORTED');
        expect(events).toEqual([]);
        const detail = await h.services.issueQueries.detail(viewer, a.id);
        expect(detail.title).toBe('A');
        expect(detail.revision).toBe(a.revision);
        expect(detail.blockedBy).toEqual([]);
        expect(detail.relatedTo).toContainEqual(
          expect.objectContaining({ dependencyId: ab.dependencyId }),
        );
      },
    );
  },
);
