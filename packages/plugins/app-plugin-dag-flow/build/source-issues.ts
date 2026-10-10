export type WorkflowSourcePhase =
  'typecheck' | 'evaluate' | 'schema' | 'semantic' | 'compile' | 'publish';

export interface WorkflowSourceIssue {
  phase: WorkflowSourcePhase;
  code: string;
  message: string;
  file: string;
  line?: number;
  column?: number;
  nodeKey?: string;
  astPath: string;
  contractType: string;
}

export function formatWorkflowSourceIssue(issue: WorkflowSourceIssue): string {
  const subject = issue.nodeKey
    ? `Node "${issue.nodeKey}" (${issue.contractType})`
    : issue.contractType;
  const position =
    issue.line === undefined
      ? issue.file
      : `${issue.file}:${issue.line}:${issue.column ?? 1}`;
  return `[${issue.phase}/${issue.code}]\n${subject}: ${issue.message}\nAST path: ${issue.astPath}\nat ${position}`;
}

export class WorkflowSourceCheckError extends Error {
  constructor(public readonly issues: readonly WorkflowSourceIssue[]) {
    super(issues.map(formatWorkflowSourceIssue).join('\n\n'));
    this.name = 'WorkflowSourceCheckError';
  }
}
