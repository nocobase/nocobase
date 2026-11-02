import { createHash, randomUUID } from 'node:crypto';
import { findPackageJSON } from 'node:module';
import { readFileSync } from 'node:fs';

import {
  RepositoryError,
  type DatabaseManager,
  type Repository,
} from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';
import {
  Job,
  type JobClass,
  type JobExecutionContext,
  type JobExecutor,
} from '@nocobase/jobs';

import type {
  FoundationOverview,
  FoundationScanStatus,
  FoundationSnapshot,
  FoundationCollectionPage,
} from '../shared/foundation.js';
import type { FoundationService, FoundationOverviewOptions } from './tokens.js';
import {
  DefaultFoundationService,
  type FoundationCheckpoint,
} from './services/foundation.js';

// Resolve from the runtime export that this plugin actually imports, never from an application's manifest.
function runningKernelVersion(): string {
  const manifest = findPackageJSON(
    '@nocobase/app-server/plugins',
    import.meta.url,
  );
  if (!manifest)
    throw new Error(
      'The running NocoBase kernel version could not be resolved.',
    );
  const metadata = JSON.parse(readFileSync(manifest, 'utf8')) as {
    name?: string;
    version?: string;
  };
  if (metadata.name !== '@nocobase/app-server' || !metadata.version)
    throw new Error('The running NocoBase kernel version is missing.');
  return metadata.version;
}
export const RUNNING_KERNEL_VERSION: string = runningKernelVersion();

interface SnapshotRow {
  readonly id: string;
  readonly revision: number;
  readonly generation: string;
  readonly kernelVersion: string;
  readonly status: FoundationScanStatus['status'];
  readonly countRecords: boolean;
  readonly jobId: string | null;
  readonly snapshotKernelVersion: string | null;
  readonly overview: FoundationOverview | null;
  readonly checkpoint: FoundationCheckpoint | null;
}

export interface ScanPayload {
  readonly scope: string;
  readonly generation: string;
}

/** Private to this application and default connection; no generic data API exposes this collection. */
export class FoundationSnapshots implements FoundationService {
  private readonly id: string;
  private readonly repository: Repository<SnapshotRow>;
  public readonly job: JobClass<ScanPayload>;

  public constructor(
    private readonly options: {
      readonly database: DatabaseManager;
      readonly appName: string;
      readonly kernelVersion?: string;
      readonly executor: JobExecutor;
      readonly collector: () => DefaultFoundationService;
    },
  ) {
    const connection = options.database.connection();
    this.id = createHash('sha256')
      .update(JSON.stringify([options.appName, connection.name]))
      .digest('hex');
    this.repository = connection.repository<SnapshotRow>('foundationSnapshots');
    const run = this.run.bind(this);
    this.job = class FoundationScanJob extends Job<ScanPayload> {
      public static readonly jobName: string = 'foundationScan';
      public execute(context: JobExecutionContext): Promise<void> {
        return run(this.payload, context);
      }
    };
  }

  private get kernelVersion(): string {
    return this.options.kernelVersion ?? RUNNING_KERNEL_VERSION;
  }

  private read(): Promise<SnapshotRow | undefined> {
    return this.repository.findOne({ filter: { id: this.id } });
  }

  private view(row?: SnapshotRow): FoundationScanStatus {
    return {
      kernelVersion: this.kernelVersion,
      status: row?.status ?? 'idle',
      needsScan: row === undefined || row.kernelVersion !== this.kernelVersion,
      ...(row ? { generation: row.generation } : {}),
      ...(row?.snapshotKernelVersion
        ? { snapshotKernelVersion: row.snapshotKernelVersion }
        : {}),
      ...(row?.overview ? { checkedAt: row.overview.checkedAt } : {}),
    };
  }

  public async snapshot(): Promise<FoundationSnapshot> {
    const row = await this.read();
    return {
      ...this.view(row),
      ...(row?.overview ? { overview: row.overview } : {}),
    };
  }

  public async scanStatus(): Promise<FoundationScanStatus> {
    // Polls read only small columns; neither the result JSON nor any source tables are loaded.
    const row = await this.repository.findOne({
      filter: { id: this.id },
      select: (select) =>
        select.fields(
          'generation',
          'kernelVersion',
          'snapshotKernelVersion',
          'status',
        ),
    });
    return {
      kernelVersion: this.kernelVersion,
      status: row?.status ?? 'idle',
      needsScan: !row || row.kernelVersion !== this.kernelVersion,
      ...(row ? { generation: row.generation } : {}),
      ...(row?.snapshotKernelVersion
        ? { snapshotKernelVersion: row.snapshotKernelVersion }
        : {}),
    };
  }

  private async update(
    row: SnapshotRow,
    values: Partial<SnapshotRow>,
  ): Promise<SnapshotRow | undefined> {
    try {
      return (
        await this.repository.updateOne({
          filter: { id: this.id },
          ifVersion: row.revision,
          values,
        })
      ).record;
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'VERSION_CONFLICT')
        return undefined;
      throw error;
    }
  }

  public async ensureScan(
    options: {
      readonly refresh?: boolean;
      readonly countRecords?: boolean;
    } = {},
  ): Promise<FoundationScanStatus> {
    let row = await this.read();
    if (
      row?.kernelVersion === this.kernelVersion &&
      (row.status === 'queued' ||
        row.status === 'running' ||
        (!options.refresh && !options.countRecords))
    )
      return this.view(row);
    const values = {
      generation: randomUUID(),
      kernelVersion: this.kernelVersion,
      status: 'queued' as const,
      countRecords: options.countRecords === true,
      jobId: null,
    };
    if (row) {
      const claimed = await this.update(row, values);
      if (!claimed) return this.scanStatus();
      row = claimed;
    } else {
      try {
        row = (
          await this.repository.createOne({
            values: { id: this.id, ...values },
          })
        ).record;
      } catch (error) {
        // A concurrent first visit can win the unique primary key. Never hide a storage failure.
        if (await this.read()) return this.scanStatus();
        throw error;
      }
    }
    await this.submit(row);
    // Return the claim itself, even when a fast worker already finished it.
    return this.view(row);
  }

  private async submit(row: SnapshotRow): Promise<void> {
    try {
      await this.options.executor.addJob(
        new this.job({ scope: this.id, generation: row.generation }),
      );
    } catch (error) {
      await this.update(row, { status: 'failed' });
      throw error;
    }
  }

  /** Memory Jobs has one process. Redis Jobs owns interrupted/stalled attempt recovery across processes. */
  public async recoverMemory(): Promise<void> {
    const row = await this.read();
    if (row?.kernelVersion === this.kernelVersion && row.status === 'running') {
      await this.update(row, { status: 'queued', jobId: null });
    }
  }

  public async start(memory: boolean): Promise<void> {
    if (memory) await this.recoverMemory();
    const row = await this.read();
    // Covers a process exit between the durable claim and backend acceptance. Duplicate deliveries share the claim.
    if (row?.kernelVersion === this.kernelVersion && row.status === 'queued')
      await this.submit(row);
    else await this.ensureScan();
  }

  public async run(
    payload: ScanPayload,
    context: Pick<JobExecutionContext, 'jobId' | 'signal'>,
  ): Promise<void> {
    if (payload.scope !== this.id) return;
    let row = await this.read();
    if (
      !row ||
      row.generation !== payload.generation ||
      row.kernelVersion !== this.kernelVersion ||
      (row.status !== 'queued' &&
        !(row.status === 'running' && row.jobId === context.jobId))
    )
      return;
    row = await this.update(row, { status: 'running', jobId: context.jobId });
    if (!row) return;
    try {
      context.signal.throwIfAborted();
      const collector = this.options.collector();
      if (row.overview && row.checkpoint)
        collector.restore(row.overview, row.checkpoint);
      const overview = await collector.overview({
        refresh: true,
        countRecords: row.countRecords,
      });
      context.signal.throwIfAborted();
      if (
        overview.capabilities.some(
          (capability) => capability.completeness === 'failed',
        )
      )
        throw new Error('Foundation scan did not complete.');
      await this.update(row, {
        overview,
        checkpoint: collector.checkpoint(),
        snapshotKernelVersion: this.kernelVersion,
        status: 'succeeded',
      });
    } catch (error) {
      // An interrupted job goes back to waiting in Jobs. Its durable generation can be resumed by that same job.
      if (context.signal.aborted) throw error;
      await this.update(row, { status: 'failed' });
    }
  }

  /** Compatibility for service consumers: submissions never wait for a scan. */
  public async overview(
    options: FoundationOverviewOptions = {},
  ): Promise<FoundationOverview> {
    if (options.refresh || options.countRecords) await this.ensureScan(options);
    const snapshot = await this.snapshot();
    if (snapshot.overview) return snapshot.overview;
    throw new ApiError({
      status: 'UNAVAILABLE',
      reason: 'FOUNDATION_PENDING',
      domain: 'foundation',
      message: 'App foundation information is pending update.',
    });
  }

  public async collections(options: {
    readonly offset: number;
    readonly search: string;
  }): Promise<FoundationCollectionPage | undefined> {
    const row = await this.read();
    const collections = row?.checkpoint?.collections;
    if (!collections) return undefined;
    const search = options.search.trim().toLocaleLowerCase();
    const matching = collections
      .filter((item) =>
        `${item.name}\n${item.title ?? ''}`
          .toLocaleLowerCase()
          .includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      total: matching.length,
      items: matching
        .slice(options.offset, options.offset + 50)
        .map(({ name, title, kind }) => ({
          name,
          ...(title ? { title } : {}),
          kind,
        })),
    };
  }
}
