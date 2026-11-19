import type { LifecycleDescriptionView, RecordView } from '@nocobase/lifecycle';

/** One registered version of a process. */
export interface WorkflowVersion {
  readonly name: string;
  readonly version: number;
}

/**
 * One process: every version of its definition, under its key. `name` is
 * the key, which is also the first version's name; `version` is the latest,
 * which is the largest, not necessarily the one new records use.
 */
export interface WorkflowSummary {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  /** Oldest first. */
  readonly versions: readonly WorkflowVersion[];
  readonly source: 'lifecycle' | 'office';
  readonly states: number;
  readonly transitions: number;
  readonly executionCount: number;
  readonly lastExecutedAt: string | null;
  readonly categoryId?: string | null;
}
export interface WorkflowDefinition extends LifecycleDescriptionView {
  /** Execution statistics count every version of the process. */
  readonly workflow: WorkflowSummary;
  /** The version described, with its own execution count. */
  readonly definition: WorkflowVersion & { readonly executionCount: number };
}
export interface WorkflowExecution {
  readonly workflowId: string;
  readonly recordId: string;
  readonly title: string;
  readonly state: string;
  /** The version the record is bound to. */
  readonly definition: string;
  readonly version: number;
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
