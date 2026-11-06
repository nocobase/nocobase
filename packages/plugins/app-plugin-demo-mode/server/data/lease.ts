import type { ApiError } from '@nocobase/app-server/router';
import type { DemoDataDependencies } from './service.js';
import { demoDataError } from '../errors.js';

/** Persisted fencing and heartbeats shared by generation and cleanup. */
export class DemoOperationLease {
  public constructor(
    private readonly deps: Pick<DemoDataDependencies, 'database' | 'logger'>,
  ) {}
  public leaseLost(): ApiError {
    return demoDataError(
      'DEMO_DATA_LEASE_LOST',
      'Another process took over this demo data operation.',
    );
  }

  public async assertLease(id: string, operationId: string): Promise<void> {
    const row = await this.deps.database
      .query()
      .selectFrom('demoModeDatasets')
      .select('operationId')
      .where('id', '=', id)
      .where('operationId', '=', operationId)
      .executeTakeFirst();
    if (!row) throw this.leaseLost();
  }

  /** Renew imports and full cleanup alike; drain an in-flight renewal before releasing the operation. */
  public async withLease<T>(
    id: string,
    operationId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    let renewing: Promise<void> | undefined;
    const heartbeat = setInterval(() => {
      if (renewing) return;
      renewing = this.touch(id, operationId, {})
        .catch((cause: unknown) =>
          this.deps.logger?.warn(
            { dataset: id, cause: String(cause) },
            'Could not renew demo data operation',
          ),
        )
        .finally(() => {
          renewing = undefined;
        });
    }, 30_000);
    heartbeat.unref();
    try {
      return await work();
    } finally {
      clearInterval(heartbeat);
      await renewing;
    }
  }

  public async touch(
    id: string,
    operationId: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.deps.database
      .query()
      .updateTable('demoModeDatasets')
      .set({ ...values, updatedAt: new Date() })
      .where('id', '=', id)
      .where('operationId', '=', operationId)
      .execute();
    if (result.updatedCount !== 1) throw this.leaseLost();
  }
}
