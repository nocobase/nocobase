import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../helpers.js';
import {
  collectEvents,
  createEventsFixture,
  diffSnapshots,
  eventCollections,
  eventScenarios,
  rowKey,
  rowsOf,
  snapshotEventsFixture,
} from './fixture.js';

/**
 * The structural guarantee behind the recording points: with a keyed
 * subscription on every Collection, the rows a call reports are exactly the
 * rows whose stored state changed. Recording is spread over every write
 * statement of the execution adapter, so this is what catches a statement
 * that writes without recording.
 */
describeIntegrationDatabases(
  'Repository mutation events: recorded rows',
  (context) => {
    it.each(
      eventScenarios.map((scenario) => [scenario.name, scenario] as const),
    )('reports exactly the changed rows for %s', async (_name, scenario) => {
      await createEventsFixture(context);
      const seen = collectEvents();
      const off = context.connection.onRepositoryMutation(
        { collections: Object.keys(eventCollections) },
        seen.listeners,
      );
      try {
        const before = await snapshotEventsFixture(context.connection);
        await scenario.run(context.connection);
        const after = await snapshotEventsFixture(context.connection);

        expect(seen.inTransaction).toHaveLength(1);
        expect(seen.batches).toEqual([seen.inTransaction]);
        const recorded = new Map(
          rowsOf(seen.inTransaction).map((change) => [
            `${change.collection} ${rowKey(eventCollections[change.collection]!, change.key)}`,
            change,
          ]),
        );
        const problems: string[] = [];
        for (const difference of diffSnapshots(before, after)) {
          const id = `${difference.collection} ${difference.key}`;
          const change = recorded.get(id);
          recorded.delete(id);
          if (!change) {
            problems.push(`not reported: ${difference.kind} ${id}`);
          } else if (change.kind !== difference.kind) {
            problems.push(
              `${id}: reported ${change.kind}, was ${difference.kind}`,
            );
          } else {
            const missing = (difference.fields ?? []).filter(
              (field) => !change.fields?.includes(field),
            );
            if (missing.length > 0) {
              problems.push(`${id}: changed fields not reported: ${missing}`);
            }
          }
        }
        // `fields` lists what was written, so an update that left a row as
        // it was is legitimate; anything else reported must have changed.
        for (const [id, change] of recorded) {
          if (change.kind !== 'updated') {
            problems.push(`reported ${change.kind} ${id}, nothing changed`);
          }
        }
        expect(problems).toEqual([]);
      } finally {
        off();
      }
    });
  },
);
