/** Invalidates the authenticated participant's task list; contains no task data. */
export const TASKS_TOPIC: string = 'notification-example:tasks';
export type {
  TaskBody,
  TaskStatus,
  TaskUserBody,
} from '../server/routes/schemas.js';
