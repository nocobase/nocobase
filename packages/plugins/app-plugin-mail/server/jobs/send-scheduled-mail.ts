import { Job, type JobClass } from '@nocobase/jobs';

import type { MailScheduledSendTaskPayload } from '../contracts/persistence.js';

/** The handler identity stored with every scheduled send task: keep it stable. */
export const MAIL_SCHEDULED_SEND_JOB_NAME =
  '@nocobase/app-plugin-mail/send-scheduled-mail';

export type MailScheduledSendJobHandler = (
  payload: MailScheduledSendTaskPayload,
) => Promise<void>;

/** Like the sync job, the class closes over the handler of the runtime that registers it. */
export function createSendScheduledMailJob(
  handler: MailScheduledSendJobHandler,
): JobClass<MailScheduledSendTaskPayload> {
  return class SendScheduledMailJob extends Job<MailScheduledSendTaskPayload> {
    public static readonly jobName: string = MAIL_SCHEDULED_SEND_JOB_NAME;

    public async execute(): Promise<void> {
      if (
        this.payload.version !== 1 ||
        typeof this.payload.submissionId !== 'string' ||
        this.payload.submissionId.length === 0
      ) {
        throw new TypeError('Invalid scheduled mail job payload.');
      }
      await handler(this.payload);
    }
  };
}
