import type {
  WorkflowRunFunction,
  WorkflowRunJsonValue,
} from '@nocobase/app-plugin-dag-flow';

export const run: WorkflowRunFunction =
  async (): Promise<WorkflowRunJsonValue> => ({
    backordered: true,
  });
