import { type DatabaseManager } from '@nocobase/db';
import { type MailOutboxRecord } from '../contracts/persistence.js';
import { fromOutboxRow } from './mappers.js';
import { type OutboxRow } from './rows.js';

export class MailOutboxStore {
  public constructor(private readonly database: DatabaseManager) {}

  public async claimOutbox(
    now: string,
    leaseToken: string,
    leaseExpiresAt: string,
    limit: number,
  ): Promise<readonly MailOutboxRecord[]> {
    const candidates = await this.database
      .query()
      .selectFrom<OutboxRow>('mailOutbox')
      .selectAll()
      .where('availableAt', '<=', now)
      .where((builder) =>
        builder.or([
          builder.eb('status', '=', 'pending'),
          builder.eb.and([
            builder.eb('status', '=', 'publishing'),
            builder.eb('leaseExpiresAt', '<=', now),
          ]),
        ]),
      )
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .execute<OutboxRow>();
    const claimed: MailOutboxRecord[] = [];
    for (const candidate of candidates) {
      const result = await this.database
        .query()
        .updateTable<OutboxRow>('mailOutbox')
        .set({
          status: 'publishing',
          attempts: candidate.attempts + 1,
          leaseToken,
          leaseExpiresAt,
        })
        .where('id', '=', candidate.id)
        .where('availableAt', '<=', now)
        .where((builder) =>
          builder.or([
            builder.eb('status', '=', 'pending'),
            builder.eb.and([
              builder.eb('status', '=', 'publishing'),
              builder.eb('leaseExpiresAt', '<=', now),
            ]),
          ]),
        )
        .execute();
      if (result.updatedCount === 1) {
        claimed.push(
          fromOutboxRow({
            ...candidate,
            status: 'publishing',
            attempts: candidate.attempts + 1,
            leaseToken,
            leaseExpiresAt,
          }),
        );
      }
    }
    return claimed;
  }

  public async markOutboxPublished(
    outboxId: string,
    leaseToken: string,
    publishedAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<OutboxRow>('mailOutbox')
      .set({
        status: 'published',
        leaseToken: null,
        leaseExpiresAt: null,
        publishedAt,
      })
      .where('id', '=', outboxId)
      .where('status', '=', 'publishing')
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }

  public async deletePublishedOutboxBefore(before: string): Promise<number> {
    const result = await this.database
      .query()
      .deleteFrom<OutboxRow>('mailOutbox')
      .where('status', '=', 'published')
      .where('publishedAt', '<=', before)
      .execute();
    return result.deletedCount ?? 0;
  }

  public async releaseOutbox(
    outboxId: string,
    leaseToken: string,
    availableAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<OutboxRow>('mailOutbox')
      .set({
        status: 'pending',
        availableAt,
        leaseToken: null,
        leaseExpiresAt: null,
      })
      .where('id', '=', outboxId)
      .where('status', '=', 'publishing')
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }
}
