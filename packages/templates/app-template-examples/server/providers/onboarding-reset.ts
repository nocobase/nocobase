import type { DatabaseConnection } from '@nocobase/db';

/** Preserve Users, role assignments, dictionaries and other examples. */
export async function resetOnboarding(
  connection: DatabaseConnection,
  dryRun: boolean,
) {
  return connection.transaction(async (tx) => {
    const cases = await tx.repository('onboardingCases').count();
    const documents = await tx.repository('onboardingDocuments').count();
    const employees = await tx.repository('onboardingEmployees').count();
    if (!dryRun) {
      await tx
        .repository('lifecycleExampleEffectRuns')
        .deleteMany({ filter: { lifecycle: 'onboarding' } });
      await tx
        .repository('lifecycleExampleTransitions')
        .deleteMany({ filter: { lifecycle: 'onboarding' } });
      for (const collection of [
        'onboardingEmployees',
        'onboardingDocuments',
        'onboardingCases',
      ])
        await tx.query.deleteFrom(collection).allowAllRows().execute();
    }
    return { cases, documents, employees, dryRun };
  });
}
