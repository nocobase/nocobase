/** Public browser-safe configuration types and daily schedule preview. */
export type {
  DemoConfigurationView,
  DemoDailySchedule,
  DemoWriteRule,
} from '../server/configuration/types.js';
export { nextDailyRun as nextDemoReset } from '../server/configuration/schedule.js';
