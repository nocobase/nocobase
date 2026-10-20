import type { LifecycleDescriptionView, RecordView } from '@nocobase/lifecycle';

export interface WorkflowSummary {
  readonly id: string;
  readonly name: string;
  readonly source: 'lifecycle' | 'office';
  readonly states: number;
  readonly transitions: number;
  readonly executionCount: number;
  readonly lastExecutedAt: string | null;
  readonly categoryId?: string | null;
}
export interface WorkflowDefinition extends LifecycleDescriptionView {
  readonly workflow: WorkflowSummary;
}
export interface WorkflowExecution {
  readonly workflowId: string;
  readonly recordId: string;
  readonly title: string;
  readonly state: string;
  readonly createdAt: string;
}
export interface WorkflowExecutionDetail extends WorkflowDefinition {
  readonly view: RecordView;
}
export interface WorkflowExecutionPage {
  readonly data: readonly WorkflowExecution[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}
