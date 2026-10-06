import { z } from 'zod';

export const TASK_STATUSES = ['open', 'in-progress', 'done'] as const;
export const DEFAULT_TASK_PAGE_SIZE = 20;
export const MAX_TASK_PAGE_SIZE = 100;

const text = z.string().trim().min(1);

export const TaskParams: z.ZodObject<{ taskId: z.ZodString }, z.core.$strip> =
  z.object({ taskId: z.string().min(1) });

/** A task id as `crypto.randomUUID()` writes it, accepted in any case. */
export const TaskId: z.ZodGUID = z.guid();

export const ListTasksQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_TASK_PAGE_SIZE)
    .default(DEFAULT_TASK_PAGE_SIZE),
});

export const CreateTaskInput: z.ZodObject<
  { title: z.ZodString; description: z.ZodString; assigneeId: z.ZodString },
  z.core.$strict
> = z.strictObject({ title: text, description: text, assigneeId: text });

export const UpdateTaskInput: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<
      z.ZodEnum<{ open: 'open'; 'in-progress': 'in-progress'; done: 'done' }>
    >;
    assigneeId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
> = z.strictObject({
  title: text.optional(),
  description: text.optional(),
  status: z.enum(TASK_STATUSES).optional(),
  assigneeId: text.optional(),
});

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type CreateTask = z.infer<typeof CreateTaskInput>;
export type UpdateTask = z.infer<typeof UpdateTaskInput>;

// Response schemas. Each is annotated with the value it describes, which isolated declarations require of an export,
// and carries a `ref` so the API document names it once and refers to it from every route.

export interface TaskUserBody {
  readonly id: string;
  readonly name?: string | undefined;
  readonly email?: string | undefined;
}
export const TaskUser: z.ZodType<TaskUserBody> = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
  })
  .meta({
    ref: 'NotificationExampleUser',
    description:
      'An active user. A user who is no longer active is answered with `id` alone.',
  });

export interface TaskBody {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly creatorId: string;
  readonly assigneeId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly creator: TaskUserBody;
  readonly assignee: TaskUserBody;
}
export const Task: z.ZodType<TaskBody> = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(TASK_STATUSES),
    creatorId: z.string(),
    assigneeId: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    creator: TaskUser.meta({ description: 'Who created the task.' }),
    assignee: TaskUser.meta({ description: 'Who the task is assigned to.' }),
  })
  .meta({ ref: 'NotificationExampleTask' });
