import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { databaseManagerToken } from '@nocobase/db';
import type { ServiceContainer } from '@nocobase/service-provider';

import type {
  FoundationCapability,
  FoundationIssue,
  FoundationOverview,
  FoundationPackage,
} from '../../shared/foundation.js';
import { availableCapabilities } from '../../shared/available-capabilities.js';
import {
  CAPABILITY_COLLECTORS,
  type CapabilityCollector,
  type CollectorContext,
} from '../capabilities/index.js';
import { Inventory, Probe } from '../inventory.js';
import { InstalledPackages } from '../packages.js';
import { collectModuleSources } from '../module-sources.js';
import {
  collectProviderInventory,
  type RuntimeProviderEvidence,
} from '../provider-inventory.js';
import type {
  FoundationOverviewOptions,
  FoundationService,
} from '../tokens.js';

export interface FoundationServiceOptions {
  readonly container: ServiceContainer;
  readonly config: Pick<AppConfigAccessor, 'get'>;
  /** The application's root, where its `package.json` and `node_modules` are. */
  readonly rootDir: string;
  readonly hasClient: boolean;
  readonly runtimeProviders?: () => readonly RuntimeProviderEvidence[];
  readonly serverRegistrationsComplete?: () => boolean;
  /** How long a result is answered again before it is collected anew. Defaults to 30 seconds. */
  readonly cacheTtlMs?: number;
  /** How long one capability may take before it is reported as timed out. Defaults to 10 seconds. */
  readonly collectorTimeoutMs?: number;
  readonly collectors?: readonly CapabilityCollector[];
  readonly now?: () => number;
}

/** Capabilities that read nothing from the database. */
const DATABASE_FREE: ReadonlySet<string> = new Set(['interface', 'audit']);

/** How many capabilities read the database at once. */
const CONCURRENCY = 4;

export class DefaultFoundationService implements FoundationService {
  private cached?: {
    readonly at: number;
    readonly overview: FoundationOverview;
  };
  private pending?: Promise<FoundationOverview>;
  private readonly packages: InstalledPackages;
  private readonly cacheTtlMs: number;
  private readonly collectorTimeoutMs: number;
  private readonly collectors: readonly CapabilityCollector[];
  private readonly now: () => number;

  public constructor(private readonly options: FoundationServiceOptions) {
    this.packages = new InstalledPackages(options.rootDir);
    this.cacheTtlMs = options.cacheTtlMs ?? 30_000;
    this.collectorTimeoutMs = options.collectorTimeoutMs ?? 10_000;
    this.collectors = options.collectors ?? CAPABILITY_COLLECTORS;
    this.now = options.now ?? Date.now;
  }

  public async overview(
    options: FoundationOverviewOptions = {},
  ): Promise<FoundationOverview> {
    if (
      !options.refresh &&
      this.cached &&
      this.now() - this.cached.at < this.cacheTtlMs
    )
      return this.cached.overview;
    // Concurrent requests share one collection rather than each scanning every table.
    this.pending ??= this.collect().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async collect(): Promise<FoundationOverview> {
    const started = this.now();
    const { container } = this.options;
    const database = container.has(databaseManagerToken)
      ? container.resolve(databaseManagerToken)
      : undefined;
    let inventory: Inventory | undefined;
    let databaseUnreadable = false;
    if (database) {
      try {
        inventory = await Inventory.read(database);
      } catch {
        databaseUnreadable = true;
      }
    }
    const applicationName = await this.packages.applicationName();
    const capabilities = await mapWithConcurrency(
      this.collectors,
      CONCURRENCY,
      (collector) =>
        databaseUnreadable && !DATABASE_FREE.has(collector.key)
          ? Promise.resolve(
              failed(collector, [
                { code: 'SOURCE_UNREADABLE', source: 'database' },
              ]),
            )
          : this.run(collector, {
              probe: inventory ? new Probe(inventory) : undefined,
              container,
              config: this.options.config,
              applicationName,
              hasClient: this.options.hasClient,
            }),
    );
    const inventoryOfProviders = await collectProviderInventory(
      this.options.rootDir,
      this.options.runtimeProviders?.(),
      this.options.serverRegistrationsComplete?.(),
    );
    // An unclassified runtime extension may own Collections absent from our ownership catalog. Its rows must not be
    // presented as an exact business-only count until ownership is known.
    if (
      inventoryOfProviders.entries.some(
        (entry) =>
          entry.categories.length === 0 &&
          entry.origin === 'unverified' &&
          entry.registration === 'observed',
      )
    ) {
      const index = capabilities.findIndex(
        (entry) => entry.key === 'dataModeling',
      );
      const data = capabilities[index];
      if (data && data.completeness !== 'failed')
        capabilities[index] = {
          ...data,
          completeness: 'partial',
          facts: [{ code: 'collectionOwnershipUnknown' }],
          metrics: data.metrics.map((metric) => ({
            ...metric,
            value: metric.key === 'systemCollections' ? metric.value : null,
            complete: false,
          })),
          issues: [
            ...data.issues,
            {
              code: 'SOURCE_UNREADABLE',
              source: 'extensionCollectionOwnership',
            },
          ],
        };
    }
    const moduleSources = await collectModuleSources(
      this.options.rootDir,
      this.options.runtimeProviders?.(),
    );
    const finished = this.now();
    const overview: FoundationOverview = {
      capabilities,
      moduleSources,
      inventory: inventoryOfProviders,
      availableCapabilities: availableCapabilities(
        capabilities,
        inventoryOfProviders,
      ),
      checkedAt: new Date(finished).toISOString(),
      durationMs: finished - started,
      connection: 'default',
    };
    this.cached = { at: finished, overview };
    return overview;
  }

  private async run(
    collector: CapabilityCollector,
    context: CollectorContext,
  ): Promise<FoundationCapability> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), this.collectorTimeoutMs);
    });
    try {
      const findings = await Promise.race([
        collector.collect(context),
        timeout,
      ]);
      if (findings === 'timeout')
        return failed(collector, [{ code: 'COLLECTOR_TIMEOUT' }]);
      const issues: readonly FoundationIssue[] = context.probe?.issues ?? [];
      return {
        key: collector.key,
        status: findings.status,
        ...(findings.reason === undefined ? {} : { reason: findings.reason }),
        facts: findings.facts ?? [],
        metrics: findings.metrics ?? [],
        parts: findings.parts ?? [],
        packages: await this.resolvePackages(collector.packages),
        completeness: issues.length > 0 ? 'partial' : 'complete',
        issues: [...issues],
      };
    } catch {
      return failed(collector, [{ code: 'COLLECTOR_FAILED' }]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async resolvePackages(
    names: readonly string[],
  ): Promise<readonly FoundationPackage[]> {
    const resolved = await Promise.all(
      names.map(async (name): Promise<FoundationPackage | undefined> => {
        const version = await this.packages.version(name);
        return version === undefined ? undefined : { name, version };
      }),
    );
    return resolved.filter(
      (entry): entry is FoundationPackage => entry !== undefined,
    );
  }
}

/** A capability whose evidence could not be read: it has no status rather than a guessed one. */
function failed(
  collector: CapabilityCollector,
  issues: readonly FoundationIssue[],
): FoundationCapability {
  return {
    key: collector.key,
    status: null,
    facts: [],
    metrics: [],
    parts: [],
    packages: [],
    completeness: 'failed',
    issues,
  };
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  map: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await map(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
