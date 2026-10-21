/** Public browser-safe configuration types and daily schedule preview. */
export type {
  DemoConfigurationView,
  DemoChatConfiguration,
  DemoDailySchedule,
  DemoWriteRule,
  DemoTableRule,
} from '../server/configuration/types.js';
export { nextDailyRun as nextDemoReset } from '../server/configuration/schedule.js';
