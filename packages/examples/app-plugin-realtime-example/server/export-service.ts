import { randomUUID } from 'node:crypto';
import { readTasksForExport } from '@nocobase/app-plugin-notification-example/server';
import type { DatabaseManager } from '@nocobase/db';
import {
  Job,
  type JobClass,
  type JobExecutionContext,
  type JobExecutor,
} from '@nocobase/jobs';
import type { RealtimeUserTopic } from '@nocobase/app-server/realtime';
import { ApiError } from '@nocobase/app-server/router';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { TaskExport } from '../shared/business.js';

const TABLE = 'realtimeExampleExports';
const MAX_ROWS = 5000;
interface ExportRow extends TaskExport {
  readonly userId: string;
  readonly content: string | null;
}

/** Quote every cell and neutralize spreadsheet formulas, including leading control/space characters. */
export function csvCell(value: string): string {
  const safe = /^[\s\p{Cc}]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export class TaskExportService {
  private readonly running = new Set<string>();
  private readonly creating = new Set<string>();
  public readonly job: JobClass<{ exportId: string }>;

  public constructor(
    private readonly database: DatabaseManager,
    private readonly executor: JobExecutor,
    private readonly topic: RealtimeUserTopic<{ changed: true }>,
  ) {
    const execute = (id: string, context: JobExecutionContext): Promise<void> =>
      this.execute(id, context);
    this.job = class TaskExportJob extends Job<{ exportId: string }> {
      public static readonly jobName: string = 'realtime-example-task-export';
      public override async execute(
        context: JobExecutionContext,
      ): Promise<void> {
        await execute(this.payload.exportId, context);
      }
    };
  }

  public async list(userId: string): Promise<readonly TaskExport[]> {
    return (await this.database
      .connection()
      .query.selectFrom(TABLE)
      .select([
        'id',
        'status',
        'processed',
        'total',
        'createdAt',
        'finishedAt',
        'reason',
      ])
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(20)
      .execute()) as unknown as TaskExport[];
  }

  public async create(userId: string): Promise<TaskExport> {
    if (this.creating.has(userId)) throw conflict();
    this.creating.add(userId);
    try {
      const active = await this.database
        .connection()
        .query.selectFrom(TABLE)
        .select('id')
        .where('activeUserId', '=', userId)
        .executeTakeFirst();
      if (active) throw conflict();
      // Finished rows use their own unique value rather than NULL: SQL Server allows only one NULL in a unique key.
      const row = {
        id: randomUUID(),
        userId,
        activeUserId: userId,
        status: 'queued' as const,
        processed: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        finishedAt: null,
        reason: null,
        content: null,
      };
      await this.database
        .connection()
        .query.insertInto(TABLE)
        .values(row)
        .execute();
      try {
        await this.executor.addJob(new this.job({ exportId: row.id }));
      } catch (error) {
        await this.update(row.id, userId, {
          status: 'failed',
          activeUserId: `finished:${row.id}`,
          reason: 'queue',
          finishedAt: new Date().toISOString(),
        });
        throw error;
      }
      const older = await this.database
        .connection()
        .query.selectFrom(TABLE)
        .select('id')
        .where('userId', '=', userId)
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .limit(100)
        .offset(20)
        .execute();
      if (older.length)
        await this.database
          .connection()
          .query.deleteFrom(TABLE)
          .where(
            'id',
            'in',
            older.map((item) => item.id),
          )
          .execute();
      await this.announce(userId);
      return (await this.list(userId)).find((item) => item.id === row.id)!;
    } finally {
      this.creating.delete(userId);
    }
  }

  public async file(
    userId: string,
    id: string,
  ): Promise<{ fileName: string; content: string }> {
    const row = await this.find(id);
    if (!row || row.userId !== userId)
      throw new ApiError({
        status: 'NOT_FOUND',
        reason: 'EXPORT_NOT_FOUND',
        domain: 'realtimeExample',
        message: 'The export is unavailable.',
      });
    if (row.status !== 'completed' || row.content === null) throw conflict();
    return { fileName: `tasks-${id}.csv`, content: row.content };
  }

  /** The runtime replays pending jobs. This also recovers a crash between recording and enqueueing an export. */
  public async recover(): Promise<void> {
    const rows = await this.database
      .connection()
      .query.selectFrom(TABLE)
      .select('id')
      .where('status', 'in', ['queued', 'running'])
      .execute();
    for (const row of rows)
      await this.executor.addJob(new this.job({ exportId: String(row.id) }));
  }

  public async execute(
    id: string,
    context: JobExecutionContext,
  ): Promise<void> {
    if (this.running.has(id)) return;
    this.running.add(id);
    try {
      const row = await this.find(id);
      if (!row || ['completed', 'failed'].includes(row.status)) return;
      try {
        context.signal.throwIfAborted();
        await this.update(id, row.userId, {
          status: 'running',
          processed: 0,
          reason: null,
        });
        const tasks = await readTasksForExport(
          this.database,
          row.userId,
          MAX_ROWS + 1,
        );
        if (tasks.length > MAX_ROWS) {
          await this.update(id, row.userId, {
            status: 'failed',
            activeUserId: `finished:${id}`,
            reason: 'limit',
            finishedAt: new Date().toISOString(),
          });
          return;
        }
        const lines = ['id,title,description,status,creatorId,assigneeId'];
        await this.update(id, row.userId, { total: tasks.length });
        for (let offset = 0; offset < tasks.length; offset += 100) {
          context.signal.throwIfAborted();
          for (const task of tasks.slice(offset, offset + 100))
            lines.push(
              [
                task.id,
                task.title,
                task.description,
                task.status,
                task.creatorId,
                task.assigneeId,
              ]
                .map(csvCell)
                .join(','),
            );
          const processed = Math.min(offset + 100, tasks.length);
          await this.update(id, row.userId, { processed });
          await context.reportProgress(
            Math.floor((processed / tasks.length) * 100),
          );
        }
        context.signal.throwIfAborted();
        await this.update(id, row.userId, {
          status: 'completed',
          activeUserId: `finished:${id}`,
          content: `\uFEFF${lines.join('\r\n')}\r\n`,
          finishedAt: new Date().toISOString(),
        });
      } catch (error) {
        await this.update(
          id,
          row.userId,
          context.signal.aborted
            ? { status: 'queued', processed: 0 }
            : {
                status: 'failed',
                activeUserId: `finished:${id}`,
                reason: 'execution',
                finishedAt: new Date().toISOString(),
              },
        );
        throw error;
      }
    } finally {
      this.running.delete(id);
    }
  }

  private async find(id: string): Promise<ExportRow | undefined> {
    return await this.database
      .connection()
      .query.selectFrom(TABLE)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  private async update(
    id: string,
    userId: string,
    values: Record<string, unknown>,
  ): Promise<void> {
    await this.database
      .connection()
      .query.updateTable(TABLE)
      .set(values)
      .where('id', '=', id)
      .execute();
    await this.announce(userId);
  }
  private async announce(userId: string): Promise<void> {
    await this.topic
      .publishFor(userId, { changed: true })
      .catch((error: unknown) =>
        console.error('Export invalidation failed.', error),
      );
  }
}
function conflict(): ApiError {
  return new ApiError({
    status: 'ALREADY_EXISTS',
    reason: 'EXPORT_NOT_READY',
    domain: 'realtimeExample',
    message: 'An export is still in progress.',
  });
}
export const taskExportServiceToken: ServiceToken<TaskExportService> =
  createServiceToken('@nocobase/app-plugin-realtime-example/exports');
