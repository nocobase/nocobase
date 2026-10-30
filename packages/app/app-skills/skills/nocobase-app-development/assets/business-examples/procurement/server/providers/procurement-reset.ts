import type { DatabaseConnection } from '@nocobase/db';

/** Local test-data maintenance; preserve Users, permission assignments and reference dictionaries. */
export async function resetProcurement(
  connection: DatabaseConnection,
  dryRun: boolean,
) {
  return connection.transaction(async (tx) => {
    const requests = await tx.repository('procurementRequests').count();
    const lines = await tx.repository('procurementLines').count();
    if (!dryRun) {
      await tx
        .repository('lifecycleExampleEffectRuns')
        .deleteMany({ filter: { lifecycle: 'procurement' } });
      await tx
        .repository('lifecycleExampleTransitions')
        .deleteMany({ filter: { lifecycle: 'procurement' } });
      await tx.query.deleteFrom('procurementLines').allowAllRows().execute();
      await tx.query.deleteFrom('procurementRequests').allowAllRows().execute();
    }
    return { requests, lines, dryRun };
  });
}
