import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkflowSourceAst, NodeSourceAst } from '../dsl/definition.js';
import type { WorkflowInstructionClass } from '../server/instructions/index.js';
import { assertPackageRelativePath } from './package-scanner.js';

export interface WorkflowClientResource {
  readonly id: string;
  readonly source: string;
  readonly file: string;
}

export interface WorkflowClientResourceContributor {
  collectClientResources(
    node: NodeSourceAst,
  ): readonly Pick<WorkflowClientResource, 'id' | 'source'>[];
}

export async function collectWorkflowClientResources(
  root: string,
  ast: WorkflowSourceAst,
  instructions: ReadonlyMap<string, WorkflowInstructionClass> = new Map(),
): Promise<readonly WorkflowClientResource[]> {
  const declared: Array<Pick<WorkflowClientResource, 'id' | 'source'>> = [];
  if (ast.client?.inputForm)
    declared.push({ id: 'workflow.inputForm', source: ast.client.inputForm });
  if (ast.client?.parameterForm)
    declared.push({
      id: 'workflow.parameterForm',
      source: ast.client.parameterForm,
    });
  const visit = (nodes: readonly NodeSourceAst[]): void => {
    for (const node of nodes) {
      const instruction = instructions.get(node.type) as
        | (WorkflowInstructionClass &
            Partial<WorkflowClientResourceContributor>)
        | undefined;
      for (const resource of instruction?.collectClientResources?.(node) ??
        []) {
        declared.push({
          id: `node.${node.key}.${resource.id}`,
          source: resource.source,
        });
      }
      for (const branch of Object.values(node.branches ?? {})) visit(branch);
    }
  };
  visit(ast.nodes);
  const clientRoot = await fs
    .realpath(path.join(root, 'client'))
    .catch(() => path.resolve(root, 'client'));
  const ids = new Set<string>();
  const resources: WorkflowClientResource[] = [];
  for (const resource of declared) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(resource.id) ||
      ids.has(resource.id)
    )
      throw new Error(
        `Duplicate or invalid workflow client resource id: ${resource.id}`,
      );
    ids.add(resource.id);
    const source = assertPackageRelativePath(resource.source);
    if (!source.startsWith('client/'))
      throw new Error(
        `Workflow client resource ${resource.id} must be inside client/: ${source}`,
      );
    const candidate = path.resolve(root, source);
    const file = await Promise.any(
      ['', '.ts', '.tsx'].map(async (extension) => {
        const found = `${candidate}${extension}`;
        const stat = await fs.stat(found);
        if (!stat.isFile()) throw new Error('not a file');
        return found;
      }),
    ).catch(() => {
      throw new Error(
        `Workflow client resource ${resource.id} was not found: ${source}`,
      );
    });
    const real = await fs.realpath(file);
    if (!real.startsWith(`${clientRoot}${path.sep}`))
      throw new Error(
        `Workflow client resource ${resource.id} escapes client/: ${source}`,
      );
    const contents = await fs.readFile(real, 'utf8');
    if (!/export\s+default\s+|export\s*\{[^}]*\bdefault\b/s.test(contents))
      throw new Error(
        `Workflow client resource ${resource.id} must have a default export: ${source}`,
      );
    resources.push({ ...resource, file: real });
  }
  return resources;
}
