import { randomUUID } from 'node:crypto';
import { mailLogError, writeMailLog } from '../logging.js';
import type {
  MailScheduledSendTaskPayload,
  MailStore,
  MailSyncMailboxTaskPayload,
} from '../contracts/persistence.js';
import type { MailLogger } from '../logging.js';
import type { JobClass, JobExecutor } from '@nocobase/jobs';

export interface MailOutboxJobs {
  readonly executor: JobExecutor;
  readonly syncMailbox: JobClass<MailSyncMailboxTaskPayload>;
  readonly sendScheduledMail: JobClass<MailScheduledSendTaskPayload>;
}

export class MailOutboxRelay {
  public constructor(
    private readonly options: {
      readonly store: Pick<
        MailStore,
        'claimOutbox' | 'markOutboxPublished' | 'releaseOutbox'
      >;
      readonly logger?: MailLogger;
    },
    private readonly jobs: MailOutboxJobs,
    private readonly requestSync: (accountId: string) => Promise<boolean>,
  ) {}
  public async publish(): Promise<void> {
    const now = new Date();
    const claimed = await this.options.store.claimOutbox(
      now.toISOString(),
      randomUUID(),
      new Date(now.getTime() + 30_000).toISOString(),
      50,
    );
    for (const record of claimed) {
      try {
        if (record.type === 'requestMailboxSync') {
          await this.requestSync(record.payload.accountId);
        } else if (record.type === 'syncMailbox') {
          // A task published twice is harmless: the sync run's revision and lease fence the second delivery.
          await this.jobs.executor.addJob(
            new this.jobs.syncMailbox(record.payload),
          );
        } else {
          // The submission lease likewise lets only one delivery send a scheduled message.
          await this.jobs.executor.addJob(
            new this.jobs.sendScheduledMail(record.payload),
          );
        }
        await this.options.store.markOutboxPublished(
          record.id,
          record.leaseToken ?? '',
          new Date().toISOString(),
        );
      } catch (error) {
        const delay = Math.max(
          65_000,
          Math.min(300_000, 1_000 * 2 ** Math.min(record.attempts, 8)),
        );
        await this.options.store.releaseOutbox(
          record.id,
          record.leaseToken ?? '',
          new Date(Date.now() + delay).toISOString(),
        );
        writeMailLog(
          this.options.logger,
          'error',
          { err: mailLogError(error), outboxId: record.id },
          'Mail Outbox message could not be published.',
        );
      }
    }
    if (claimed.length > 0) {
      writeMailLog(
        this.options.logger,
        'info',
        { count: claimed.length },
        'Mail Outbox Relay processed messages.',
      );
    }
  }
}
