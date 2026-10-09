import { Job, type JobClass } from '@nocobase/jobs';

import type { MailSyncMailboxTaskPayload } from '../contracts/persistence.js';

/** The handler identity stored with every sync task: keep it stable. */
export const MAIL_SYNC_JOB_NAME = '@nocobase/app-plugin-mail/sync-mailbox';

export type MailSyncJobHandler = (
  payload: MailSyncMailboxTaskPayload,
) => Promise<void>;

/**
 * The class closes over the runtime's handler rather than looking it up: a task carries only its payload, and each
 * executor keeps its own registry, so the runtime that registered the class is the one that executes it.
 */
export function createSyncMailboxJob(
  handler: MailSyncJobHandler,
): JobClass<MailSyncMailboxTaskPayload> {
  return class SyncMailboxJob extends Job<MailSyncMailboxTaskPayload> {
    public static readonly jobName: string = MAIL_SYNC_JOB_NAME;

    public async execute(): Promise<void> {
      if (
        this.payload.version !== 1 ||
        typeof this.payload.syncRunId !== 'string' ||
        this.payload.syncRunId.length === 0 ||
        !Number.isSafeInteger(this.payload.expectedRevision) ||
        typeof this.payload.expectedPhase !== 'string'
      ) {
        throw new TypeError('Invalid mail sync job payload.');
      }
      await handler(this.payload);
    }
  };
}
