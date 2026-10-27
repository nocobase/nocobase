import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { databaseManagerToken } from '@nocobase/db';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { ServiceContainer } from '@nocobase/service-provider';

import type {
  FoundationCapability,
  FoundationIssue,
  FoundationOverview,
  FoundationPackage,
  FoundationMetric,
  FoundationCollectionPage,
} from '../../shared/foundation.js';
import { availableCapabilities } from '../../shared/available-capabilities.js';
import {
  CAPABILITY_COLLECTORS,
  type CapabilityCollector,
  type CollectorContext,
} from '../capabilities/index.js';
import type { CapabilityFindings } from '../capabilities/types.js';
import { Inventory, Probe } from '../inventory.js';
import { ReadQueue } from '../read-queue.js';
import { ReliableHistory } from '../reliable-history.js';
import {
  applicationCollections,
  dataModelingSummary,
} from '../capabilities/data.js';
import type { CollectionSummary } from '../inventory.js';
import { InstalledPackages } from '../packages.js';
import { ModuleSourceCache } from '../module-source-cache.js';
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
  private readonly history = new ReliableHistory();
  private historyScope?: string;
  private catalogScope?: string;
  private readonly definitionShapes = new Map<string, string>();
  private connectionIdentity?: unknown;
  private cached?: {
    readonly at: number;
    readonly overview: FoundationOverview;
  };
  private pending?: {
    readonly counts: boolean;
    readonly result: Promise<FoundationOverview>;
  };
  private readonly reads = new ReadQueue();
  private recordCount?: {
    readonly signature: string;
    readonly checkedAt: string;
    readonly metric: FoundationMetric;
  };
  private applicationCollections?: readonly CollectionSummary[];
  private readonly packages: InstalledPackages;
  private readonly cacheTtlMs: number;
  private readonly collectorTimeoutMs: number;
  private readonly collectors: readonly CapabilityCollector[];
  private readonly now: () => number;
  private readonly moduleSources: ModuleSourceCache;

  public constructor(private readonly options: FoundationServiceOptions) {
    this.packages = new InstalledPackages(options.rootDir);
    this.cacheTtlMs = options.cacheTtlMs ?? 30_000;
    this.collectorTimeoutMs = options.collectorTimeoutMs ?? 10_000;
    this.collectors = options.collectors ?? CAPABILITY_COLLECTORS;
    this.now = options.now ?? Date.now;
    this.moduleSources = new ModuleSourceCache(this.now);
  }

  public async overview(
    options: FoundationOverviewOptions = {},
  ): Promise<FoundationOverview> {
    const container = this.options.container;
    const database = container.has(databaseManagerToken)
      ? container.resolve(databaseManagerToken)
      : undefined;
    const connection = database?.connection?.() ?? database;
    if (connection !== this.connectionIdentity) {
      this.connectionIdentity = connection;
      this.cached = undefined;
      this.history.clear();
      this.recordCount = undefined;
      this.catalogScope = undefined;
      this.definitionShapes.clear();
    }
    if (
      !options.refresh &&
      !options.countRecords &&
      this.cached &&
      this.now() - this.cached.at < this.cacheTtlMs
    )
      return this.cached.overview;
    // Concurrent requests share one collection rather than each scanning every table.
    if (this.pending) {
      const pending = this.pending;
      const result = await pending.result;
      return options.countRecords && !pending.counts
        ? this.overview(options)
        : result;
    }
    const counts = options.countRecords === true;
    const result = this.collect(counts).finally(() => {
      this.pending = undefined;
    });
    this.pending = { counts, result };
    return result;
  }

  private async collect(countRecords: boolean): Promise<FoundationOverview> {
    const started = this.now();
    const { container } = this.options;
    const database = container.has(databaseManagerToken)
      ? container.resolve(databaseManagerToken)
      : undefined;
    let inventory: Inventory | undefined;
    let databaseUnreadable = false;
    if (database) {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), this.collectorTimeoutMs);
      try {
        inventory = await Inventory.read(database, this.reads, abort.signal);
      } catch {
        databaseUnreadable = true;
      } finally {
        clearTimeout(timer);
      }
    }
    const applicationName = await this.packages.applicationName();
    const ownedCollections = inventory
      ? applicationCollections(new Probe(inventory))
      : undefined;
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
              countRecords,
            }),
    );
    const inventoryOfProviders = await collectProviderInventory(
      this.options.rootDir,
      this.options.runtimeProviders?.(),
      this.options.serverRegistrationsComplete?.(),
    );
    if (inventory)
      this.catalogScope = JSON.stringify(
        inventory.collections
          .map((item) => [item.name, item.kind, item.tableName, item.title])
          .sort(),
      );
    const scope = JSON.stringify({
      applicationName,
      catalog: this.catalogScope,
      providers: inventoryOfProviders.entries
        .map((entry) => [entry.name, entry.categories, entry.registration])
        .sort(),
      rootSet: this.options.config.get<{
        permissionSets?: { rootSet?: string };
      }>('authorization')?.permissionSets?.rootSet,
      channels: Object.keys(
        this.options.config.get<{ channels?: Record<string, unknown> }>(
          'notification',
        )?.channels ?? {},
      ).sort(),
      drive: container.has(driveManagerToken),
    });
    const changedDefinition = [...(inventory?.definitionShapes ?? [])].some(
      ([name, shape]) =>
        this.definitionShapes.has(name) &&
        this.definitionShapes.get(name) !== shape,
    );
    if (scope !== this.historyScope || changedDefinition) {
      this.history.clear();
      if (scope !== this.historyScope) this.recordCount = undefined;
      this.definitionShapes.clear();
      this.historyScope = scope;
    }
    for (const [name, shape] of inventory?.definitionShapes ?? [])
      this.definitionShapes.set(name, shape);
    // Registration does not invalidate observed schema or row counts. Ownership is a separate recognition boundary.
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
      if (data)
        capabilities[index] = {
          ...data,
          facts: [...data.facts, { code: 'collectionOwnershipUnknown' }],
        };
    }
    const signature = inventory
      ? JSON.stringify(
          inventory.collections
            .filter((item) => item.kind === 'table')
            .map((item) => item.name)
            .sort(),
        )
      : this.recordCount?.signature;
    const data = capabilities.find((item) => item.key === 'dataModeling');
    const recordMetric = data?.metrics.find(
      (item) => item.key === 'businessRecords',
    );
    if (this.recordCount?.signature !== signature) this.recordCount = undefined;
    if (
      countRecords &&
      signature !== undefined &&
      recordMetric?.complete &&
      recordMetric.value !== null
    ) {
      this.recordCount = {
        signature,
        metric: recordMetric,
        checkedAt: new Date(this.now()).toISOString(),
      };
    } else if (this.recordCount) {
      const index = capabilities.findIndex(
        (item) => item.key === 'dataModeling',
      );
      if (data)
        capabilities[index] = {
          ...data,
          metrics: data.metrics.some((item) => item.key === 'businessRecords')
            ? data.metrics.map((item) =>
                item.key === 'businessRecords'
                  ? {
                      ...this.recordCount!.metric,
                      checkedAt: this.recordCount!.checkedAt,
                    }
                  : item,
              )
            : [
                {
                  ...this.recordCount.metric,
                  checkedAt: this.recordCount.checkedAt,
                },
                ...data.metrics,
              ],
        };
    }
    const moduleSources = await this.moduleSources.read(
      this.options.rootDir,
      this.options.runtimeProviders?.(),
    );
    const finished = this.now();
    for (let index = 0; index < capabilities.length; index++)
      capabilities[index] = this.history.retain(
        capabilities[index],
        new Date(finished).toISOString(),
      );
    const overview: FoundationOverview = {
      capabilities,
      moduleSources,
      inventory: inventoryOfProviders,
      availableCapabilities: availableCapabilities(
        capabilities,
        inventoryOfProviders,
      ),
      checkedAt: new Date(finished).toISOString(),
      ...(this.recordCount
        ? { recordCountCheckedAt: this.recordCount.checkedAt }
        : {}),
      durationMs: finished - started,
      connection: 'default',
    };
    this.applicationCollections = ownedCollections;
    this.cached = { at: finished, overview };
    return overview;
  }

  public async collections(options: {
    readonly offset: number;
    readonly search: string;
  }): Promise<FoundationCollectionPage | undefined> {
    await this.overview();
    if (!this.applicationCollections) return undefined;
    const search = options.search.trim().toLocaleLowerCase();
    const matching = this.applicationCollections
      .filter((item) =>
        `${item.name}\n${item.title ?? ''}`
          .toLocaleLowerCase()
          .includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      items: matching
        .slice(options.offset, options.offset + 50)
        .map(({ name, title, kind }) => ({
          name,
          ...(title ? { title } : {}),
          kind,
        })),
      total: matching.length,
    };
  }

  private async run(
    collector: CapabilityCollector,
    context: CollectorContext,
  ): Promise<FoundationCapability> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let progress: CapabilityFindings | undefined;
    const abort = new AbortController();
    const probe = context.probe
      ? new Probe(context.probe.inventory, abort.signal)
      : undefined;
    let deadlineIssues: readonly FoundationIssue[] = [];
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => {
        deadlineIssues = [...(probe?.issues ?? [])];
        resolve('timeout');
        abort.abort();
      }, this.collectorTimeoutMs);
    });
    try {
      const findings = await Promise.race([
        collector.collect({
          ...context,
          probe,
          report: (finding) => {
            if (abort.signal.aborted) return;
            const status =
              progress?.status === 'active' || finding.status === 'active'
                ? 'active'
                : (finding.status ?? progress?.status ?? null);
            progress = {
              status,
              ...(status === 'active'
                ? {}
                : { reason: finding.reason ?? progress?.reason }),
              facts: finding.facts ?? progress?.facts ?? [],
              metrics: mergeEvidence(
                progress?.metrics,
                finding.metrics,
                (item) => item.key,
              ),
              parts: mergeEvidence(
                progress?.parts,
                finding.parts,
                (item) => item.key,
              ),
            };
          },
        }),
        timeout,
      ]);
      if (findings === 'timeout')
        return progress || (collector.key === 'dataModeling' && probe)
          ? {
              ...failed(collector, [
                ...deadlineIssues,
                { code: 'COLLECTOR_TIMEOUT' },
              ]),
              ...(progress ?? dataModelingSummary(probe!)),
              packages: await this.resolvePackages(collector.packages),
              completeness: 'partial',
            }
          : failed(collector, [{ code: 'COLLECTOR_TIMEOUT' }]);
      const issues: readonly FoundationIssue[] = probe?.issues ?? [];
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
      return {
        ...failed(collector, [{ code: 'COLLECTOR_FAILED' }]),
        ...(progress ? { ...progress, completeness: 'partial' as const } : {}),
      };
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

function mergeEvidence<T>(
  previous: readonly T[] = [],
  current: readonly T[] = [],
  key: (item: T) => string,
): readonly T[] {
  return [
    ...new Map(
      [...previous, ...current].map((item) => [key(item), item]),
    ).values(),
  ];
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
