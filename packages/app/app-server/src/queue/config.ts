import { validateQueueConfig, type QueueConfig } from '@nocobase/queue';
import type { ConfigValidationContext } from '../config/index.js';

export type AppQueueConfig = QueueConfig;

/** Pure validation of the merged application section, including unselected legacy fields. */
export function validateAppQueueConfig(
  value: AppQueueConfig,
  context: ConfigValidationContext,
): void {
  try {
    validateQueueConfig(value);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    context.error('', error.message);
  }
}
