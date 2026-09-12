/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AstCapabilityAlias,
  AstCtxRenderCall,
  AstFunctionBinding,
  AstIdentifierBinding,
  CtxMethodAlias,
  CtxRootAlias,
  InvalidReactRuntimeBinding,
  ReactAsyncComponentBinding,
  ReactCreateElementAlias,
  ReactDefaultAlias,
  ReactNamespaceAlias,
  RunJsAstInspection,
  SourceRange,
} from '../internal-types';
import { AST_DYNAMIC_MEMBER_ALIAS } from '../internal-types';
import { REACT_NODE_COMPONENT_PROP_NAMES, RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY } from '../runtime/constants';
import { walkAstAncestor, walkAstSimple } from '../ast/walk';
import {
  dedupeIndexedEntries,
  findAstAncestor,
  getAstBindingScopeRange,
  getAstExecutionScopeRange,
  isAstAlwaysExecutedInCurrentExecutionScope,
  isAstFunctionLike,
  unwrapAstChainExpression,
} from '../ast/bindings';
import { getAstSource } from '../ast/source';
import {
  collectAstForOfSourceTargetElementMembers,
  collectAstForOfSourceTargets,
  collectAstIdentifierWritesFromAst,
  getAstLoopPatternTarget,
  isAstForOfLoopVariableDeclaratorWithSourceTargets,
} from '../ast/execution';
import {
  collectAstCarrierSourceTargets,
  collectAstObjectPatternAliases,
  collectAstObjectPatternPathAliases,
  collectAstPatternBindingIdentifiers,
  collectAstPatternCarrierSourceTargets,
  collectAstPatternCarrierSourceTargetsFromSourceTarget,
  collectAstPatternDefaultValueAliasesWithSource,
  collectAstPatternRestCarrierSourceTargetsRec,
  collectAstPatternSourceTargetsRec,
  createAstPatternSourceTarget,
  createMaybeAstPatternSourceTarget,
  getAstAliasPrecedenceStart,
  getAstAliasRootName,
  getAstAssignmentTargetScope,
  getAstMemberAliasLookup,
  getAstMemberAssignmentTargetScope,
  getAstStaticPropertyName,
  hasAstShadowBinding,
  isAstCtxApiAliasAssignmentOperator,
  isCtxRootFromAst,
  resolveAstAliasBinding,
  resolveCtxMethodCall,
  trimAstAliasesAfterWrites,
} from '../ast/static-values';
import {
  getAstDefaultMemberAliasBase,
  getDirectReactDefaultCapabilityFromAstAliasName,
  getDirectReactNamespaceCapabilityFromAstAliasName,
  getReactDefaultNamespaceCapabilityFromAst,
  getReactDefaultNamespaceCapabilityFromAstPatternSource,
  getReactNamespaceCapabilityFromAst,
  getReactNamespaceCapabilityFromAstPatternSource,
  isAstPatternDefaultValueSuppressedByReactNamespace,
} from '../ast/react-values';

export function collectReactCreateElementAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
): ReactCreateElementAlias[] {
  const aliases: ReactCreateElementAlias[] = [];
  const addAlias = (name: string, capability: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const capability = getReactCreateElementCapabilityFromAst(
        node.right,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
      );
      if (capability) {
        addAlias(node.left.name, capability, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactCreateElementCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternAliases(node.id, (name, member, aliasNode) => {
          if (member === 'createElement') {
            addAlias(name, `${namespace}.createElement`, aliasNode || node, ancestors, isVar);
          }
        });
      }
    },
  });

  return aliases;
}

export function collectReactNamespaceAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxRootAliases: CtxRootAlias[],
): ReactNamespaceAlias[] {
  const aliases: ReactNamespaceAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: string,
    node: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    precedenceStart?: number,
  ) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
      ...(typeof precedenceStart === 'number' ? { precedenceStart } : {}),
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const capability = getReactNamespaceCapabilityFromAst(
        node.right,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (node.left?.type === 'Identifier' && capability) {
        addAlias(
          node.left.name,
          capability,
          node,
          ancestors,
          false,
          getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
        );
        return;
      }
      if (node.left?.type === 'MemberExpression' && capability) {
        const memberAlias = getAstMemberAliasLookup(node.left);
        if (memberAlias) {
          addAlias(
            memberAlias.aliasName,
            capability,
            node.left,
            ancestors,
            false,
            getAstMemberAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
        return;
      }
      if (node.left?.type === 'Identifier') {
        collectReactNamespaceCarrierAliasesFromAst(
          node.left.name,
          node.right,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
          (member, capability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.left.name}.${member}`,
              capability,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
              precedenceStart,
            );
          },
        );
      }
      if (
        node.operator === '=' &&
        node.left?.type === 'ObjectPattern' &&
        isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)
      ) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(
              alias,
              'ctx.React',
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.operator === '=') {
        collectReactNamespacePatternSourceAliasesFromAst(node.left, node.right, ancestors, false);
        collectReactNamespacePatternDefaultAliasesFromAst(node.left, ancestors, false, undefined, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const isVar = node.left?.type === 'VariableDeclaration' && node.left.kind === 'var';
      const activeAliases = getActiveAliases();
      collectAstForOfSourceTargets(node.right, activeAliases, identifierBindings, (loopSourceTarget) => {
        collectReactNamespacePatternSourceTargetAliasesFromAst(target, loopSourceTarget, ancestors, isVar);
        collectReactNamespacePatternDefaultAliasesFromSourceTarget(
          target,
          ancestors,
          isVar,
          undefined,
          loopSourceTarget,
        );
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const activeAliases = getActiveAliases();
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, activeAliases, identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        collectReactNamespaceCarrierAliasesFromAst(
          node.id.name,
          node.init,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
          (member, memberCapability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.id.name}.${member}`,
              memberCapability,
              aliasNode || node,
              ancestors,
              isVar,
              undefined,
              precedenceStart,
            );
          },
        );
        collectReactNamespacePatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(alias, 'ctx.React', aliasNode || node, ancestors, isVar);
          }
        });
      }
      collectReactNamespacePatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
      collectReactNamespacePatternDefaultAliasesFromAst(node.id, ancestors, isVar, undefined, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  function collectReactNamespaceFunctionParamAliasesFromAst(node: any, ancestors: any[]) {
    const scope = {
      start: typeof node.start === 'number' ? node.start : 0,
      end: typeof node.end === 'number' ? node.end : source.length,
    };
    const activeAliases = getActiveAliases();
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectReactNamespacePatternDefaultAliasesFromAst(param, ancestors, false, scope);
        continue;
      }
      collectReactNamespacePatternDefaultAliasesFromAst(param.left, ancestors, false, scope, param.right);
      collectReactNamespacePatternSourceAliasesFromAst(param.left, param.right, ancestors, false, scope);
      if (param.left?.type === 'Identifier') {
        const capability = getReactNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(param.left.name, capability, param.left, ancestors, false, scope);
        }
        continue;
      }
      if (param.left?.type === 'ObjectPattern' && isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(alias, 'ctx.React', aliasNode || param, ancestors, false, scope);
          }
        });
      }
    }
  }

  function collectReactNamespacePatternSourceAliasesFromAst(
    pattern: any,
    sourceNode: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    collectReactNamespacePatternSourceTargetAliasesFromAst(
      pattern,
      createAstPatternSourceTarget(sourceNode),
      ancestors,
      isVar,
      scopeOverride,
    );
  }

  function collectReactNamespacePatternSourceTargetAliasesFromAst(
    pattern: any,
    sourceTarget: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const activeAliases = getActiveAliases();
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const capability = getReactNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (!capability) {
        return;
      }
      addReactNamespaceAliasTarget(target, capability, ancestors, isVar, scopeOverride);
    });
    const collectCarrierTarget = (carrierTarget: {
      sourceAlias?: ReactNamespaceAlias;
      sourceTarget?: any;
      target: any;
      targetAliasName: string;
    }) => {
      if (carrierTarget.sourceAlias) {
        const precedenceStart = getAstAliasPrecedenceStart(carrierTarget.sourceAlias);
        addReactNamespaceAliasByName(
          carrierTarget.targetAliasName,
          carrierTarget.sourceAlias.capability,
          carrierTarget.target,
          ancestors,
          isVar,
          scopeOverride,
          carrierTarget.sourceTarget?.node,
          precedenceStart,
        );
        return;
      }
      const capability = getReactNamespaceCapabilityFromAstPatternSource(
        carrierTarget.sourceTarget,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (!capability) {
        return;
      }
      addReactNamespaceAliasByName(
        carrierTarget.targetAliasName,
        capability,
        carrierTarget.target,
        ancestors,
        isVar,
        scopeOverride,
        carrierTarget.sourceTarget?.node,
      );
    };
    collectAstPatternCarrierSourceTargetsFromSourceTarget(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
    collectAstPatternRestCarrierSourceTargetsRec(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
  }

  function collectReactNamespacePatternDefaultAliasesFromAst(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceNode?: any,
  ) {
    collectReactNamespacePatternDefaultAliasesFromSourceTarget(
      pattern,
      ancestors,
      isVar,
      scopeOverride,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectReactNamespacePatternDefaultAliasesFromSourceTarget(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(sourceTarget, identifierBindings, aliases, ctxRootAliases)
        ) {
          return;
        }
        const activeAliases = getActiveAliases();
        const capability = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability && defaultPattern?.type === 'Identifier') {
          addAlias(alias, capability, aliasNode || defaultPattern, ancestors, isVar, scopeOverride);
        }
        if (defaultPattern?.type === 'Identifier') {
          collectReactNamespaceCarrierAliasesFromAst(
            alias,
            valueNode,
            identifierBindings,
            activeAliases,
            ctxRootAliases,
            (member, memberCapability, memberAliasNode, precedenceStart) => {
              addAlias(
                `${alias}.${member}`,
                memberCapability,
                memberAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
                precedenceStart,
              );
            },
          );
        }
        if (
          defaultPattern?.type === 'ObjectPattern' &&
          isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)
        ) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'React') {
              addAlias(
                pathAlias,
                'ctx.React',
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
      },
    );
  }

  function addReactNamespaceAliasTarget(
    target: any,
    capability: string,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    if (unwrapped?.type === 'Identifier') {
      addAlias(
        unwrapped.name,
        capability,
        unwrapped,
        ancestors,
        isVar,
        scopeOverride || getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
      return;
    }
    if (unwrapped?.type === 'MemberExpression') {
      const memberAlias = getAstMemberAliasLookup(unwrapped);
      if (!memberAlias) {
        return;
      }
      addAlias(
        memberAlias.aliasName,
        capability,
        unwrapped,
        ancestors,
        false,
        scopeOverride || getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
    }
  }

  function addReactNamespaceAliasByName(
    name: string,
    capability: string,
    target: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    aliasNode?: any,
    precedenceStart?: number,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    const scope =
      scopeOverride ||
      (unwrapped?.type === 'MemberExpression'
        ? getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings)
        : getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings));
    addAlias(
      name,
      capability,
      unwrapAstChainExpression(aliasNode) || aliasNode || unwrapped || target,
      ancestors,
      isVar,
      scope,
      precedenceStart,
    );
  }
}

export function collectReactDefaultAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
): ReactDefaultAlias[] {
  const aliases: ReactDefaultAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: string,
    node: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    precedenceStart?: number,
  ) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
      ...(typeof precedenceStart === 'number' ? { precedenceStart } : {}),
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      if (node.left?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(
            node.left.name,
            capability,
            node,
            ancestors,
            false,
            getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
        collectReactDefaultCarrierAliasesFromAst(
          node.left.name,
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
          (member, capability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.left.name}.${member}`,
              capability,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
              precedenceStart,
            );
          },
        );
        return;
      }
      const memberAlias = getAstMemberAliasLookup(node.left);
      if (node.left?.type === 'MemberExpression' && memberAlias) {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(
            memberAlias.aliasName,
            capability,
            node.left,
            ancestors,
            false,
            getAstMemberAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
      }
      if (
        node.left?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.right, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default') {
            addAlias(
              alias,
              `${namespace}.default`,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.left?.type === 'ObjectPattern' && isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
            addAlias(
              alias,
              'ctx.React.default',
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.operator === '=') {
        collectReactDefaultPatternSourceAliasesFromAst(node.left, node.right, ancestors, false);
        collectReactDefaultPatternDefaultAliasesFromAst(node.left, ancestors, false, undefined, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const isVar = node.left?.type === 'VariableDeclaration' && node.left.kind === 'var';
      const activeAliases = getActiveAliases();
      const sourceTargetAliases = [...namespaceAliases, ...activeAliases];
      collectAstForOfSourceTargets(node.right, sourceTargetAliases, identifierBindings, (loopSourceTarget) => {
        collectReactDefaultPatternSourceTargetAliasesFromAst(target, loopSourceTarget, ancestors, isVar);
        collectReactDefaultPatternDefaultAliasesFromSourceTarget(target, ancestors, isVar, undefined, loopSourceTarget);
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const activeAliases = getActiveAliases();
      const sourceTargetAliases = [...namespaceAliases, ...activeAliases];
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, sourceTargetAliases, identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          getActiveAliases(),
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        collectReactDefaultCarrierAliasesFromAst(
          node.id.name,
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          getActiveAliases(),
          (member, memberCapability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.id.name}.${member}`,
              memberCapability,
              aliasNode || node,
              ancestors,
              isVar,
              undefined,
              precedenceStart,
            );
          },
        );
        collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default') {
            addAlias(alias, `${namespace}.default`, aliasNode || node, ancestors, isVar);
          }
        });
        collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
            addAlias(alias, 'ctx.React.default', aliasNode || node, ancestors, isVar);
          }
        });
      }
      collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
      collectReactDefaultPatternDefaultAliasesFromAst(node.id, ancestors, isVar, undefined, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  function collectReactDefaultFunctionParamAliasesFromAst(node: any, ancestors: any[]) {
    const scope = {
      start: typeof node.start === 'number' ? node.start : 0,
      end: typeof node.end === 'number' ? node.end : source.length,
    };
    const activeAliases = getActiveAliases();
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectReactDefaultPatternDefaultAliasesFromAst(param, ancestors, false, scope);
        continue;
      }
      collectReactDefaultPatternDefaultAliasesFromAst(param.left, ancestors, false, scope, param.right);
      collectReactDefaultPatternSourceAliasesFromAst(param.left, param.right, ancestors, false, scope);
      if (param.left?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(param.left.name, capability, param.left, ancestors, false, scope);
        }
        continue;
      }
      if (param.left?.type === 'ObjectPattern') {
        const namespace = getReactNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
            if (members.length === 1 && members[0] === 'default') {
              addAlias(alias, `${namespace}.default`, aliasNode || param, ancestors, false, scope);
            }
          });
        }
        if (isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
              addAlias(alias, 'ctx.React.default', aliasNode || param, ancestors, false, scope);
            }
          });
        }
      }
    }
  }

  function collectReactDefaultPatternSourceAliasesFromAst(
    pattern: any,
    sourceNode: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    collectReactDefaultPatternSourceTargetAliasesFromAst(
      pattern,
      createAstPatternSourceTarget(sourceNode),
      ancestors,
      isVar,
      scopeOverride,
    );
  }

  function collectReactDefaultPatternSourceTargetAliasesFromAst(
    pattern: any,
    sourceTarget: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const activeAliases = getActiveAliases();
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        activeAliases,
      );
      if (!capability) {
        return;
      }
      addReactDefaultAliasTarget(target, capability, ancestors, isVar, scopeOverride);
    });
    const collectCarrierTarget = (carrierTarget: {
      sourceAlias?: ReactDefaultAlias;
      sourceTarget?: any;
      target: any;
      targetAliasName: string;
    }) => {
      if (carrierTarget.sourceAlias) {
        const precedenceStart = getAstAliasPrecedenceStart(carrierTarget.sourceAlias);
        addReactDefaultAliasByName(
          carrierTarget.targetAliasName,
          carrierTarget.sourceAlias.capability,
          carrierTarget.target,
          ancestors,
          isVar,
          scopeOverride,
          carrierTarget.sourceTarget?.node,
          precedenceStart,
        );
        return;
      }
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        carrierTarget.sourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        activeAliases,
      );
      if (!capability) {
        return;
      }
      addReactDefaultAliasByName(
        carrierTarget.targetAliasName,
        capability,
        carrierTarget.target,
        ancestors,
        isVar,
        scopeOverride,
        carrierTarget.sourceTarget?.node,
      );
    };
    collectAstPatternCarrierSourceTargetsFromSourceTarget(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
    collectAstPatternRestCarrierSourceTargetsRec(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
  }

  function collectReactDefaultPatternDefaultAliasesFromAst(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceNode?: any,
  ) {
    collectReactDefaultPatternDefaultAliasesFromSourceTarget(
      pattern,
      ancestors,
      isVar,
      scopeOverride,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectReactDefaultPatternDefaultAliasesFromSourceTarget(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(
            sourceTarget,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
          )
        ) {
          return;
        }
        const activeAliases = getActiveAliases();
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability && defaultPattern?.type === 'Identifier') {
          addAlias(alias, capability, aliasNode || defaultPattern, ancestors, isVar, scopeOverride);
        }
        if (defaultPattern?.type === 'Identifier') {
          collectReactDefaultCarrierAliasesFromAst(
            alias,
            valueNode,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
            activeAliases,
            (member, memberCapability, memberAliasNode, precedenceStart) => {
              addAlias(
                `${alias}.${member}`,
                memberCapability,
                memberAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
                precedenceStart,
              );
            },
          );
        }
        if (defaultPattern?.type !== 'ObjectPattern') {
          return;
        }
        const namespace = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'default') {
              addAlias(
                pathAlias,
                `${namespace}.default`,
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
        if (isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
              addAlias(
                pathAlias,
                'ctx.React.default',
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
      },
    );
  }

  function addReactDefaultAliasTarget(
    target: any,
    capability: string,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    if (unwrapped?.type === 'Identifier') {
      addAlias(
        unwrapped.name,
        capability,
        unwrapped,
        ancestors,
        isVar,
        scopeOverride || getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
      return;
    }
    if (unwrapped?.type === 'MemberExpression') {
      const memberAlias = getAstMemberAliasLookup(unwrapped);
      if (!memberAlias) {
        return;
      }
      addAlias(
        memberAlias.aliasName,
        capability,
        unwrapped,
        ancestors,
        false,
        scopeOverride || getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
    }
  }

  function addReactDefaultAliasByName(
    name: string,
    capability: string,
    target: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    aliasNode?: any,
    precedenceStart?: number,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    const scope =
      scopeOverride ||
      (unwrapped?.type === 'MemberExpression'
        ? getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings)
        : getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings));
    addAlias(
      name,
      capability,
      unwrapAstChainExpression(aliasNode) || aliasNode || unwrapped || target,
      ancestors,
      isVar,
      scope,
      precedenceStart,
    );
  }
}

export function collectAstInvalidReactRuntimeBindingsFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[] = [],
): InvalidReactRuntimeBinding[] {
  const entries: InvalidReactRuntimeBinding[] = [];
  const addEntry = (binding: string, capability: string, node: any, ancestors: any[]) => {
    const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
    const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
    entries.push({
      binding,
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      index: typeof node?.start === 'number' ? node.start : scope.start,
      ruleId: 'runjs-react-default-alias-forbidden',
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: typeof node?.end === 'number' ? node.end : scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      if (node.left?.type === 'Identifier' && node.left.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(node.right);
        if (capability) {
          addEntry(node.left.name, capability, node.left, ancestors);
        }
        return;
      }
      if (
        node.left?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.right, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || node, ancestors);
          }
        });
      }
      if (node.left?.type === 'ObjectPattern' && isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || node, ancestors);
          }
        });
      }
      if (node.operator === '=') {
        collectInvalidReactPatternSourceBindingsFromAst(node.left, node.right, ancestors);
        collectInvalidReactPatternDefaultBindingsFromAst(node.left, ancestors, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const sourceTargetAliases = [...namespaceAliases, ...defaultAliases];
      collectAstForOfSourceTargets(node.right, sourceTargetAliases, identifierBindings, (loopSourceTarget) => {
        collectInvalidReactPatternSourceTargetBindingsFromAst(target, loopSourceTarget, ancestors);
        collectInvalidReactPatternDefaultBindingsFromSourceTarget(target, ancestors, loopSourceTarget);
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const sourceTargetAliases = [...namespaceAliases, ...defaultAliases];
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, sourceTargetAliases, identifierBindings)) {
        return;
      }
      if (node.id?.type === 'Identifier' && node.id.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(node.init);
        if (capability) {
          addEntry(node.id.name, capability, node.id, ancestors);
        }
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || node, ancestors);
          }
        });
        collectInvalidReactPatternSourceBindingsFromAst(node.id, node.init, ancestors);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || node, ancestors);
          }
        });
      }
      collectInvalidReactPatternSourceBindingsFromAst(node.id, node.init, ancestors);
      collectInvalidReactPatternDefaultBindingsFromAst(node.id, ancestors, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
  });

  return entries;

  function collectInvalidReactFunctionParamBindingsFromAst(node: any, ancestors: any[]) {
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectInvalidReactPatternDefaultBindingsFromAst(param, ancestors);
        continue;
      }
      collectInvalidReactPatternDefaultBindingsFromAst(param.left, ancestors, param.right);
      collectInvalidReactPatternSourceBindingsFromAst(param.left, param.right, ancestors);
      if (param.left?.type === 'Identifier' && param.left.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(param.right);
        if (capability) {
          addEntry(param.left.name, capability, param.left, ancestors);
        }
        continue;
      }
      if (param.left?.type !== 'ObjectPattern') {
        continue;
      }
      const namespace = getReactNamespaceCapabilityFromAst(
        param.right,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
      );
      if (namespace) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || param, ancestors);
          }
        });
      }
      if (isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || param, ancestors);
          }
        });
      }
    }
  }

  function getInvalidReactDefaultCapabilityFromSource(sourceNode: any) {
    if (!sourceNode) {
      return '';
    }
    return getReactDefaultNamespaceCapabilityFromAstPatternSource(
      createAstPatternSourceTarget(sourceNode),
      identifierBindings,
      namespaceAliases,
      ctxRootAliases,
      defaultAliases,
    );
  }

  function collectInvalidReactPatternSourceBindingsFromAst(pattern: any, sourceNode: any, ancestors: any[]) {
    collectInvalidReactPatternSourceTargetBindingsFromAst(pattern, createAstPatternSourceTarget(sourceNode), ancestors);
  }

  function collectInvalidReactPatternSourceTargetBindingsFromAst(pattern: any, sourceTarget: any, ancestors: any[]) {
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const unwrapped = unwrapAstChainExpression(target);
      if (unwrapped?.type !== 'Identifier' || unwrapped.name !== 'React') {
        return;
      }
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        defaultAliases,
      );
      if (capability) {
        addEntry(unwrapped.name, capability, unwrapped, ancestors);
      }
    });
  }

  function collectInvalidReactPatternDefaultBindingsFromAst(pattern: any, ancestors: any[], sourceNode?: any) {
    collectInvalidReactPatternDefaultBindingsFromSourceTarget(
      pattern,
      ancestors,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectInvalidReactPatternDefaultBindingsFromSourceTarget(
    pattern: any,
    ancestors: any[],
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(
            sourceTarget,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
          )
        ) {
          return;
        }
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          defaultAliases,
        );
        if (capability && alias === 'React' && defaultPattern?.type === 'Identifier') {
          addEntry(alias, capability, aliasNode || defaultPattern, ancestors);
        }
        if (defaultPattern?.type !== 'ObjectPattern') {
          return;
        }
        const namespace = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'default' && pathAlias === 'React') {
              addEntry(pathAlias, `${namespace}.default`, pathAliasNode || aliasNode || defaultPattern, ancestors);
            }
          });
        }
        if (isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && pathAlias === 'React') {
              addEntry(pathAlias, 'ctx.React.default', pathAliasNode || aliasNode || defaultPattern, ancestors);
            }
          });
        }
      },
    );
  }
}

export function collectReactNamespaceCarrierAliasesFromAst(
  containerName: string,
  sourceNode: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  addAlias: (member: string, capability: string, node?: any, precedenceStart?: number) => void,
) {
  const visitedTargets = new Set<string>();
  const collectAliases = (targetAliasName: string, sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const visitKey = `${targetAliasName}:${sourceTarget.aliasName || ''}:${sourceTarget.node?.start || 0}:${
      sourceTarget.node?.end || 0
    }:${sourceTarget.index || 0}`;
    if (visitedTargets.has(visitKey)) {
      return;
    }
    visitedTargets.add(visitKey);
    collectAstCarrierSourceTargets(
      undefined,
      targetAliasName,
      sourceTarget,
      namespaceAliases,
      identifierBindings,
      (carrierTarget) => {
        const member = getAstNestedCarrierMemberName(containerName, carrierTarget.targetAliasName);
        if (!member) {
          return;
        }
        if (carrierTarget.sourceAlias) {
          addAlias(
            member,
            carrierTarget.sourceAlias.capability,
            carrierTarget.sourceTarget?.node,
            getAstAliasPrecedenceStart(carrierTarget.sourceAlias),
          );
          return;
        }
        const capability = getReactNamespaceCapabilityFromAstPatternSource(
          carrierTarget.sourceTarget,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(member, capability, carrierTarget.sourceTarget?.node);
        }
        collectAliases(carrierTarget.targetAliasName, carrierTarget.sourceTarget);
      },
    );
  };
  collectAliases(containerName, createAstPatternSourceTarget(sourceNode));
}

export function collectReactDefaultCarrierAliasesFromAst(
  containerName: string,
  sourceNode: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[],
  addAlias: (member: string, capability: string, node?: any, precedenceStart?: number) => void,
) {
  const carrierAliases: AstCapabilityAlias[] = [...namespaceAliases, ...defaultAliases];
  const visitedTargets = new Set<string>();
  const collectAliases = (targetAliasName: string, sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const visitKey = `${targetAliasName}:${sourceTarget.aliasName || ''}:${sourceTarget.node?.start || 0}:${
      sourceTarget.node?.end || 0
    }:${sourceTarget.index || 0}`;
    if (visitedTargets.has(visitKey)) {
      return;
    }
    visitedTargets.add(visitKey);
    collectAstCarrierSourceTargets(
      undefined,
      targetAliasName,
      sourceTarget,
      carrierAliases,
      identifierBindings,
      (carrierTarget) => {
        const member = getAstNestedCarrierMemberName(containerName, carrierTarget.targetAliasName);
        if (!member) {
          return;
        }
        if (carrierTarget.sourceAlias) {
          const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
            {
              aliasName: carrierTarget.sourceAlias.name,
              index: carrierTarget.sourceAlias.start,
              rootName: getAstAliasRootName(carrierTarget.sourceAlias.name),
            },
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
            defaultAliases,
          );
          if (capability) {
            addAlias(
              member,
              capability,
              carrierTarget.sourceTarget?.node,
              getAstAliasPrecedenceStart(carrierTarget.sourceAlias),
            );
          }
          return;
        }
        const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
          carrierTarget.sourceTarget,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          defaultAliases,
        );
        if (capability) {
          addAlias(member, capability, carrierTarget.sourceTarget?.node);
        }
        collectAliases(carrierTarget.targetAliasName, carrierTarget.sourceTarget);
      },
    );
  };
  collectAliases(containerName, createAstPatternSourceTarget(sourceNode));
}

export function getAstNestedCarrierMemberName(containerName: string, targetAliasName: string) {
  const prefix = `${containerName}.`;
  return targetAliasName.startsWith(prefix) ? targetAliasName.slice(prefix.length) : '';
}

export function collectReactAsyncComponentBindingsFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): ReactAsyncComponentBinding[] {
  const bindings: ReactAsyncComponentBinding[] = [];
  const addBinding = (name: string, componentNode: any, scope: SourceRange, declarationNode?: any) => {
    if (!/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const declarationStart =
      typeof declarationNode?.start === 'number'
        ? declarationNode.start
        : typeof componentNode?.start === 'number'
          ? componentNode.start
          : scope.start;
    bindings.push({
      capability: name,
      component: name,
      declarationStart,
      name,
      start: scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      if (!node.async || node.id?.type !== 'Identifier') {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      addBinding(node.id.name, node.id, scope, node);
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isAstAsyncFunctionLike(node.init)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      addBinding(node.id.name, node.id, scope, node);
    },
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier' || !isAstAsyncFunctionLike(node.right)) {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors, source.length);
      addBinding(node.left.name, node.left, scope, node);
    },
  });

  return bindings;
}

export function collectAstReactAsyncComponentReferences(
  node: any,
  asyncComponentBindings: ReactAsyncComponentBinding[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
): Array<{ capability: string; component: string; index: number }> {
  const capability = getReactCreateElementCallCapabilityFromAst(node, reactCreateElementAliases, identifierBindings);
  if (!capability) {
    return [];
  }
  const component = resolveAstAsyncComponentBinding(node.arguments?.[0], asyncComponentBindings, identifierBindings);
  return component
    ? [
        {
          capability,
          component: component.component,
          index: typeof node.arguments?.[0]?.start === 'number' ? node.arguments[0].start : node.start || 0,
        },
      ]
    : [];
}

export function resolveAstAsyncComponentBinding(
  node: any,
  bindings: ReactAsyncComponentBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped || unwrapped.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, bindings, identifierBindings);
}

export function getReactCreateElementCallCapabilityFromAst(
  node: any,
  aliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
) {
  const callee = unwrapAstChainExpression(node.callee);
  if (callee?.type === 'Identifier') {
    const alias = resolveAstAliasBinding(callee.name, node.start || 0, aliases, identifierBindings);
    return alias?.capability || '';
  }
  return getReactCreateElementCapabilityFromAst(callee, identifierBindings, []);
}

export function getReactCreateElementCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  if (propertyName !== 'createElement') {
    return '';
  }
  const namespace = getReactNamespaceCapabilityFromAst(
    member.object,
    identifierBindings,
    namespaceAliases,
    ctxRootAliases,
  );
  return namespace ? `${namespace}.createElement` : '';
}

export function isAstAsyncFunctionLike(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  return (
    !!unwrapped?.async && (unwrapped.type === 'FunctionExpression' || unwrapped.type === 'ArrowFunctionExpression')
  );
}
