import { Job, type JobClass } from '@nocobase/jobs';

import type { ChannelManager } from './channel-manager.js';

/** The handler identity stored with every Delivery task: keep it stable. */
export const DELIVERY_JOB_NAME: string = 'notification.delivery';

export interface DeliveryJobPayload {
  readonly deliveryId: string;
}

export type DeliveryJobClass = JobClass<
  DeliveryJobPayload,
  Job<DeliveryJobPayload>
>;

/**
 * The class closes over the Channel Manager rather than receiving it: a task
 * carries only its payload, and each executor keeps its own registry, so the
 * Manager that registered the class is the one that executes it.
 */
export function createDeliveryJob(
  channelManager: ChannelManager,
): DeliveryJobClass {
  return class DeliveryJob extends Job<DeliveryJobPayload> {
    public static readonly jobName: string = DELIVERY_JOB_NAME;

    public async execute(): Promise<void> {
      await channelManager.send(this.payload.deliveryId);
    }
  };
}
