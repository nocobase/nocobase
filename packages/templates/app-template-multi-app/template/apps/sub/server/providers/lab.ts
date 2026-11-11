import { randomUUID } from 'node:crypto';
import { ApiError } from '@nocobase/app-server/router';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryFilter,
} from '@nocobase/db';
export interface LabRecord {
  id: string;
  name: string;
  detail: string;
  location: string;
  createdAt: string;
}
export interface LabSettings {
  id: string;
  manager: string;
  location: string;
  revision: number;
}
export class LabService {
  constructor(private readonly database: DatabaseManager) {}
  async settings(
    tx: DatabaseConnection = this.database.connection(),
  ): Promise<LabSettings> {
    const row = await tx
      .repository<LabSettings>('labSettings')
      .findOne({ filter: { id: 'default' } });
    if (!row)
      throw new ApiError({
        domain: 'lab',
        status: 'UNAVAILABLE',
        reason: 'SETTINGS_NOT_READY',
        message: 'Settings are not ready.',
      });
    return row;
  }
  async saveSettings(
    input: Omit<LabSettings, 'id'>,
    tx: DatabaseConnection,
  ): Promise<LabSettings> {
    const previous = await this.settings(tx);
    if (previous.revision !== input.revision)
      throw new ApiError({
        domain: 'lab',
        status: 'ABORTED',
        reason: 'STALE_REVISION',
        message: 'Reload settings before saving.',
      });
    return (
      await tx.repository<LabSettings>('labSettings').updateOne({
        filter: { id: 'default', revision: input.revision },
        values: { ...input, revision: input.revision + 1 },
      })
    ).record;
  }
  async list(
    search: string,
    offset: number,
    limit: number,
    direction: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: readonly LabRecord[]; meta: { total: number } }> {
    const repo = this.database.repository<LabRecord>('labRecords');
    const filter: RepositoryFilter<LabRecord> | undefined = search
      ? (f) =>
          f.or([
            f.string('name').includes(search),
            f.string('location').includes(search),
          ])
      : undefined;
    const data = await repo.findMany({
      filter,
      offset,
      limit,
      sort: (s) => [
        direction === 'asc'
          ? s.field('createdAt').asc()
          : s.field('createdAt').desc(),
        s.field('id').desc(),
      ],
    });
    return { data, meta: { total: await repo.count({ filter }) } };
  }
  async create(
    input: Omit<LabRecord, 'id' | 'createdAt'>,
    tx: DatabaseConnection,
  ): Promise<LabRecord> {
    return (
      await tx.repository<LabRecord>('labRecords').createOne({
        values: {
          ...input,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
        },
      })
    ).record;
  }
  async get(id: string): Promise<LabRecord> {
    const row = await this.database
      .repository<LabRecord>('labRecords')
      .findOne({ filter: { id } });
    if (!row)
      throw new ApiError({
        domain: 'lab',
        status: 'NOT_FOUND',
        reason: 'RECORD_NOT_FOUND',
        message: 'Record not found.',
      });
    return row;
  }
  async remove(id: string, tx: DatabaseConnection): Promise<{ id: string }> {
    const repo = tx.repository('labRecords');
    if (!(await repo.exists({ filter: { id } })))
      throw new ApiError({
        domain: 'lab',
        status: 'NOT_FOUND',
        reason: 'RECORD_NOT_FOUND',
        message: 'Record not found.',
      });
    await repo.deleteOne({ filter: { id } });
    return { id };
  }
}
