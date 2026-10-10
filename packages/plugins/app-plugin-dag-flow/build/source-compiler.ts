import {
  compileToFlatIr,
  type WorkflowFlatIr,
  type WorkflowSourceAst,
} from '../dsl/definition.js';

import {
  WorkflowSourceCheckError,
  type WorkflowSourceIssue,
} from './source-issues.js';
import {
  createNodeResultSchemaResolver,
  validateWorkflowFlatIrTopology,
} from '../server/engine/node-results.js';
import type {
  WorkflowSourceContracts,
  WorkflowSourceRuntimeContracts,
} from './source-validator.js';

export function compileWorkflowSource(
  ast: WorkflowSourceAst,
  file: string,
  contracts?: WorkflowSourceContracts | WorkflowSourceRuntimeContracts,
): WorkflowFlatIr {
  try {
    const ir = compileToFlatIr(
      ast,
      contracts === undefined
        ? undefined
        : createNodeResultSchemaResolver(contracts),
    );
    validateWorkflowFlatIrTopology(ir);
    return ir;
  } catch (error) {
    const issue: WorkflowSourceIssue = {
      phase: 'compile',
      code: 'INVALID_TOPOLOGY',
      message: error instanceof Error ? error.message : String(error),
      file,
      nodeKey: 'workflow',
      astPath: 'workflow.nodes',
      contractType: 'WorkflowFlatIr',
    };
    throw new WorkflowSourceCheckError([issue]);
  }
}
