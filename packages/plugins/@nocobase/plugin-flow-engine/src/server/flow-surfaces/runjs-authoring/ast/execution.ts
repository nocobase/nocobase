/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AstCapabilityAlias, AstIdentifierBinding, AstIdentifierWrite, SourceRange } from '../internal-types';
import { AST_DYNAMIC_MEMBER_ALIAS } from '../internal-types';
import { walkAstAncestor } from './walk';
import {
  getAstExecutionScopeRange,
  isAstAlwaysExecutedInCurrentExecutionScope,
  isAstDefinitelyNonEmptyForInSource,
  isAstDefinitelyNonEmptyForOfSource,
  isAstFunctionLike,
  unwrapAstChainExpression,
} from './bindings';
import {
  collectAstArrayRestCarrierSourceTargets,
  collectAstObjectRestCarrierSourceTargets,
  collectAstPatternBindingIdentifiers,
  collectAstPatternCarrierSourceTargets,
  collectAstPatternCarrierSourceTargetsFromSourceTarget,
  collectAstPatternMemberExpressions,
  collectAstPatternRestCarrierSourceTargets,
  collectAstRestCarrierAliasCopies,
  createAstFallbackSourceTarget,
  createAstPatternSourceTarget,
  getAstMemberWriteLookup,
  getAstPatternMemberSourceTarget,
  isAstCtxApiAliasAssignmentOperator,
  isAstDefiniteAssignmentOperator,
} from './static-values';

export function collectAstIdentifierWritesFromAst(ast: any, source: string): AstIdentifierWrite[] {
  const writes: AstIdentifierWrite[] = [];
  const addLoopHeaderWrites = (target: any, ancestors: any[], fallbackIndex: number) => {
    const writeContext = getAstWriteExecutionContext(ancestors, source.length);
    collectAstPatternBindingIdentifiers(target, (name, bindingNode) => {
      writes.push({
        alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
        executionScope: writeContext.executionScope,
        name,
        index: typeof bindingNode?.start === 'number' ? bindingNode.start : fallbackIndex,
      });
    });
    collectAstPatternMemberExpressions(target, (memberNode) => {
      const memberWrite = getAstMemberWriteLookup(memberNode);
      if (!memberWrite) {
        return;
      }
      writes.push({
        alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
        executionScope: writeContext.executionScope,
        name: memberWrite.aliasName,
        index: memberWrite.index,
      });
    });
  };
  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstDefiniteAssignmentOperator(node.operator)) {
        return;
      }
      const writeContext = getAstWriteExecutionContext(ancestors, source.length);
      collectAstPatternBindingIdentifiers(node.left, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
          executionScope: writeContext.executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.start || 0,
        });
      });
      collectAstPatternMemberExpressions(node.left, (memberNode) => {
        const memberWrite = getAstMemberWriteLookup(memberNode);
        if (!memberWrite) {
          return;
        }
        writes.push({
          alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
          executionScope: writeContext.executionScope,
          name: memberWrite.aliasName,
          index: memberWrite.index,
        });
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (!node.init) {
        return;
      }
      const writeContext = getAstWriteExecutionContext(ancestors, source.length);
      collectAstPatternBindingIdentifiers(node.id, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
          executionScope: writeContext.executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.start || 0,
        });
      });
    },
    UpdateExpression(node: any, ancestors: any[]) {
      const writeContext = getAstWriteExecutionContext(ancestors, source.length);
      if (node.argument?.type === 'Identifier') {
        writes.push({
          alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
          executionScope: writeContext.executionScope,
          name: node.argument.name,
          index: typeof node.argument.start === 'number' ? node.argument.start : node.start || 0,
        });
      }
      collectAstPatternMemberExpressions(node.argument, (memberNode) => {
        const memberWrite = getAstMemberWriteLookup(memberNode);
        if (!memberWrite) {
          return;
        }
        writes.push({
          alwaysRunsInExecutionScope: writeContext.alwaysRunsInExecutionScope,
          executionScope: writeContext.executionScope,
          name: memberWrite.aliasName,
          index: memberWrite.index,
        });
      });
    },
    ForInStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForInSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      addLoopHeaderWrites(node.left, ancestors, node.left?.start || node.start || 0);
    },
    ForOfStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForOfSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      addLoopHeaderWrites(node.left, ancestors, node.left?.start || node.start || 0);
    },
  });
  return writes;
}

export function getAstWriteExecutionContext(
  ancestors: any[],
  sourceLength: number,
): { alwaysRunsInExecutionScope: boolean; executionScope: SourceRange } {
  const iifeFunctionIndex = findAstInnermostSynchronousIifeFunctionAncestorIndex(ancestors);
  if (iifeFunctionIndex > 0) {
    const callAncestors = ancestors.slice(0, iifeFunctionIndex);
    return {
      alwaysRunsInExecutionScope: isAstAlwaysExecutedInCurrentExecutionScope(callAncestors),
      executionScope: getAstExecutionScopeRange(callAncestors.slice(0, -1), sourceLength),
    };
  }
  return {
    alwaysRunsInExecutionScope: isAstAlwaysExecutedInCurrentExecutionScope(ancestors),
    executionScope: getAstExecutionScopeRange(ancestors, sourceLength),
  };
}

export function findAstInnermostSynchronousIifeFunctionAncestorIndex(ancestors: any[]) {
  for (let index = ancestors.length - 1; index > 0; index -= 1) {
    const node = ancestors[index];
    if (!isAstFunctionLike(node) || node.async) {
      continue;
    }
    const parent = ancestors[index - 1];
    if (parent?.type === 'CallExpression' && unwrapAstChainExpression(parent.callee) === node) {
      return index;
    }
  }
  return -1;
}

export function getAstLoopPatternTarget(left: any) {
  if (left?.type === 'VariableDeclaration') {
    return left.declarations?.length === 1 ? left.declarations[0]?.id : undefined;
  }
  return left;
}

export function isAstForOfLoopVariableDeclaratorWithSourceTargets<T extends AstCapabilityAlias>(
  node: any,
  ancestors: any[],
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const declaration = ancestors[ancestors.length - 2];
  const loop = ancestors[ancestors.length - 3];
  return (
    declaration?.type === 'VariableDeclaration' &&
    loop?.type === 'ForOfStatement' &&
    loop.left === declaration &&
    declaration.declarations?.length === 1 &&
    declaration.declarations[0] === node &&
    hasAstForOfSourceTargets(loop.right, aliases, identifierBindings)
  );
}

export function hasAstForOfSourceTargets<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  let hasSourceTarget = false;
  collectAstForOfSourceTargets(sourceNode, aliases, identifierBindings, () => {
    hasSourceTarget = true;
  });
  return hasSourceTarget;
}

export function collectAstForOfSourceTargets<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (sourceTarget: any) => void,
) {
  const seenTargets = new Set<string>();
  const emitSourceTarget = (sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const key = sourceTarget.aliasName
      ? `${sourceTarget.aliasName}@${sourceTarget.index || 0}`
      : sourceTarget.node
        ? `${sourceTarget.node.start || 0}:${sourceTarget.node.end || 0}`
        : `source:${sourceTarget.index || 0}`;
    if (seenTargets.has(key)) {
      return;
    }
    seenTargets.add(key);
    visit(sourceTarget);
  };
  const collectSourceTargets = (node: any) => {
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return;
    }
    if (unwrapped.type === 'ConditionalExpression') {
      collectSourceTargets(unwrapped.consequent);
      collectSourceTargets(unwrapped.alternate);
      return;
    }
    if (unwrapped.type === 'LogicalExpression') {
      collectSourceTargets(unwrapped.left);
      collectSourceTargets(unwrapped.right);
      return;
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      collectSourceTargets(expressions[expressions.length - 1]);
      return;
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      collectSourceTargets(unwrapped.right);
      return;
    }
    if (unwrapped.type === 'ArrayExpression') {
      for (const element of unwrapped.elements || []) {
        if (!element) {
          continue;
        }
        if (element.type === 'SpreadElement') {
          collectSourceTargets(element.argument);
          continue;
        }
        emitSourceTarget(createAstPatternSourceTarget(element));
      }
      return;
    }
    const sourceTarget = createAstPatternSourceTarget(unwrapped);
    collectAstForOfSourceTargetElementMembers(sourceTarget, aliases, identifierBindings).forEach((member) => {
      emitSourceTarget(getAstPatternMemberSourceTarget(sourceTarget, member));
    });
  };
  collectSourceTargets(sourceNode);
}

export function collectAstForOfSourceTargetElementMembers<T extends AstCapabilityAlias>(
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const members = new Set<string>();
  collectAstRestCarrierAliasCopies(sourceTarget, '__forof__', aliases, identifierBindings, (suffix) => {
    const firstMember = suffix.split('.')[0];
    const numericMember = Number(firstMember);
    if (firstMember === AST_DYNAMIC_MEMBER_ALIAS || (Number.isInteger(numericMember) && numericMember >= 0)) {
      members.add(firstMember);
    }
  });
  return members;
}
