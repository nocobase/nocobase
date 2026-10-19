export const EXPORTS_TOPIC: string = 'realtime-example:exports';
export interface TaskExport {
  readonly id: string;
  readonly status: 'queued' | 'running' | 'completed' | 'failed';
  readonly processed: number;
  readonly total: number;
  readonly createdAt: string;
  readonly finishedAt: string | null;
  readonly reason: string | null;
}
