import fs from 'node:fs/promises';
import path from 'node:path';

import type { WorkflowFlatIr, WorkflowSourceAst } from '../dsl/definition.js';

import { coreInstructions } from '../server/instructions/index.js';
import { compileWorkflowSource } from './source-compiler.js';
import { WorkflowSourceCheckError } from './source-issues.js';
import { parseWorkflowSource } from './source-parser.js';
import type { WorkflowSourceContracts } from './source-validator.js';
import { validateWorkflowSourceAst } from './source-validator.js';
import { collectWorkflowClientResources } from './client-resources.js';

export interface WorkflowSourceCheckOptions {
  contracts?: WorkflowSourceContracts;
}
export interface WorkflowSourceCheckResult {
  file: string;
  ast: WorkflowSourceAst;
  ir: WorkflowFlatIr;
}

export async function checkWorkflowPackage(
  packagePath: string,
  options: WorkflowSourceCheckOptions = {},
): Promise<WorkflowSourceCheckResult> {
  const stat = await fs.stat(packagePath);
  const file = stat.isDirectory()
    ? path.join(packagePath, 'workflow.ts')
    : packagePath;
  const parsed = await parseWorkflowSource(file);
  const contracts = options.contracts ?? { nodes: coreInstructions };
  const issues = validateWorkflowSourceAst(parsed.ast, file, contracts);
  try {
    await collectWorkflowClientResources(
      path.dirname(file),
      parsed.ast,
      contracts.nodes as ReadonlyMap<
        string,
        import('../server/instructions/index.js').WorkflowInstructionClass
      >,
    );
  } catch (error) {
    issues.push({
      phase: 'semantic',
      code: 'CLIENT_RESOURCE_INVALID',
      message: error instanceof Error ? error.message : String(error),
      file,
      astPath: 'workflow.client',
      contractType: 'WorkflowClientSource',
      nodeKey: 'workflow',
    });
  }
  if (issues.length) throw new WorkflowSourceCheckError(issues);
  return {
    file,
    ast: parsed.ast,
    ir: compileWorkflowSource(parsed.ast, file, contracts),
  };
}
