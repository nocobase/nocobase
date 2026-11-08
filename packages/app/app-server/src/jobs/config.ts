import { validateJobsConfig, type JobsConfig } from '@nocobase/jobs';
import type { ConfigValidationContext } from '../config/index.js';

export type AppJobsConfig = JobsConfig;

/** Pure validation of the merged application section, including unselected legacy fields. */
export function validateAppJobsConfig(
  value: AppJobsConfig,
  context: ConfigValidationContext,
): void {
  try {
    validateJobsConfig(value);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    context.error('', error.message);
  }
}
