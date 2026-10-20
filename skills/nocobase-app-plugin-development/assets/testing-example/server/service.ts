import type { DatabaseManager } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface ReadingEntry {
  readonly id: string;
  readonly title: string;
}

export class ReadingListService {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly pageSize: number,
  ) {}

  public async list(): Promise<ReadingEntry[]> {
    return this.database
      .repository<ReadingEntry>('readingListEntries')
      .findMany({
        limit: this.pageSize,
        sort: (sort) => sort.field('id').asc(),
      });
  }

  public async count(): Promise<number> {
    return this.database.repository<ReadingEntry>('readingListEntries').count();
  }
}

export const readingListToken: ServiceToken<ReadingListService> =
  createServiceToken<ReadingListService>(
    '@example/app-plugin-reading-list/service',
  );
