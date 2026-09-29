import { describe, expect, it } from 'vitest';

import {
  getAvailableNodeResults,
  getAvailableNodeResultsAt,
  validateNodeResultReference,
  validateNodeResultSchema,
} from '../server/engine/node-results.js';
import { ConditionInstruction } from '../server/instructions/condition/instruction.js';
import { RunInstruction } from '../server/instructions/index.js';
import { defineWorkflow } from '../dsl/definition.js';
import type {
  NodeResultSchema,
  WorkflowSourceAst,
} from '../server/instructions/types.js';
import { compileWorkflowSource } from '../build/source-compiler.js';
import {
  validateWorkflowSourceAst,
  type WorkflowSourceContracts,
} from '../build/source-validator.js';

const contracts: WorkflowSourceContracts = {
  nodes: new Map([
    ['condition', ConditionInstruction],
    ['run', RunInstruction],
  ]),
};
const objectResult: NodeResultSchema = {
  type: 'object',
  required: ['value'],
  properties: {
    value: { type: 'number' },
    nested: { type: 'object', properties: { name: { type: 'string' } } },
  },
};

function issues(
  ast: WorkflowSourceAst,
): ReturnType<typeof validateWorkflowSourceAst> {
  return validateWorkflowSourceAst(ast, 'workflow.ts', contracts);
}

describe('workflow node result schemas', () => {
  it('preserves source declarations and resolves instance, class, and null precedence into Flat IR', () => {
    const ast = defineWorkflow({
      title: 'results',
      nodes: [
        ConditionInstruction.create({ key: 'defaulted', config: {} }),
        ConditionInstruction.create({
          key: 'overridden',
          result: { type: 'string' },
          config: {},
        }),
        ConditionInstruction.create({
          key: 'disabled',
          result: null,
          config: {},
        }),
        RunInstruction.create({
          key: 'undeclared',
          config: { module: './x' },
        }),
      ],
    });
    expect(ast.nodes.map((node) => node.result)).toEqual([
      undefined,
      { type: 'string' },
      null,
      undefined,
    ]);
    expect(
      compileWorkflowSource(ast, 'workflow.ts', contracts).nodes.map(
        (node) => node.result,
      ),
    ).toEqual([
      { type: 'boolean', description: 'The evaluated condition result.' },
      { type: 'string' },
      undefined,
      undefined,
    ]);
  });

  it('applies AST scopes to prior, branch-owner, sibling, downstream, self, and branch-leak references', () => {
    const ast = defineWorkflow({
      title: 'scope',
      nodes: [
        RunInstruction.create({
          key: 'first',
          result: objectResult,
          config: { module: './x' },
        }),
        ConditionInstruction.create({
          key: 'owner',
          config: { module: './condition' },
        }).branch({
          yes: [
            RunInstruction.create({
              key: 'inside',
              result: objectResult,
              config: {
                module: './x',
                args: {
                  owner: '{{$nodeResults.owner}}',
                  first: '{{$nodeResults.first.nested.name}}',
                },
              },
            }),
            ConditionInstruction.create({
              key: 'nestedOwner',
              config: {},
            }).branch({
              yes: [
                RunInstruction.create({
                  key: 'nested',
                  config: {
                    module: './x',
                    args: {
                      inherited: '{{$nodeResults.inside.value}}',
                      owner: '{{$nodeResults.nestedOwner}}',
                    },
                  },
                }),
              ],
            }),
            RunInstruction.create({
              key: 'laterInside',
              config: {
                module: './x',
                args: {
                  value: '{{$nodeResults.inside.value}}',
                  hiddenNested: '{{$nodeResults.nested.value}}',
                },
              },
            }),
          ],
          no: [
            RunInstruction.create({
              key: 'sibling',
              config: {
                module: './x',
                args: { invalid: '{{$nodeResults.inside.value}}' },
              },
            }),
          ],
        }),
        RunInstruction.create({
          key: 'after',
          config: {
            module: './x',
            args: {
              leaked: '{{$nodeResults.inside.value}}',
              future: '{{$nodeResults.last.value}}',
            },
          },
        }),
        RunInstruction.create({
          key: 'last',
          result: objectResult,
          config: {
            module: './x',
            args: { self: '{{$nodeResults.last.value}}' },
          },
        }),
      ],
    });
    expect(
      issues(ast)
        .filter((item) => item.code === 'NODE_RESULT_NOT_VISIBLE')
        .map((item) => item.nodeKey),
    ).toEqual(['sibling', 'laterInside', 'after', 'after', 'last']);
    expect(
      getAvailableNodeResults(ast, 'inside', contracts).map(
        (item) => item.nodeKey,
      ),
    ).toEqual(['first', 'owner']);
    expect(
      getAvailableNodeResults(ast, 'after', contracts).map(
        (item) => item.nodeKey,
      ),
    ).toEqual(['first', 'owner']);
    expect(
      getAvailableNodeResultsAt(
        ast,
        { parentNodeKey: 'owner', branchKey: 'yes', index: 1 },
        contracts,
      ).map((item) => item.nodeKey),
    ).toEqual(['first', 'owner', 'inside']);
  });

  it('checks object, array, additionalProperties, primitive access, and every union branch', () => {
    const scope = new Map<string, NodeResultSchema>([
      [
        'complex',
        {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: { type: 'object', properties: { id: { type: 'number' } } },
            },
            open: {
              type: 'object',
              properties: {},
              additionalProperties: true,
            },
            typed: {
              type: 'object',
              properties: {},
              additionalProperties: {
                type: 'object',
                properties: { id: { type: 'string' } },
              },
            },
            choice: {
              oneOf: [
                { type: 'object', properties: { shared: { type: 'string' } } },
                {
                  type: 'object',
                  properties: {
                    shared: { type: 'string' },
                    only: { type: 'number' },
                  },
                },
              ],
            },
            anyChoice: {
              anyOf: [
                { type: 'object', properties: { shared: { type: 'string' } } },
                {
                  type: 'object',
                  properties: {
                    shared: { type: 'string' },
                    only: { type: 'number' },
                  },
                },
              ],
            },
            scalar: { type: 'boolean' },
          },
        },
      ],
    ]);
    expect(
      validateNodeResultReference('nodeResults.complex.list.0.id', scope),
    ).toBeNull();
    expect(
      validateNodeResultReference('nodeResults.complex.typed.any.id', scope),
    ).toBeNull();
    expect(
      validateNodeResultReference('nodeResults.complex.choice.shared', scope),
    ).toBeNull();
    expect(
      validateNodeResultReference(
        'nodeResults.complex.anyChoice.shared',
        scope,
      ),
    ).toBeNull();
    expect(
      validateNodeResultReference('nodeResults.complex.list.first.id', scope)
        ?.code,
    ).toBe('INVALID_NODE_RESULT_ACCESS');
    expect(
      validateNodeResultReference('nodeResults.complex.open.any.deep', scope)
        ?.code,
    ).toBe('INVALID_NODE_RESULT_ACCESS');
    expect(
      validateNodeResultReference('nodeResults.complex.choice.only', scope)
        ?.code,
    ).toBe('INVALID_NODE_RESULT_PATH');
    expect(
      validateNodeResultReference('nodeResults.complex.anyChoice.only', scope)
        ?.code,
    ).toBe('INVALID_NODE_RESULT_PATH');
    expect(
      validateNodeResultReference('nodeResults.complex.scalar.value', scope)
        ?.code,
    ).toBe('INVALID_NODE_RESULT_ACCESS');
  });

  it('reports malformed schemas with deterministic paths', () => {
    expect(
      validateNodeResultSchema({
        type: 'object',
        properties: { ok: { type: 'string' } },
        required: ['missing'],
        extra: true,
      }),
    ).toEqual([
      {
        path: 'result.required',
        message: 'Required property "missing" is not declared',
      },
      {
        path: 'result.extra',
        message: 'Unsupported node result schema field "extra"',
      },
    ]);
  });
});
