import type { DatabaseManager } from '@nocobase/db';

export interface ExportableTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly creatorId: string;
  readonly assigneeId: string;
}

/** A bounded snapshot with the same participant policy as the task HTTP API. */
export async function readTasksForExport(
  database: DatabaseManager,
  userId: string,
  limit: number,
): Promise<readonly ExportableTask[]> {
  return (await database
    .connection()
    .query.selectFrom('notificationExampleTasks')
    .select(['id', 'title', 'description', 'status', 'creatorId', 'assigneeId'])
    .where((eb) =>
      eb.or([eb('creatorId', '=', userId), eb('assigneeId', '=', userId)]),
    )
    .orderBy('id', 'asc')
    .limit(limit)
    .execute()) as unknown as ExportableTask[];
}
