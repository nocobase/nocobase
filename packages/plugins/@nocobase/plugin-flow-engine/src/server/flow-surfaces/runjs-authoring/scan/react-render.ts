/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AstCtxRenderCall,
  AstFunctionBinding,
  AstIdentifierBinding,
  CtxMethodAlias,
  ReactCreateElementAlias,
  RunJsAstInspection,
} from '../internal-types';
import { walkAstAncestor } from '../ast/walk';
import {
  dedupeIndexedEntries,
  isAstAlwaysExecutedInCurrentExecutionScope,
  isAstFunctionLike,
  unwrapAstChainExpression,
} from '../ast/bindings';
import { hasAstShadowBinding, resolveAstAliasBinding, resolveCtxMethodCall } from '../ast/static-values';
import { getReactCreateElementCallCapabilityFromAst } from './react';

export function collectAstReactComponentCtxRenderCallsFromAst(
  renderCalls: AstCtxRenderCall[],
  ctxMethodAliases: CtxMethodAlias[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
): RunJsAstInspection['reactComponentCtxRenderCalls'] {
  if (!renderCalls.length) {
    return [];
  }

  const entries: RunJsAstInspection['reactComponentCtxRenderCalls'] = [];
  const pending = renderCalls.flatMap((call) =>
    collectAstReactComponentUsagesFromRenderCall(call, reactCreateElementAliases, identifierBindings, functionBindings),
  );
  const visitedComponents = new Set<string>();

  while (pending.length) {
    const usage = pending.shift();
    if (!usage) {
      continue;
    }
    const componentKey = `${usage.functionBinding.name}:${usage.functionBinding.declarationStart}`;
    if (visitedComponents.has(componentKey)) {
      continue;
    }
    visitedComponents.add(componentKey);

    const renderCall = findCtxRenderCallInFunction(
      usage.functionBinding.functionNode,
      ctxMethodAliases,
      identifierBindings,
      functionBindings,
      { bindingMode: 'lexical' },
    );
    if (!renderCall) {
      pending.push(
        ...collectAstReactComponentUsagesOnFunctionRenderPath(
          usage.functionBinding.functionNode,
          reactCreateElementAliases,
          identifierBindings,
          functionBindings,
        ),
      );
      continue;
    }
    entries.push({
      capability: renderCall.capability,
      component: usage.functionBinding.name,
      index: renderCall.index,
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectAstReactComponentUsagesFromRenderCall(
  renderCall: AstCtxRenderCall,
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
) {
  const usages = collectAstReactComponentUsagesFromNodes(
    renderCall.args,
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
  );

  renderCall.args.forEach((arg) => {
    walkAstAncestor(arg, {
      CallExpression(node: any) {
        const callee = unwrapAstChainExpression(node.callee);
        if (callee?.type !== 'Identifier') {
          return;
        }
        const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
          bindingMode: 'initialized',
          initializedIndex: renderCall.index,
        });
        if (!helper) {
          return;
        }
        usages.push(
          ...collectAstReactComponentUsagesOnFunctionRenderPath(
            helper.functionNode,
            reactCreateElementAliases,
            identifierBindings,
            functionBindings,
          ),
        );
      },
    });
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

export function collectAstReactComponentUsagesFromNodes(
  nodes: any[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: { nearestFunction?: any } = {},
) {
  const usages: Array<{ functionBinding: AstFunctionBinding; index: number }> = [];
  const addUsage = (name: string | undefined, index: number) => {
    if (!name || !/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const functionBinding = resolveAstFunctionBinding(name, index, functionBindings, identifierBindings, {
      bindingMode: 'lexical',
    });
    if (functionBinding) {
      usages.push({ functionBinding, index });
    }
  };

  nodes.forEach((rootNode) => {
    if (!rootNode) {
      return;
    }
    walkAstAncestor(rootNode, {
      JSXOpeningElement(node: any, ancestors: any[]) {
        if (options.nearestFunction && findNearestAstFunctionAncestor(ancestors) !== options.nearestFunction) {
          return;
        }
        addUsage(getAstJSXIdentifierName(node.name), node.start || 0);
      },
      CallExpression(node: any, ancestors: any[]) {
        if (options.nearestFunction && findNearestAstFunctionAncestor(ancestors) !== options.nearestFunction) {
          return;
        }
        if (!getReactCreateElementCallCapabilityFromAst(node, reactCreateElementAliases, identifierBindings)) {
          return;
        }
        const component = unwrapAstChainExpression(node.arguments?.[0]);
        if (component?.type === 'Identifier') {
          addUsage(component.name, component.start || node.start || 0);
        }
      },
    });
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

export function collectAstReactComponentUsagesOnFunctionRenderPath(
  functionNode: any,
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  visited: Set<any> = new Set<any>(),
) {
  if (visited.has(functionNode)) {
    return [];
  }
  visited.add(functionNode);
  const usages = collectAstReactComponentUsagesFromNodes(
    [functionNode],
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
    { nearestFunction: functionNode },
  );

  walkAstAncestor(functionNode, {
    CallExpression(node: any, ancestors: any[]) {
      const nearestFunction = findNearestAstFunctionAncestor(ancestors);
      if (nearestFunction !== functionNode) {
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
        bindingMode: 'lexical',
      });
      if (!helper) {
        return;
      }
      usages.push(
        ...collectAstReactComponentUsagesOnFunctionRenderPath(
          helper.functionNode,
          reactCreateElementAliases,
          identifierBindings,
          functionBindings,
          visited,
        ),
      );
    },
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

export function collectAstTopLevelReachableCtxRenderCallsFromAst(
  ast: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
): AstCtxRenderCall[] {
  const entries: AstCtxRenderCall[] = [];
  walkAstAncestor(ast, {
    CallExpression(node: any, ancestors: any[]) {
      if (findNearestAstFunctionAncestor(ancestors)) {
        return;
      }
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'render') {
        entries.push({
          args: [...(node.arguments || [])],
          capability: method.capability,
          index: node.start || 0,
        });
        return;
      }
      if (!functionBindings.length) {
        return;
      }
      if (!isAstAlwaysExecutedInCurrentExecutionScope(ancestors)) {
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings);
      if (!helper) {
        return;
      }
      const helperRenderCalls = collectCtxRenderCallsInFunction(
        helper.functionNode,
        ctxMethodAliases,
        identifierBindings,
        functionBindings,
        {
          bindingMode: 'initialized',
          initializedIndex: node.start || 0,
        },
      );
      helperRenderCalls.forEach((renderCall) => {
        entries.push({
          ...renderCall,
          index: node.start || renderCall.index,
        });
      });
    },
  });

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function getAstJSXIdentifierName(node: any): string | undefined {
  if (node?.type === 'JSXIdentifier') {
    return node.name;
  }
  return undefined;
}

export function findNearestAstFunctionAncestor(ancestors: any[]) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (isAstFunctionLike(ancestors[index])) {
      return ancestors[index];
    }
  }
  return undefined;
}

export function collectCtxRenderCallsInFunction(
  functionNode: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: {
    bindingMode: 'initialized' | 'lexical' | 'source';
    initializedIndex?: number;
  },
  visited: Set<any> = new Set<any>(),
): AstCtxRenderCall[] {
  if (visited.has(functionNode)) {
    return [];
  }
  visited.add(functionNode);
  const renderCalls: AstCtxRenderCall[] = [];
  walkAstAncestor(functionNode, {
    CallExpression(node: any, ancestors: any[]) {
      const nearestFunction = findNearestAstFunctionAncestor(ancestors);
      if (nearestFunction !== functionNode) {
        return;
      }
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'render') {
        renderCalls.push({
          args: [...(node.arguments || [])],
          capability: method.capability,
          index: node.start || 0,
        });
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
        bindingMode: options.bindingMode,
        initializedIndex: options.initializedIndex,
        currentFunctionNode: functionNode,
      });
      if (!helper) {
        return;
      }
      renderCalls.push(
        ...collectCtxRenderCallsInFunction(
          helper.functionNode,
          ctxMethodAliases,
          identifierBindings,
          functionBindings,
          options,
          visited,
        ),
      );
    },
  });
  return renderCalls;
}

export function findCtxRenderCallInFunction(
  functionNode: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: {
    bindingMode: 'initialized' | 'lexical' | 'source';
    initializedIndex?: number;
  },
): AstCtxRenderCall | undefined {
  return collectCtxRenderCallsInFunction(
    functionNode,
    ctxMethodAliases,
    identifierBindings,
    functionBindings,
    options,
  )[0];
}

export function resolveAstFunctionBinding(
  name: string,
  index: number,
  functionBindings: AstFunctionBinding[],
  identifierBindings: AstIdentifierBinding[],
  options: {
    bindingMode?: 'initialized' | 'lexical' | 'source';
    currentFunctionNode?: any;
    initializedIndex?: number;
  } = {},
) {
  if (options.bindingMode === 'lexical' || options.bindingMode === 'initialized') {
    const candidates = functionBindings
      .filter((entry) => entry.name === name && index >= entry.scopeStart && index < entry.end)
      .filter((entry) => {
        if (options.bindingMode !== 'initialized') {
          return true;
        }
        const initializedIndex = isAstFunctionBindingScopedInsideNode(entry, options.currentFunctionNode)
          ? index
          : options.initializedIndex ?? index;
        return entry.hoisted || entry.declarationStart <= initializedIndex;
      })
      .sort((left, right) => right.scopeStart - left.scopeStart || right.declarationStart - left.declarationStart);
    return candidates.find(
      (entry) =>
        !hasAstShadowBinding(
          name,
          index,
          {
            start: entry.scopeStart,
            end: entry.end,
          },
          identifierBindings,
        ),
    );
  }
  return resolveAstAliasBinding(name, index, functionBindings, identifierBindings);
}

export function isAstFunctionBindingScopedInsideNode(entry: AstFunctionBinding, node: any) {
  return (
    typeof node?.start === 'number' &&
    typeof node?.end === 'number' &&
    entry.scopeStart >= node.start &&
    entry.end <= node.end
  );
}

export function dedupeAstFunctionUsageEntries(entries: Array<{ functionBinding: AstFunctionBinding; index: number }>) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.functionBinding.name}:${entry.functionBinding.declarationStart}:${entry.index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
