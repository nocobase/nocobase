import type {
  ConcurrencyLogEvent,
  ConcurrencyReporter,
} from '../shared/types.js';

export function reportSafely(
  report: ConcurrencyReporter | undefined,
  event: ConcurrencyLogEvent,
): void {
  try {
    void Promise.resolve(report?.(event)).catch(() => {});
  } catch {
    // Diagnostics never change operation results.
  }
}
