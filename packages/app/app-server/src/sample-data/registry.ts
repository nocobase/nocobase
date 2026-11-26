import {
  sampleDataRecordName,
  type SampleDataLedger,
  type SampleDataRegistration,
  type SampleDataRunResult,
  type SampleDataService,
} from './token.js';

/** Creates the service behind `sampleDataToken`. */
export function createSampleDataService(): SampleDataService {
  const registrations = new Map<string, SampleDataRegistration>();
  let state: { ledger: SampleDataLedger; enabled: boolean } | undefined;
  let rerun = false;

  return {
    register(registration: SampleDataRegistration): void {
      if (registrations.has(registration.name)) {
        throw new Error(
          `Sample data "${registration.name}" is already registered.`,
        );
      }
      registrations.set(registration.name, registration);
    },

    registrations(): readonly SampleDataRegistration[] {
      return [...registrations.values()];
    },

    prepare(next: { ledger: SampleDataLedger; enabled: boolean }): void {
      state = { ledger: next.ledger, enabled: next.enabled };
    },

    rerunSkipped(): void {
      rerun = true;
    },

    async run(): Promise<SampleDataRunResult> {
      const executed: string[] = [];
      const skipped: string[] = [];
      const failed: { name: string; error: unknown }[] = [];
      if (!state || registrations.size === 0)
        return { executed, skipped, failed };
      const { ledger, enabled } = state;
      const shouldRun = enabled || rerun;
      rerun = false;
      const recorded = new Map(
        (await ledger.history()).map((record) => [record.name, record.status]),
      );
      for (const registration of registrations.values()) {
        const name = sampleDataRecordName(registration.name);
        if (recorded.get(name) === 'executed') continue;
        if (!shouldRun) {
          skipped.push(registration.name);
          continue;
        }
        const startedAt = Date.now();
        try {
          await registration.run();
        } catch (error) {
          failed.push({ name: registration.name, error });
          continue;
        }
        await ledger.record({
          packageName: registration.packageName,
          name,
          status: 'executed',
          durationMs: Date.now() - startedAt,
        });
        executed.push(registration.name);
      }
      return { executed, skipped, failed };
    },
  };
}
