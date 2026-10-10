import { expect, it } from 'vitest';
import { workflow, type WorkflowOptions } from '../index.js';
import { defineWorkflow, restoreFromFlatIr } from '../dsl/definition.js';
import { validateWorkflowSourceAst } from '../build/source-validator.js';
import { buildWorkflowArtifact } from '../build/artifact-builder.js';

it('preserves static options through the builder, AST, IR and artifact', () => {
  const options: WorkflowOptions = { timeout: 0.5, stackLimit: 3 };
  const flow = workflow({ key: 'options', title: 'Options', options });
  const ast = flow.finalize();
  const ir = flow.compile();
  expect(ast.options).toEqual(options);
  expect(ir.options).toEqual(options);
  expect(restoreFromFlatIr(ir).options).toEqual(options);
  const artifact = buildWorkflowArtifact({ key: flow.key, flatIr: ir });
  expect(JSON.parse(String(artifact.files.get('workflow.json')))).toMatchObject(
    { options },
  );
});

it('preserves omitted settings and explicit zero limits', () => {
  expect(
    workflow({ key: 'default', title: 'Default' }).compile(),
  ).not.toHaveProperty('options');
  expect(
    workflow({
      key: 'zero',
      title: 'Zero',
      options: { timeout: 0, stackLimit: 0 },
    }).compile().options,
  ).toEqual({ timeout: 0, stackLimit: 0 });
});

it.each([
  [null, 'workflow.options'],
  [[], 'workflow.options'],
  [{ timeout: -1 }, 'workflow.options.timeout'],
  [{ timeout: Infinity }, 'workflow.options.timeout'],
  [{ timeout: '60' }, 'workflow.options.timeout'],
  [{ stackLimit: -1 }, 'workflow.options.stackLimit'],
  [{ stackLimit: 1.5 }, 'workflow.options.stackLimit'],
  [{ stackLimit: NaN }, 'workflow.options.stackLimit'],
  [{ unknown: 1 }, 'workflow.options.unknown'],
])(
  'rejects invalid options %j in both authoring and evaluated source validation',
  (options, path) => {
    const typed = options as WorkflowOptions;
    expect(() =>
      workflow({ key: 'invalid', title: 'Invalid', options: typed }).finalize(),
    ).toThrow(String(path));
    expect(() =>
      defineWorkflow({ title: 'Invalid', options: typed, nodes: [] }),
    ).toThrow(String(path));
    expect(
      validateWorkflowSourceAst(
        {
          title: 'Invalid',
          inputSchema: { type: 'object' },
          nodes: [],
          options: typed,
        },
        'workflow.ts',
        { nodes: new Map() },
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: 'INVALID_WORKFLOW_OPTIONS',
        astPath: path,
      }),
    );
  },
);
