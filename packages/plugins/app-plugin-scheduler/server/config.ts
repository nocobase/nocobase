/** The `scheduler` configuration section. */
export interface SchedulerConfig {
  /**
   * The `jobs` configuration schedules run on. Omitted, they follow
   * `jobs.default`, like every other consumer of the jobs service.
   */
  readonly jobs?: string;
}
