import type {
  FoundationCapability,
  FoundationMetric,
  FoundationPart,
  FoundationFact,
} from '../shared/foundation.js';

interface Observation<T> {
  readonly value: T;
  readonly at: string;
}

interface History {
  status?: Observation<FoundationCapability['status']>;
  readonly metrics: Map<string, Observation<FoundationMetric>>;
  readonly parts: Map<string, Observation<FoundationPart>>;
  fileCollections?: Observation<FoundationFact>;
}

/** Bounded by the current collectors and their metrics; owned by one application service, never persisted. */
export class ReliableHistory {
  private readonly entries = new Map<string, History>();

  public clear(): void {
    this.entries.clear();
  }

  public retain(
    current: FoundationCapability,
    at: string,
  ): FoundationCapability {
    let history = this.entries.get(current.key);
    if (!history) {
      history = { metrics: new Map(), parts: new Map() };
      this.entries.set(current.key, history);
    }
    const result = { ...current };
    const activeParts = [...history.parts.values()].filter(
      (entry) =>
        history.status?.value === 'active' &&
        entry.value.status === 'active' &&
        // Stored Agent definitions do not establish a configured execution path.
        !(current.key === 'aiAgents' && entry.value.key === 'agents'),
    );
    const statusAt =
      history.parts.size > 0
        ? activeParts
            .filter(
              (entry) =>
                current.completeness === 'failed' ||
                current.parts.some(
                  (part) =>
                    part.key === entry.value.key && part.status === null,
                ),
            )
            .map((entry) => entry.at)
            .sort()
            .at(-1)
        : history.status?.value === 'active'
          ? history.status.at
          : undefined;
    if (current.status !== null) history.status = { value: current.status, at };
    // Negative conclusions require current evidence. An earlier active state is explicitly marked historical.
    else if (statusAt) {
      result.status = 'active';
      result.checkedAt = statusAt;
    }
    const metrics = [
      ...current.metrics,
      ...(current.completeness === 'failed' ||
      current.issues.some((issue) => issue.code === 'COLLECTOR_TIMEOUT')
        ? [...history.metrics.values()]
            .filter(
              (entry) =>
                !current.metrics.some(
                  (metric) => metric.key === entry.value.key,
                ),
            )
            .map((entry) => ({
              ...entry.value,
              value: null,
              complete: false,
            }))
        : []),
    ];
    result.metrics = metrics.map((metric) => {
      // Explicit business row counts already have their own retention and original timestamp.
      if (current.key === 'dataModeling' && metric.key === 'businessRecords')
        return metric;
      if (metric.complete && metric.value !== null) {
        history.metrics.set(metric.key, { value: metric, at });
        return metric;
      }
      const previous = history.metrics.get(metric.key);
      return previous ? { ...previous.value, checkedAt: previous.at } : metric;
    });
    const parts =
      current.completeness === 'failed'
        ? [...history.parts.values()].map((entry) => ({
            key: entry.value.key,
            status: null,
          }))
        : current.parts;
    result.parts = parts.map((part) => {
      if (part.status !== null) {
        history.parts.set(part.key, { value: part, at });
        return part;
      }
      const previous = history.parts.get(part.key);
      return previous?.value.status === 'active'
        ? { ...previous.value, checkedAt: previous.at }
        : part;
    });
    if (current.key === 'files') {
      const discovered = current.metrics.find(
        (metric) => metric.key === 'fileCollections',
      );
      if (discovered?.complete) {
        const fact = current.facts.find(
          (fact) => fact.code === 'fileCollections',
        );
        history.fileCollections = fact ? { value: fact, at } : undefined;
      } else if (history.fileCollections) {
        result.facts = [
          {
            ...history.fileCollections.value,
            checkedAt: history.fileCollections.at,
          },
        ];
      }
    }
    return result;
  }
}
