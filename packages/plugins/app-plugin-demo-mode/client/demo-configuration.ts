/** Public browser-safe configuration types and daily schedule preview. */
export type {
  DemoConfigurationView,
  DemoChatConfiguration,
  DemoDailySchedule,
  DemoWriteRule,
} from '../shared/configuration.js';
export { nextDailyRun as nextDemoReset } from '../shared/schedule.js';
