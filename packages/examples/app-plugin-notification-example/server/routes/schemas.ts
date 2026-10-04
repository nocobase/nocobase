import { z } from 'zod';

export const TASK_STATUSES = ['open', 'in-progress', 'done'] as const;
export const DEFAULT_TASK_PAGE_SIZE = 20;
export const MAX_TASK_PAGE_SIZE = 100;

const text = z.string().trim().min(1);

export const TaskParams: z.ZodObject<{ taskId: z.ZodString }, z.core.$strip> =
  z.object({ taskId: z.string().min(1) });

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
