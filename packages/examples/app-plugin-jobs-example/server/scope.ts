/**
 * The plugin's scope on the jobs service: its package name, and its alone.
 * Its ScheduleExecutor and JobExecutor share it and never share a queue.
 */
export const JOBS_EXAMPLE_SCOPE: string = '@nocobase/app-plugin-jobs-example';
