import { validateWorkflowOptions } from '../shared/options.js';
import type { WorkflowSourceAst } from '../dsl/definition.js';

import {
  normalizeWorkflowParameterSchema,
  type WorkflowParameterSchema,
} from '../shared/parameters.js';
import type { WorkflowSourceIssue } from './source-issues.js';
import { validateWorkflowInputSchema } from '../server/engine/invocation.js';
import {
  resolveNodeResultSchema,
  validateNodeResultReference,
  validateNodeResultSchema,
  visitNodeResultScopes,
  type NodeResultScope,
  type WorkflowSourceContracts,
  type WorkflowSourceRuntimeContracts,
} from '../server/engine/node-results.js';

const NODE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const BRANCH_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export type {
  WorkflowNodeSourceContract,
  WorkflowSourceContracts,
  WorkflowSourceRuntimeContracts,
} from '../server/engine/node-results.js';

type TemplateParameter = { key: string; defaultValue?: string };

function templateParameters(value: unknown): TemplateParameter[] {
  if (typeof value === 'string') {
    return [...value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((match) => {
      const expression = match[1].trim();
      const separator = expression.indexOf(':');
      return {
        key: separator < 0 ? expression : expression.slice(0, separator).trim(),
        ...(separator < 0
          ? {}
          : { defaultValue: expression.slice(separator + 1) }),
      };
    });
  }
  if (Array.isArray(value)) return value.flatMap(templateParameters);
  if (value !== null && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => [
      ...templateParameters(key),
      ...templateParameters(item),
    ]);
  return [];
}

function issue(
  file: string,
  phase: 'schema' | 'semantic',
  code: string,
  message: string,
  astPath: string,
  contractType: string,
  nodeKey?: string,
): WorkflowSourceIssue {
  return {
    phase,
    code,
    message,
    file,
    astPath,
    contractType,
    ...(nodeKey === undefined ? {} : { nodeKey }),
  };
}

export function validateWorkflowSourceAst(
  ast: WorkflowSourceAst,
  file: string,
  contracts: WorkflowSourceContracts | WorkflowSourceRuntimeContracts,
): WorkflowSourceIssue[] {
  const issues: WorkflowSourceIssue[] = validateWorkflowOptions(
    ast.options,
  ).map(({ path, message }) =>
    issue(
      file,
      'schema',
      'INVALID_WORKFLOW_OPTIONS',
      message,
      path,
      'WorkflowOptions',
      'workflow',
    ),
  );
  const parameterForm = ast.client?.parameterForm;
  const inputForm = ast.client?.inputForm;
  if (ast.client !== undefined) {
    if (
      typeof ast.client !== 'object' ||
      ast.client === null ||
      Object.keys(ast.client).some(
        (key) => key !== 'parameterForm' && key !== 'inputForm',
      )
    ) {
      issues.push(
        issue(
          file,
          'schema',
          'INVALID_CLIENT_DECLARATION',
          'workflow.client only accepts inputForm and parameterForm',
          'workflow.client',
          'WorkflowClientSource',
          'workflow',
        ),
      );
    }
    if (parameterForm !== undefined && typeof parameterForm !== 'string') {
      issues.push(
        issue(
          file,
          'schema',
          'INVALID_CLIENT_PARAMETER_FORM',
          'workflow.client.parameterForm must be a static string',
          'workflow.client.parameterForm',
          'WorkflowClientSource',
          'workflow',
        ),
      );
    } else if (
      typeof parameterForm === 'string' &&
      (parameterForm.startsWith('/') ||
        parameterForm.includes('\\') ||
        parameterForm.split('/').includes('..') ||
        !parameterForm.startsWith('./'))
    ) {
      issues.push(
        issue(
          file,
          'semantic',
          'INVALID_CLIENT_PARAMETER_FORM_PATH',
          'workflow.client.parameterForm must be a relative path without traversal',
          'workflow.client.parameterForm',
          'WorkflowClientSource',
          'workflow',
        ),
      );
    }
  }
  if (inputForm !== undefined && typeof inputForm !== 'string') {
    issues.push(
      issue(
        file,
        'schema',
        'INVALID_CLIENT_INPUT_FORM',
        'workflow.client.inputForm must be a static string',
        'workflow.client.inputForm',
        'WorkflowClientSource',
        'workflow',
      ),
    );
  } else if (
    typeof inputForm === 'string' &&
    (inputForm.startsWith('/') ||
      inputForm.includes('\\') ||
      inputForm.split('/').includes('..') ||
      !inputForm.startsWith('./'))
  ) {
    issues.push(
      issue(
        file,
        'semantic',
        'INVALID_CLIENT_INPUT_FORM_PATH',
        'workflow.client.inputForm must be a relative path without traversal',
        'workflow.client.inputForm',
        'WorkflowClientSource',
        'workflow',
      ),
    );
  }
  for (const schemaIssue of validateWorkflowInputSchema(ast.inputSchema)
    .issues) {
    issues.push(
      issue(
        file,
        'schema',
        'INVALID_INPUT_SCHEMA',
        schemaIssue.message,
        `workflow.inputSchema${schemaIssue.path.slice(1)}`,
        'WorkflowInputSchema',
        'workflow',
      ),
    );
  }
  let parameters: WorkflowParameterSchema = {};
  try {
    parameters = normalizeWorkflowParameterSchema(
      ast.parameters,
      'workflow.parameters',
    );
  } catch (error) {
    issues.push(
      issue(
        file,
        'schema',
        'INVALID_INPUT_SCHEMA',
        error instanceof Error ? error.message : String(error),
        'workflow.parameters',
        'WorkflowParameterSchema',
        'workflow',
      ),
    );
  }
  const keys = new Set<string>();
  const resultScopes = new Map<
    WorkflowSourceAst['nodes'][number],
    NodeResultScope
  >();
  visitNodeResultScopes(ast, contracts, (node, scope): void => {
    resultScopes.set(node, scope);
  });
  const visit = (nodes: WorkflowSourceAst['nodes'], basePath: string): void => {
    nodes.forEach((node, index) => {
      const astPath = `${basePath}[${index}]`;
      if (!NODE_KEY_PATTERN.test(node.key) || FORBIDDEN_KEYS.has(node.key))
        issues.push(
          issue(
            file,
            'semantic',
            'INVALID_NODE_KEY',
            `Node key must match ${NODE_KEY_PATTERN.source} and must not be a reserved object key`,
            astPath,
            node.type,
            node.key,
          ),
        );
      if (keys.has(node.key))
        issues.push(
          issue(
            file,
            'semantic',
            'DUPLICATE_NODE_KEY',
            `Node key "${node.key}" is used more than once`,
            astPath,
            node.type,
            node.key,
          ),
        );
      keys.add(node.key);
      const contract =
        'instructions' in contracts
          ? contracts.instructions.get(node.type)
          : contracts.nodes.get(node.type);
      if (!contract) {
        issues.push(
          issue(
            file,
            'semantic',
            'UNREGISTERED_NODE_TYPE',
            `Node type "${node.type}" is not registered by this application`,
            astPath,
            node.type,
            node.key,
          ),
        );
      } else {
        const errors = contract.validateConfig(node.config);
        if (Array.isArray(errors)) {
          for (const configIssue of errors)
            issues.push(
              issue(
                file,
                'schema',
                'INVALID_NODE_CONFIG',
                configIssue.message,
                `${astPath}.${configIssue.path}`,
                node.type,
                node.key,
              ),
            );
        } else {
          for (const [path, message] of Object.entries(errors ?? {}))
            issues.push(
              issue(
                file,
                'schema',
                'INVALID_NODE_CONFIG',
                String(message),
                `${astPath}.config.${path}`,
                node.type,
                node.key,
              ),
            );
        }
      }
      const effectiveResult = resolveNodeResultSchema(node, contract);
      if (effectiveResult !== null) {
        for (const schemaIssue of validateNodeResultSchema(effectiveResult)) {
          issues.push(
            issue(
              file,
              'schema',
              'INVALID_NODE_RESULT_SCHEMA',
              schemaIssue.message,
              `${astPath}.${schemaIssue.path}`,
              node.type,
              node.key,
            ),
          );
        }
      }
      for (const parameter of templateParameters(node.config)) {
        if (parameter.key.startsWith('$nodeResults')) {
          const referenceIssue = validateNodeResultReference(
            parameter.key,
            resultScopes.get(node) ?? new Map(),
          );
          if (referenceIssue)
            issues.push(
              issue(
                file,
                'semantic',
                referenceIssue.code,
                referenceIssue.message,
                `${astPath}.config`,
                node.type,
                node.key,
              ),
            );
          continue;
        }
        if (!parameter.key.includes('$parameters')) continue;
        const match = /^\$parameters\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(
          parameter.key,
        );
        const message =
          parameter.defaultValue !== undefined
            ? `Workflow parameter reference "${parameter.key}" cannot have an inline default`
            : !match
              ? `Invalid workflow parameter reference "${parameter.key}"`
              : !Object.hasOwn(parameters, match[1])
                ? `Workflow parameter "${match[1]}" is not declared`
                : null;
        if (message)
          issues.push(
            issue(
              file,
              'semantic',
              'INVALID_INPUT_REFERENCE',
              message,
              `${astPath}.config`,
              node.type,
              node.key,
            ),
          );
      }
      for (const [branchKey, branch] of Object.entries(node.branches ?? {})) {
        if (
          !BRANCH_KEY_PATTERN.test(branchKey) ||
          FORBIDDEN_KEYS.has(branchKey)
        )
          issues.push(
            issue(
              file,
              'semantic',
              'INVALID_BRANCH_KEY',
              `Branch key "${branchKey}" is unsafe`,
              `${astPath}.branches.${branchKey}`,
              node.type,
              node.key,
            ),
          );
        visit(branch, `${astPath}.branches.${branchKey}`);
      }
      if (contract && 'branches' in contract) {
        const allowed =
          typeof contract.branches === 'function'
            ? contract.branches(node.config as never)
            : contract.branches;
        for (const branchKey of Object.keys(node.branches ?? {})) {
          if (allowed === null || !allowed.includes(branchKey)) {
            issues.push(
              issue(
                file,
                'semantic',
                'INVALID_BRANCH_KEY',
                `Branch "${branchKey}" is not declared by node contract "${node.type}"`,
                `${astPath}.branches.${branchKey}`,
                node.type,
                node.key,
              ),
            );
          }
        }
      }
    });
  };
  visit(ast.nodes, 'workflow.nodes');
  return issues;
}
