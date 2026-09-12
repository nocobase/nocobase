/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AstIdentifierBinding,
  AstIdentifierWrite,
  CallArgumentSource,
  CtxApiAlias,
  CtxApiCapability,
  CtxApiResourceAliases,
  CtxApiResourceHandleAlias,
  CtxApiResourceMethodAlias,
  CtxLibAlias,
  CtxLibMemberCaseMismatch,
  CtxLibsRootAlias,
  CtxMethodAlias,
  CtxNonFunctionRootAlias,
  CtxRootAlias,
  InvalidCtxLibMemberAccess,
  RunJsAstInspection,
  SourceRange,
  StaticFilterValueBinding,
  StaticStringBinding,
} from '../internal-types';
import { walkAstAncestor, walkAstSimple } from '../ast/walk';
import {
  dedupeIndexedEntries,
  findAstAncestor,
  getAstBindingScopeRange,
  getAstExecutionScopeRange,
  unwrapAstChainExpression,
} from '../ast/bindings';
import { getAstSource } from '../ast/source';
import { collectAstIdentifierWritesFromAst } from '../ast/execution';
import {
  collectAstObjectPatternAliases,
  collectAstPatternBindingIdentifiers,
  collectAstPatternMemberExpressions,
  getAstAssignmentTargetScope,
  getAstBindingIdentifierName,
  getAstBindingIdentifierNode,
  getCtxMethodName,
  getAstMemberAliasLookup,
  getAstObjectPatternFromValue,
  getAstStaticPropertyName,
  hasAstShadowBinding,
  isAstCtxApiAliasAssignmentOperator,
  isAstDefiniteAssignmentOperator,
  isCtxIdentifier,
  isCtxRootFromAst,
  isUnshadowedCtxIdentifier,
  resolveAstAliasBinding,
  resolveAstMemberAliasBinding,
  resolveAstResourceTypeExpression,
  resolveAstStaticStringValue,
  resolveAstStaticTemplateLiteralValue,
  resolveRunJsStaticString,
  resolveCtxMethodCall,
  trimAstAliasesAfterWrites,
} from '../ast/static-values';
import { getRunJsApiResourceCallDataSourceKey } from '../ast/request-config';
import {
  AST_CTX_METHOD_NAMES,
  CANONICAL_CTX_LIB_MEMBERS,
  CTX_LIB_MEMBER_BY_LOWERCASE,
  RUNJS_CTX_API_ALLOWED_MEMBERS,
  RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS,
  RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY,
  RUNJS_CTX_NON_FUNCTION_ROOTS,
  RUNJS_CTX_NON_FUNCTION_ROOTS_BY_MODEL_USE,
  RUNJS_RESOURCE_METHODS,
} from '../runtime/constants';

export function collectCtxRootAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxRootAlias[] {
  return collectCtxRootAliasesFromAstInternal(ast, source, identifierBindings, false);
}

export function collectCtxDefiniteRootAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxRootAlias[] {
  return collectCtxRootAliasesFromAstInternal(ast, source, identifierBindings, true);
}

function collectCtxRootAliasesFromAstInternal(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  definiteOnly: boolean,
): CtxRootAlias[] {
  const aliases: CtxRootAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, node: any, ancestors: any[], isVar = false, scopeOverride?: SourceRange) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: 'ctx',
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      const isAliasAssignmentOperator = definiteOnly
        ? isAstDefiniteAssignmentOperator(node.operator)
        : isAstCtxApiAliasAssignmentOperator(node.operator);
      if (!isAliasAssignmentOperator || node.left?.type !== 'Identifier') {
        return;
      }
      const isCtxRoot = definiteOnly
        ? isDefiniteCtxRootFromAst(node.right, getActiveAliases(), identifierBindings)
        : isCtxRootFromAst(node.right, getActiveAliases(), identifierBindings);
      if (isCtxRoot) {
        addAlias(
          node.left.name,
          node,
          ancestors,
          false,
          getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
        );
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const isCtxRoot = definiteOnly
        ? isDefiniteCtxRootFromAst(node.init, getActiveAliases(), identifierBindings)
        : isCtxRootFromAst(node.init, getActiveAliases(), identifierBindings);
      if (node.id?.type !== 'Identifier' || !isCtxRoot) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addAlias(node.id.name, node, ancestors, declaration?.kind === 'var');
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function isDefiniteCtxRootFromAst(
  node: any,
  aliases: CtxRootAlias[],
  identifierBindings: AstIdentifierBinding[],
): boolean {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      isDefiniteCtxRootFromAst(unwrapped.consequent, aliases, identifierBindings) &&
      isDefiniteCtxRootFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return isDefiniteCtxRootFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstDefiniteAssignmentOperator(unwrapped.operator)) {
    return isDefiniteCtxRootFromAst(unwrapped.right, aliases, identifierBindings);
  }
  if (isUnshadowedCtxIdentifier(unwrapped, identifierBindings)) {
    return true;
  }
  if (unwrapped.type !== 'Identifier') {
    return false;
  }
  const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
  return !!resolveAstAliasBinding(unwrapped.name, index, aliases, identifierBindings);
}

export function collectCtxNonFunctionRootAliasesFromAst(
  ast: any,
  source: string,
  ctxRootAliases: CtxRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  modelUse = '',
): CtxNonFunctionRootAlias[] {
  const aliases: CtxNonFunctionRootAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    member: string,
    node: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: `ctx.${member}`,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      member,
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };

  const collectPatternAliases = (pattern: any, node: any, ancestors: any[], isVar = false) => {
    collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
      if (isRunJsCtxNonFunctionRoot(member, modelUse)) {
        addAlias(name, member, aliasNode || node, ancestors, isVar);
      }
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstDefiniteAssignmentOperator(node.operator)) {
        return;
      }
      const member = getCtxNonFunctionRootMemberFromAst(node.right, ctxRootAliases, identifierBindings, modelUse);
      if (node.left?.type === 'Identifier' && member) {
        addAlias(
          node.left.name,
          member,
          node,
          ancestors,
          false,
          getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
        );
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        if (isDefiniteCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)) {
          collectPatternAliases(node.left, node, ancestors);
        }
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      const member = getCtxNonFunctionRootMemberFromAst(node.init, ctxRootAliases, identifierBindings, modelUse);
      if (node.id?.type === 'Identifier' && member) {
        addAlias(node.id.name, member, node, ancestors, isVar);
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        isDefiniteCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)
      ) {
        collectPatternAliases(node.id, node, ancestors, isVar);
      }
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectAstInvalidCtxNonFunctionCall(
  node: any,
  ctxRootAliases: CtxRootAlias[],
  ctxNonFunctionRootAliases: CtxNonFunctionRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  modelUse = '',
): RunJsAstInspection['invalidCtxNonFunctionCalls'] {
  const callee = unwrapAstChainExpression(node?.callee);
  const directMember = getCtxNonFunctionRootMemberFromAst(callee, ctxRootAliases, identifierBindings, modelUse);
  if (directMember) {
    return [
      {
        capability: `ctx.${directMember}`,
        index: typeof node?.start === 'number' ? node.start : 0,
        member: directMember,
        ruleId: 'runjs-ctx-member-not-callable',
      },
    ];
  }

  if (callee?.type !== 'Identifier') {
    return [];
  }
  const alias = resolveAstAliasBinding(
    callee.name,
    typeof callee.start === 'number' ? callee.start : typeof node?.start === 'number' ? node.start : 0,
    ctxNonFunctionRootAliases,
    identifierBindings,
  );
  if (!alias) {
    return [];
  }
  return [
    {
      capability: alias.capability,
      index: typeof node?.start === 'number' ? node.start : alias.start,
      member: alias.member,
      ruleId: 'runjs-ctx-member-not-callable',
    },
  ];
}

function getCtxNonFunctionRootMemberFromAst(
  node: any,
  ctxRootAliases: CtxRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  modelUse: string,
) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  if (!isRunJsCtxNonFunctionRoot(propertyName, modelUse)) {
    return '';
  }
  return isDefiniteCtxRootFromAst(member.object, ctxRootAliases, identifierBindings) ? propertyName : '';
}

function isRunJsCtxNonFunctionRoot(member: string, modelUse: string) {
  return (
    RUNJS_CTX_NON_FUNCTION_ROOTS.has(member) ||
    Boolean(modelUse && RUNJS_CTX_NON_FUNCTION_ROOTS_BY_MODEL_USE[modelUse]?.has(member))
  );
}

export function collectCtxMethodAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxMethodAlias[] {
  const aliases: CtxMethodAlias[] = [];
  const addAlias = (name: string, method: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: `ctx.${method}`,
      method,
      name,
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const method = getCtxMethodName(node.right, identifierBindings);
      if (method) {
        addAlias(node.left.name, method, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const method = getCtxMethodName(node.init, identifierBindings);
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier' && method) {
        addAlias(node.id.name, method, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.init, identifierBindings)) {
        collectAstObjectPatternAliases(node.id, (name, member, aliasNode) => {
          if (AST_CTX_METHOD_NAMES.has(member)) {
            addAlias(name, member, aliasNode || node, ancestors, isVar);
          }
        });
      }
    },
  });

  return aliases;
}

export function collectCtxApiAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias[] {
  const aliases: CtxApiAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: CtxApiAlias['capability'],
    node: any,
    ancestors: any[],
    isVar = false,
  ) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimCtxApiAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const capability =
        getCtxApiCapabilityFromAst(node.right, activeAliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.right, activeAliases, identifierBindings);
      if (node.left?.type === 'Identifier' && capability) {
        addAlias(node.left.name, capability, node, ancestors);
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxApiObjectPatternAliases(node.left, capability, (name, aliasCapability, aliasNode) => {
          addAlias(name, aliasCapability, aliasNode || node, ancestors);
        });
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      const activeAliases = getActiveAliases();
      const capability =
        getCtxApiCapabilityFromAst(node.init, activeAliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.init, activeAliases, identifierBindings);
      if (node.id?.type === 'Identifier' && capability) {
        addAlias(node.id.name, capability, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxApiObjectPatternAliases(node.id, capability, (name, aliasCapability, aliasNode) => {
          addAlias(name, aliasCapability, aliasNode || node, ancestors, isVar);
        });
      }
    },
  });

  return trimCtxApiAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectCtxApiObjectPatternAliases(
  pattern: any,
  capability: CtxApiCapability | '',
  addAlias: (name: string, capability: CtxApiCapability, node?: any) => void,
) {
  if (capability === 'ctx.api') {
    for (const property of pattern?.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      const alias = getAstBindingIdentifierName(property.value);
      const aliasNode = getAstBindingIdentifierNode(property.value);
      if (member && alias && RUNJS_CTX_API_ALLOWED_MEMBERS.has(member)) {
        addAlias(alias, `ctx.api.${member}` as CtxApiCapability, aliasNode);
      }
      if (member === 'auth') {
        const nestedPattern = getAstObjectPatternFromValue(property.value);
        if (nestedPattern) {
          collectCtxApiObjectPatternAliases(nestedPattern, 'ctx.api.auth', addAlias);
        }
      }
    }
    return;
  }
  if (capability === 'ctx.api.auth') {
    collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
      if (RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(member)) {
        addAlias(name, `ctx.api.auth.${member}` as CtxApiCapability, aliasNode);
      }
    });
  }
}

export function trimCtxApiAliasesAfterWrites(
  aliases: CtxApiAlias[],
  writes: AstIdentifierWrite[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias[] {
  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectCtxLibsRootAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxLibsRootAlias[] {
  const aliases: CtxLibsRootAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: 'ctx.libs',
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      if (
        node.left?.type === 'Identifier' &&
        isCtxLibsRootFromAst(node.right, getActiveAliases(), identifierBindings)
      ) {
        addAlias(node.left.name, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isCtxLibsRootFromAst(node.init, getActiveAliases(), identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addAlias(node.id.name, node, ancestors, declaration?.kind === 'var');
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectCtxLibAliasesFromAst(
  ast: any,
  source: string,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxLibAlias[] {
  const aliases: CtxLibAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, library: string, capability: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      library,
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const sourcePath = getCtxLibMemberPathFromAst(node.right, activeAliases, rootAliases, identifierBindings, source);
      if (
        node.left?.type === 'Identifier' &&
        sourcePath &&
        !sourcePath.hasDynamicMember &&
        !sourcePath.members.length
      ) {
        addAlias(node.left.name, sourcePath.library, sourcePath.rootCapability, node, ancestors);
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxLibObjectPatternAliases(
          node.left,
          node.right,
          rootAliases,
          identifierBindings,
          (name, alias, aliasNode) => {
            addAlias(name, alias.library, alias.capability, aliasNode || node, ancestors);
          },
        );
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      const activeAliases = getActiveAliases();
      const sourcePath = getCtxLibMemberPathFromAst(node.init, activeAliases, rootAliases, identifierBindings, source);
      if (node.id?.type === 'Identifier' && sourcePath && !sourcePath.hasDynamicMember && !sourcePath.members.length) {
        addAlias(node.id.name, sourcePath.library, sourcePath.rootCapability, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxLibObjectPatternAliases(
          node.id,
          node.init,
          rootAliases,
          identifierBindings,
          (name, alias, aliasNode) => {
            addAlias(name, alias.library, alias.capability, aliasNode || node, ancestors, isVar);
          },
        );
      }
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectCtxLibObjectPatternAliases(
  pattern: any,
  sourceNode: any,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  addAlias: (name: string, alias: { capability: string; library: string }, node?: any) => void,
) {
  if (!isCtxLibsRootFromAst(sourceNode, rootAliases, identifierBindings)) {
    return;
  }
  collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
    if (member) {
      addAlias(name, { capability: `ctx.libs.${member}`, library: member }, aliasNode);
    }
  });
}

export function collectCtxApiResourceAliasesFromAst(
  ast: any,
  source: string,
  ctxApiAliases: CtxApiAlias[],
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceAliases {
  type ResourceHandleSource = { args: any[]; calleeSource: string; index: number } | CtxApiResourceHandleAlias;

  const handles: CtxApiResourceHandleAlias[] = [];
  const methods: CtxApiResourceMethodAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addHandleAlias = (
    name: string,
    resourceFactoryCall: { args: any[]; calleeSource: string; index: number } | CtxApiResourceHandleAlias,
    node: any,
    ancestors: any[],
    isVar = false,
  ) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    handles.push({
      calleeSource: resourceFactoryCall.calleeSource,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      dataSourceKey:
        'args' in resourceFactoryCall
          ? getRunJsApiResourceCallDataSourceKey(
              resourceFactoryCall.args,
              source,
              stringBindings,
              staticFilterValueBindings,
              identifierBindings,
            )
          : resourceFactoryCall.dataSourceKey,
      resourceName:
        'args' in resourceFactoryCall
          ? resolveRunJsStaticString(resourceFactoryCall.args?.[0], source, stringBindings, identifierBindings)
          : resourceFactoryCall.resourceName,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const addMethodAlias = (name: string, method: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    methods.push({
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      method,
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveHandles = () => trimAstAliasesAfterWrites(handles, writes, identifierBindings);
  const getActiveMethods = () => trimAstAliasesAfterWrites(methods, writes, identifierBindings);
  const collectMethodAliases = (pattern: any, sourceNode: any, ancestors: any[], isVar = false) => {
    if (!sourceNode) {
      return;
    }
    collectAstObjectPatternAliases(pattern, (name, method, aliasNode) => {
      if (RUNJS_RESOURCE_METHODS.has(method)) {
        addMethodAlias(name, method, aliasNode || pattern, ancestors, isVar);
      }
    });
  };
  const getDirectResourceHandleSource = (node: any): ResourceHandleSource | undefined =>
    getCtxApiResourceCallFromAst(node, ctxApiAliases, source, identifierBindings) ||
    getCtxApiResourceHandleAliasFromAst(node, getActiveHandles(), identifierBindings);
  const getMaybeResourceHandleSource = (node: any): ResourceHandleSource | undefined =>
    getUniqueCtxApiResourceHandleSource(collectPossibleResourceHandleSources(node));
  const collectPossibleResourceHandleSources = (node: any): ResourceHandleSource[] => {
    const directSource = getDirectResourceHandleSource(node);
    if (directSource) {
      return [directSource];
    }
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return [];
    }
    if (unwrapped.type === 'ConditionalExpression') {
      return [
        ...collectPossibleResourceHandleSources(unwrapped.consequent),
        ...collectPossibleResourceHandleSources(unwrapped.alternate),
      ];
    }
    if (unwrapped.type === 'LogicalExpression') {
      const leftSources = collectPossibleResourceHandleSources(unwrapped.left);
      const rightSources = collectPossibleResourceHandleSources(unwrapped.right);
      return [...leftSources, ...rightSources];
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      return collectPossibleResourceHandleSources(expressions[expressions.length - 1]);
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      return collectPossibleResourceHandleSources(unwrapped.right);
    }
    return [];
  };
  const getResourceHandleSourceIdentity = (resourceHandleSource: ResourceHandleSource) => {
    const dataSourceKey =
      'args' in resourceHandleSource
        ? getRunJsApiResourceCallDataSourceKey(
            resourceHandleSource.args,
            source,
            stringBindings,
            staticFilterValueBindings,
            identifierBindings,
          )
        : resourceHandleSource.dataSourceKey;
    const resourceName =
      'args' in resourceHandleSource
        ? resolveRunJsStaticString(resourceHandleSource.args?.[0], source, stringBindings, identifierBindings)
        : resourceHandleSource.resourceName;
    if (typeof resourceName !== 'string' && typeof dataSourceKey !== 'string') {
      return undefined;
    }
    return `${dataSourceKey ?? ''}:${resourceName ?? ''}`;
  };
  const getUniqueCtxApiResourceHandleSource = (sources: ResourceHandleSource[]) => {
    if (sources.length <= 1) {
      return sources[0];
    }
    const firstIdentity = getResourceHandleSourceIdentity(sources[0]);
    if (!firstIdentity || sources.some((entry) => getResourceHandleSourceIdentity(entry) !== firstIdentity)) {
      return undefined;
    }
    return sources[0];
  };
  const getDirectResourceMethodSource = (node: any): { method: string } | undefined => {
    const methodAlias = getCtxApiResourceMethodAliasFromAst(node, getActiveMethods(), identifierBindings);
    if (methodAlias) {
      return { method: methodAlias.method };
    }
    const member = unwrapAstChainExpression(node);
    if (!member || member.type !== 'MemberExpression') {
      return undefined;
    }
    const method = getAstStaticPropertyName(member);
    if (!RUNJS_RESOURCE_METHODS.has(method) || !getMaybeResourceHandleSource(member.object)) {
      return undefined;
    }
    return { method };
  };
  const getMaybeResourceMethodSource = (node: any): { method: string } | undefined => {
    const sources = collectPossibleResourceMethodSources(node);
    return sources[0];
  };
  const collectPossibleResourceMethodSources = (node: any): Array<{ method: string }> => {
    const directSource = getDirectResourceMethodSource(node);
    if (directSource) {
      return [directSource];
    }
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return [];
    }
    if (unwrapped.type === 'ConditionalExpression') {
      return [
        ...collectPossibleResourceMethodSources(unwrapped.consequent),
        ...collectPossibleResourceMethodSources(unwrapped.alternate),
      ];
    }
    if (unwrapped.type === 'LogicalExpression') {
      const leftSources = collectPossibleResourceMethodSources(unwrapped.left);
      const rightSources = collectPossibleResourceMethodSources(unwrapped.right);
      return [...leftSources, ...rightSources];
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      return collectPossibleResourceMethodSources(expressions[expressions.length - 1]);
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      return collectPossibleResourceMethodSources(unwrapped.right);
    }
    return [];
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (isAstCtxApiAliasAssignmentOperator(node.operator) && node.left?.type === 'Identifier') {
        const resourceMethodSource = getMaybeResourceMethodSource(node.right);
        if (resourceMethodSource) {
          addMethodAlias(node.left.name, resourceMethodSource.method, node, ancestors);
          return;
        }
        const resourceHandleSource = getMaybeResourceHandleSource(node.right);
        if (resourceHandleSource) {
          addHandleAlias(node.left.name, resourceHandleSource, node, ancestors);
          return;
        }
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectMethodAliases(node.left, getMaybeResourceHandleSource(node.right), ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const resourceMethodSource = getMaybeResourceMethodSource(node.init);
        if (resourceMethodSource) {
          addMethodAlias(node.id.name, resourceMethodSource.method, node, ancestors, isVar);
          return;
        }
        const resourceHandleSource = getMaybeResourceHandleSource(node.init);
        if (resourceHandleSource) {
          addHandleAlias(node.id.name, resourceHandleSource, node, ancestors, isVar);
          return;
        }
      }
      const resourceHandleSource = getMaybeResourceHandleSource(node.init);
      if (node.id?.type === 'ObjectPattern') {
        collectMethodAliases(node.id, resourceHandleSource, ancestors, isVar);
      }
    },
  });

  return {
    handles: trimAstAliasesAfterWrites(handles, writes, identifierBindings),
    methods: trimAstAliasesAfterWrites(methods, writes, identifierBindings),
  };
}

export function collectAstInvalidApiResourceCall(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'] {
  const entries: RunJsAstInspection['invalidApiResourceCalls'] = [];
  const callee = unwrapAstChainExpression(node.callee);
  const chainedResourceMethod = getCtxApiResourceChainedMethodFromAst(
    callee,
    aliases,
    resourceAliases,
    source,
    identifierBindings,
  );
  if (chainedResourceMethod) {
    entries.push(chainedResourceMethod);
  }

  const resourceFactoryCall = getCtxApiResourceCallFromAst(node, aliases, source, identifierBindings);
  if (!resourceFactoryCall) {
    return entries;
  }

  const method = resolveAstStaticStringValue(node.arguments?.[0], source);
  if (method && RUNJS_RESOURCE_METHODS.has(method)) {
    entries.push({
      index: resourceFactoryCall.index,
      match: `${resourceFactoryCall.calleeSource}('${method}')`,
      matchIndex: resourceFactoryCall.index,
      method,
    });
  }

  const resourceName = resolveAstStaticStringValue(node.arguments?.[0], source);
  const action = resolveAstStaticStringValue(node.arguments?.[1], source);
  if (action && RUNJS_RESOURCE_METHODS.has(action)) {
    entries.push({
      index: resourceFactoryCall.index,
      match: resourceName
        ? `${resourceFactoryCall.calleeSource}('${resourceName}', '${action}')`
        : `${resourceFactoryCall.calleeSource}(..., '${action}')`,
      matchIndex: resourceFactoryCall.index,
      method: action,
    });
  }

  return entries;
}

export function getCtxApiResourceChainedMethodFromAst(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'][number] | undefined {
  const callee = unwrapAstChainExpression(node);
  const wrappedMethod = getWrappedCtxApiResourceChainedMethodFromAst(
    callee,
    aliases,
    resourceAliases,
    source,
    identifierBindings,
  );
  if (wrappedMethod) {
    return wrappedMethod;
  }
  const methodAlias = getMaybeCtxApiResourceMethodAliasFromAst(callee, resourceAliases.methods, identifierBindings);
  if (methodAlias) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method: methodAlias.method,
    };
  }
  if (!callee || callee.type !== 'MemberExpression') {
    return undefined;
  }

  const invocationMember = getAstStaticPropertyName(callee);
  if (invocationMember === 'call' || invocationMember === 'apply' || invocationMember === 'bind') {
    const targetMethod = getCtxApiResourceChainedMethodFromAst(
      callee.object,
      aliases,
      resourceAliases,
      source,
      identifierBindings,
    );
    if (targetMethod) {
      return {
        ...targetMethod,
        index: typeof callee.start === 'number' ? callee.start : targetMethod.index,
        match: getAstSource(callee, source),
        matchIndex: typeof callee.start === 'number' ? callee.start : targetMethod.matchIndex,
      };
    }
  }

  const method = getAstStaticPropertyName(callee);
  if (!RUNJS_RESOURCE_METHODS.has(method)) {
    return undefined;
  }

  const resourceHandleAlias = getMaybeCtxApiResourceHandleAliasFromAst(
    callee.object,
    resourceAliases.handles,
    identifierBindings,
  );
  if (resourceHandleAlias) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method,
    };
  }

  const objectPath = getCtxApiMemberPathFromAst(callee.object, aliases, identifierBindings);
  if (isCtxApiResourcePath(objectPath)) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method,
    };
  }

  const resourceFactoryCall = getMaybeCtxApiResourceCallFromAst(callee.object, aliases, source, identifierBindings);
  if (!resourceFactoryCall) {
    return undefined;
  }
  const resourceName = resolveAstStaticStringValue(resourceFactoryCall.args?.[0], source);
  return {
    index: resourceFactoryCall.index,
    match: resourceName
      ? `${resourceFactoryCall.calleeSource}('${resourceName}').${method}`
      : `${resourceFactoryCall.calleeSource}(...).${method}`,
    matchIndex: resourceFactoryCall.index,
    method,
  };
}

export function getWrappedCtxApiResourceChainedMethodFromAst(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'][number] | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }

  const wrapEntry = (entry: RunJsAstInspection['invalidApiResourceCalls'][number] | undefined) => {
    if (!entry) {
      return undefined;
    }
    return {
      ...entry,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : entry.index,
      match: getAstSource(unwrapped, source),
      matchIndex: typeof unwrapped.start === 'number' ? unwrapped.start : entry.matchIndex,
    };
  };

  if (unwrapped.type === 'ConditionalExpression') {
    return (
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(
          unwrapped.consequent,
          aliases,
          resourceAliases,
          source,
          identifierBindings,
        ),
      ) ||
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(
          unwrapped.alternate,
          aliases,
          resourceAliases,
          source,
          identifierBindings,
        ),
      )
    );
  }

  if (unwrapped.type === 'LogicalExpression') {
    const leftEntry = getCtxApiResourceChainedMethodFromAst(
      unwrapped.left,
      aliases,
      resourceAliases,
      source,
      identifierBindings,
    );
    if (unwrapped.operator === '&&') {
      return wrapEntry(
        getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
      );
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftEntry) {
      return wrapEntry(leftEntry);
    }
    return (
      wrapEntry(leftEntry) ||
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
      )
    );
  }

  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return wrapEntry(
      getCtxApiResourceChainedMethodFromAst(
        expressions[expressions.length - 1],
        aliases,
        resourceAliases,
        source,
        identifierBindings,
      ),
    );
  }

  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return wrapEntry(
      getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
    );
  }

  return undefined;
}

export function getCtxApiResourceHandleAliasFromAst(
  node: any,
  aliases: CtxApiResourceHandleAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceHandleAlias | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
}

export function getCtxApiResourceMethodAliasFromAst(
  node: any,
  aliases: CtxApiResourceMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceMethodAlias | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
}

export function getMaybeCtxApiResourceHandleAliasFromAst(
  node: any,
  aliases: CtxApiResourceHandleAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceHandleAlias | undefined {
  return getUniqueCtxApiResourceHandleAlias(
    collectMaybeCtxApiResourceHandleAliasesFromAst(node, aliases, identifierBindings),
  );
}

export function collectMaybeCtxApiResourceHandleAliasesFromAst(
  node: any,
  aliases: CtxApiResourceHandleAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceHandleAlias[] {
  const directAlias = getCtxApiResourceHandleAliasFromAst(node, aliases, identifierBindings);
  if (directAlias) {
    return [directAlias];
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return [
      ...collectMaybeCtxApiResourceHandleAliasesFromAst(unwrapped.consequent, aliases, identifierBindings),
      ...collectMaybeCtxApiResourceHandleAliasesFromAst(unwrapped.alternate, aliases, identifierBindings),
    ];
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftAliases = collectMaybeCtxApiResourceHandleAliasesFromAst(unwrapped.left, aliases, identifierBindings);
    return [
      ...leftAliases,
      ...collectMaybeCtxApiResourceHandleAliasesFromAst(unwrapped.right, aliases, identifierBindings),
    ];
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectMaybeCtxApiResourceHandleAliasesFromAst(
      expressions[expressions.length - 1],
      aliases,
      identifierBindings,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectMaybeCtxApiResourceHandleAliasesFromAst(unwrapped.right, aliases, identifierBindings);
  }
  return [];
}

export function getUniqueCtxApiResourceHandleAlias(aliases: CtxApiResourceHandleAlias[]) {
  if (aliases.length <= 1) {
    return aliases[0];
  }
  const firstIdentity = getCtxApiResourceHandleAliasIdentity(aliases[0]);
  if (!firstIdentity || aliases.some((alias) => getCtxApiResourceHandleAliasIdentity(alias) !== firstIdentity)) {
    return undefined;
  }
  return aliases[0];
}

export function getCtxApiResourceHandleAliasIdentity(alias: CtxApiResourceHandleAlias) {
  if (typeof alias.resourceName !== 'string' && typeof alias.dataSourceKey !== 'string') {
    return '';
  }
  return `${alias.dataSourceKey ?? ''}:${alias.resourceName ?? ''}`;
}

export function getMaybeCtxApiResourceMethodAliasFromAst(
  node: any,
  aliases: CtxApiResourceMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceMethodAlias | undefined {
  const directAlias = getCtxApiResourceMethodAliasFromAst(node, aliases, identifierBindings);
  if (directAlias) {
    return directAlias;
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.consequent, aliases, identifierBindings) ||
      getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftAlias = getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.left, aliases, identifierBindings);
    if (unwrapped.operator === '&&') {
      return getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftAlias) {
      return leftAlias;
    }
    return leftAlias || getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getMaybeCtxApiResourceMethodAliasFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  return undefined;
}

export function getCtxApiResourceCallFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { args: any[]; calleeSource: string; index: number } | undefined {
  const call = unwrapAstChainExpression(node);
  if (!call || call.type !== 'CallExpression') {
    return undefined;
  }
  const callee = getCtxApiResourceCalleeFromAst(call.callee, aliases, source, identifierBindings);
  if (!callee) {
    return undefined;
  }
  return {
    args: call.arguments || [],
    calleeSource: callee.source,
    index: typeof call.start === 'number' ? call.start : callee.index,
  };
}

export function getCtxApiResourceCalleeFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { index: number; source: string } | undefined {
  const callee = unwrapAstChainExpression(node);
  if (!callee) {
    return undefined;
  }
  const path = getCtxApiMemberPathFromAst(callee, aliases, identifierBindings);
  if (isCtxApiResourcePath(path)) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      source: getAstSource(callee, source),
    };
  }

  const wrapEntry = (entry: { index: number; source: string } | undefined) => {
    if (!entry) {
      return undefined;
    }
    return {
      index: typeof callee.start === 'number' ? callee.start : entry.index,
      source: getAstSource(callee, source),
    };
  };

  if (callee.type === 'ConditionalExpression') {
    return (
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.consequent, aliases, source, identifierBindings)) ||
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.alternate, aliases, source, identifierBindings))
    );
  }

  if (callee.type === 'LogicalExpression') {
    const leftEntry = getCtxApiResourceCalleeFromAst(callee.left, aliases, source, identifierBindings);
    if (callee.operator === '&&') {
      return wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings));
    }
    if ((callee.operator === '||' || callee.operator === '??') && leftEntry) {
      return wrapEntry(leftEntry);
    }
    return (
      wrapEntry(leftEntry) ||
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings))
    );
  }

  if (callee.type === 'SequenceExpression') {
    const expressions = callee.expressions || [];
    return wrapEntry(
      getCtxApiResourceCalleeFromAst(expressions[expressions.length - 1], aliases, source, identifierBindings),
    );
  }

  if (callee.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(callee.operator)) {
    return wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings));
  }

  return undefined;
}

export function getMaybeCtxApiResourceCallFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { args: any[]; calleeSource: string; index: number } | undefined {
  return getUniqueCtxApiResourceCall(
    collectMaybeCtxApiResourceCallsFromAst(node, aliases, source, identifierBindings),
    source,
  );
}

export function collectMaybeCtxApiResourceCallsFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): Array<{ args: any[]; calleeSource: string; index: number }> {
  const directCall = getCtxApiResourceCallFromAst(node, aliases, source, identifierBindings);
  if (directCall) {
    return [directCall];
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return [
      ...collectMaybeCtxApiResourceCallsFromAst(unwrapped.consequent, aliases, source, identifierBindings),
      ...collectMaybeCtxApiResourceCallsFromAst(unwrapped.alternate, aliases, source, identifierBindings),
    ];
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftCalls = collectMaybeCtxApiResourceCallsFromAst(unwrapped.left, aliases, source, identifierBindings);
    return [
      ...leftCalls,
      ...collectMaybeCtxApiResourceCallsFromAst(unwrapped.right, aliases, source, identifierBindings),
    ];
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectMaybeCtxApiResourceCallsFromAst(
      expressions[expressions.length - 1],
      aliases,
      source,
      identifierBindings,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectMaybeCtxApiResourceCallsFromAst(unwrapped.right, aliases, source, identifierBindings);
  }
  return [];
}

export function getUniqueCtxApiResourceCall(
  calls: Array<{ args: any[]; calleeSource: string; index: number }>,
  source: string,
) {
  if (calls.length <= 1) {
    return calls[0];
  }
  const firstIdentity = getCtxApiResourceCallIdentity(calls[0], source);
  if (!firstIdentity || calls.some((call) => getCtxApiResourceCallIdentity(call, source) !== firstIdentity)) {
    return undefined;
  }
  return calls[0];
}

export function getCtxApiResourceCallIdentity(
  call: { args: any[]; calleeSource: string; index: number },
  source: string,
) {
  const resourceSource = getAstSource(call.args?.[0], source);
  if (!resourceSource) {
    return '';
  }
  return [resourceSource, getAstSource(call.args?.[1], source), getAstSource(call.args?.[2], source)].join(':');
}

export function filterInvalidCtxApiMemberAccessesForResourceCalls(
  memberAccesses: RunJsAstInspection['invalidCtxApiMemberAccesses'],
  resourceCalls: RunJsAstInspection['invalidApiResourceCalls'],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const resourceCallMatches = new Set(resourceCalls.map((entry) => entry.match));
  const resourceCallMatchRanges = new Set(
    resourceCalls
      .filter((entry) => typeof entry.matchIndex === 'number')
      .map((entry) => `${entry.matchIndex}:${entry.match}`),
  );
  return memberAccesses.filter((entry) => {
    if (entry.ruleId !== 'runjs-ctx-api-member-unknown') {
      return true;
    }
    if (!entry.match || !entry.capability.startsWith('ctx.api.resource.')) {
      return true;
    }
    if (typeof entry.matchIndex === 'number') {
      return !resourceCallMatchRanges.has(`${entry.matchIndex}:${entry.match}`);
    }
    return !resourceCallMatches.has(entry.match);
  });
}

export function isCtxApiResourcePath(
  path: ReturnType<typeof getCtxApiMemberPathFromAst>,
): path is NonNullable<ReturnType<typeof getCtxApiMemberPathFromAst>> {
  return !!path && !path.hasDynamicMember && path.members.length === 1 && path.members[0].name === 'resource';
}

export function collectAstInvalidCtxLibPatternAccesses(
  ast: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxLibMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [];
  const collectPattern = (pattern: any, sourceNode: any) => {
    const sourcePath = getCtxLibMemberPathFromAst(sourceNode, aliases, rootAliases, identifierBindings, source);
    if (!sourcePath || sourcePath.hasDynamicMember || sourcePath.members.length) {
      return;
    }
    collectInvalidCtxLibObjectPatternAccesses(pattern, sourcePath).forEach((entry) => entries.push(entry));
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any) {
      if (node.operator !== '=' || node.left?.type !== 'ObjectPattern') {
        return;
      }
      collectPattern(node.left, node.right);
    },
    VariableDeclarator(node: any) {
      if (node.id?.type !== 'ObjectPattern') {
        return;
      }
      collectPattern(node.id, node.init);
    },
  });

  return dedupeIndexedEntries(entries);
}

export function collectInvalidCtxLibObjectPatternAccesses(
  pattern: any,
  sourcePath: NonNullable<ReturnType<typeof getCtxLibMemberPathFromAst>>,
): RunJsAstInspection['invalidCtxLibMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [];
  for (const property of pattern?.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (!member) {
      continue;
    }
    const invalidAccess = buildInvalidCtxLibMemberAccess({
      ...sourcePath,
      members: [
        {
          accessKind: 'destructure',
          index: typeof property.key?.start === 'number' ? property.key.start : property.start || 0,
          name: member,
        },
      ],
    });
    if (invalidAccess) {
      entries.push(invalidAccess);
    }
  }
  return entries;
}

export function collectAstInvalidCtxLibMemberAccess(
  node: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxLibMemberAccesses'][number] | undefined {
  const path = getCtxLibMemberPathFromAst(node, aliases, rootAliases, identifierBindings, source);
  if (!path || path.hasDynamicMember || !path.members.length) {
    return undefined;
  }
  return buildInvalidCtxLibMemberAccess(path);
}

export function buildInvalidCtxLibMemberAccess(path: {
  library: string;
  members: Array<{ accessKind: 'bracket' | 'destructure' | 'member'; index: number; name: string }>;
  rootCapability: string;
}): RunJsAstInspection['invalidCtxLibMemberAccesses'][number] | undefined {
  const allowedMembers = RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY.get(path.library);
  const member = path.members[0];
  if (!allowedMembers || !member || allowedMembers.has(member.name)) {
    return undefined;
  }
  return {
    accessKind: member.accessKind,
    capability: getCtxLibMemberCapability(path.rootCapability, member),
    index: member.index,
    library: path.library,
    member: member.name,
    ruleId: 'runjs-ctx-libs-member-unknown',
    suggestedImport: getSuggestedCtxLibMemberImport(path.library, member.name),
  };
}

export function getCtxLibMemberCapability(
  rootCapability: string,
  member: { accessKind: 'bracket' | 'destructure' | 'member'; name: string },
) {
  return member.accessKind === 'bracket'
    ? `${rootCapability}[${JSON.stringify(member.name)}]`
    : `${rootCapability}.${member.name}`;
}

export function getSuggestedCtxLibMemberImport(library: string, member: string) {
  if (library === 'antd' && member === 'colors') {
    return '@ant-design/colors';
  }
  return undefined;
}

export function getCtxLibMemberPathFromAst(
  node: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
):
  | {
      dynamicIndex: number;
      hasDynamicMember: boolean;
      library: string;
      libraryIndex: number;
      memberIndex: number;
      members: Array<{ accessKind: 'bracket' | 'destructure' | 'member'; index: number; name: string }>;
      rootCapability: string;
    }
  | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    if (!alias) {
      return undefined;
    }
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : alias.start;
    return {
      dynamicIndex: index,
      hasDynamicMember: false,
      library: alias.library,
      libraryIndex: index,
      memberIndex: index,
      members: [],
      rootCapability: alias.capability,
    };
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }

  const objectPath = getCtxLibMemberPathFromAst(unwrapped.object, aliases, rootAliases, identifierBindings, source);
  if (objectPath) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    return {
      ...objectPath,
      dynamicIndex: propertyName ? objectPath.dynamicIndex : propertyIndex,
      hasDynamicMember: objectPath.hasDynamicMember || !propertyName,
      memberIndex: objectPath.members.length ? objectPath.memberIndex : propertyIndex,
      members: propertyName
        ? [
            ...objectPath.members,
            {
              accessKind: unwrapped.computed ? 'bracket' : 'member',
              index: propertyIndex,
              name: propertyName,
            },
          ]
        : objectPath.members,
    };
  }

  return getDirectCtxLibPathFromAst(unwrapped, rootAliases, identifierBindings, source);
}

export function getDirectCtxLibPathFromAst(
  node: any,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): ReturnType<typeof getCtxLibMemberPathFromAst> {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return undefined;
  }
  const propertyName = getAstStaticPropertyName(member);
  if (!propertyName) {
    return undefined;
  }
  const propertyIndex = typeof member.property?.start === 'number' ? member.property.start : member.start || 0;
  if (isCtxLibsRootFromAst(member.object, rootAliases, identifierBindings)) {
    return {
      dynamicIndex: propertyIndex,
      hasDynamicMember: false,
      library: propertyName,
      libraryIndex: propertyIndex,
      memberIndex: propertyIndex,
      members: [],
      rootCapability: getAstSource(member, source) || `ctx.libs.${propertyName}`,
    };
  }
  if (
    CANONICAL_CTX_LIB_MEMBERS.includes(propertyName) &&
    isUnshadowedCtxIdentifier(member.object, identifierBindings)
  ) {
    return {
      dynamicIndex: propertyIndex,
      hasDynamicMember: false,
      library: propertyName,
      libraryIndex: propertyIndex,
      memberIndex: propertyIndex,
      members: [],
      rootCapability: getAstSource(member, source) || `ctx.${propertyName}`,
    };
  }
  return undefined;
}

export function isCtxLibsRootFromAst(
  node: any,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'Identifier') {
    return !!resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, rootAliases, identifierBindings);
  }
  return (
    unwrapped.type === 'MemberExpression' &&
    getAstStaticPropertyName(unwrapped) === 'libs' &&
    isUnshadowedCtxIdentifier(unwrapped.object, identifierBindings)
  );
}

export function collectAstInvalidCtxApiPatternAccesses(
  ast: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  const collectPattern = (pattern: any, capability: CtxApiAlias['capability']) => {
    collectInvalidCtxApiObjectPatternAccesses(pattern, getCtxApiCapabilityMemberPrefix(capability)).forEach((entry) =>
      entries.push(entry),
    );
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any) {
      if (node.operator !== '=' || node.left?.type !== 'ObjectPattern') {
        return;
      }
      const capability =
        getCtxApiCapabilityFromAst(node.right, aliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.right, aliases, identifierBindings);
      if (capability) {
        collectPattern(node.left, capability);
      }
    },
    VariableDeclarator(node: any) {
      if (node.id?.type !== 'ObjectPattern') {
        return;
      }
      const capability =
        getCtxApiCapabilityFromAst(node.init, aliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.init, aliases, identifierBindings);
      if (capability) {
        collectPattern(node.id, capability);
      }
    },
  });

  return dedupeIndexedEntries(entries);
}

export function getCtxApiCapabilityMemberPrefix(capability: CtxApiAlias['capability']) {
  if (capability === 'ctx.api.auth') {
    return ['auth'];
  }
  if (capability.startsWith('ctx.api.auth.')) {
    return ['auth', capability.slice('ctx.api.auth.'.length)];
  }
  if (capability === 'ctx.api.request') {
    return ['request'];
  }
  if (capability === 'ctx.api.resource') {
    return ['resource'];
  }
  return [];
}

export function collectInvalidCtxApiObjectPatternAccesses(
  pattern: any,
  prefix: string[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  for (const property of pattern?.properties || []) {
    if (!property) {
      continue;
    }
    if (property.type === 'RestElement') {
      const dynamicAccess = buildInvalidCtxApiMemberAccess([...prefix, '[...]'], property.start || 0, true);
      if (dynamicAccess) {
        entries.push(dynamicAccess);
      }
      continue;
    }
    if (property.type !== 'Property') {
      continue;
    }

    const member = getAstStaticPropertyName(property);
    if (!member) {
      const dynamicAccess = buildInvalidCtxApiMemberAccess([...prefix, '[...]'], property.start || 0, true);
      if (dynamicAccess) {
        entries.push(dynamicAccess);
      }
      continue;
    }

    const memberPath = [...prefix, member];
    const invalidAccess = buildInvalidCtxApiMemberAccess(
      memberPath,
      typeof property.key?.start === 'number' ? property.key.start : property.start || 0,
    );
    if (invalidAccess) {
      entries.push(invalidAccess);
      continue;
    }

    const nestedPattern = getAstObjectPatternFromValue(property.value);
    if (nestedPattern) {
      collectInvalidCtxApiObjectPatternAccesses(nestedPattern, memberPath).forEach((entry) => entries.push(entry));
    }
  }
  return entries;
}

export function collectAstInvalidCtxApiMemberAccess(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxApiMemberAccesses'][number] | undefined {
  const access = getCtxApiMemberAccessFromAst(node, aliases, identifierBindings);
  if (!access || !access.memberPath.length) {
    return undefined;
  }
  const invalidAccess = buildInvalidCtxApiMemberAccess(
    access.memberPath,
    access.hasDynamicMember ? access.dynamicIndex : access.memberIndex,
    access.hasDynamicMember,
  );
  return invalidAccess
    ? { ...invalidAccess, match: getAstSource(node, source), matchIndex: node.start || 0 }
    : undefined;
}

export function buildInvalidCtxApiMemberAccess(
  memberPath: string[],
  index: number,
  hasDynamicMember = false,
): RunJsAstInspection['invalidCtxApiMemberAccesses'][number] | undefined {
  const capability = `ctx.api.${memberPath.join('.')}`;
  const topLevelMember = memberPath[0];

  if (hasDynamicMember) {
    return {
      capability,
      index,
      ruleId: 'runjs-ctx-api-member-dynamic-unresolved',
    };
  }

  if (!RUNJS_CTX_API_ALLOWED_MEMBERS.has(topLevelMember)) {
    return {
      capability,
      index,
      member: topLevelMember,
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'request' && memberPath.length > 1) {
    return {
      capability,
      index,
      member: memberPath[1],
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'resource' && memberPath.length > 1) {
    return {
      capability,
      index,
      member: memberPath[1],
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'auth' && memberPath.length > 1) {
    const authMember = memberPath[1];
    if (!RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(authMember)) {
      return {
        capability,
        index,
        member: authMember,
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
      };
    }
  }

  return undefined;
}

export function collectAstInvalidCtxApiReadonlyWrites(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  collectAstWriteTargetNodes(node, (target) => {
    const path = getCtxApiMemberPathFromAst(target, aliases, identifierBindings);
    if (!path?.isCtxApi || path.hasDynamicMember) {
      return;
    }
    const memberPath = path.members.map((member) => member.name);
    if (memberPath[0] !== 'auth') {
      return;
    }
    if (memberPath.length === 1 || RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(memberPath[1])) {
      entries.push({
        capability: `ctx.api.${memberPath.join('.')}`,
        index: path.memberIndex,
        member: memberPath[1] || 'auth',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
      });
    }
  });
  return entries;
}

export function collectAstWriteTargetNodes(node: any, visit: (node: any) => void) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'MemberExpression') {
    visit(unwrapped);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstWriteTargetNodes(unwrapped.left, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstWriteTargetNodes(unwrapped.argument, visit);
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (const element of unwrapped.elements || []) {
      collectAstWriteTargetNodes(element, visit);
    }
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstWriteTargetNodes(property.argument, visit);
        continue;
      }
      if (property.type === 'Property') {
        collectAstWriteTargetNodes(property.value, visit);
      }
    }
  }
}

export function getCtxApiMemberAccessFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): { dynamicIndex: number; hasDynamicMember: boolean; memberIndex: number; memberPath: string[] } | undefined {
  const path = getCtxApiMemberPathFromAst(node, aliases, identifierBindings);
  if (!path?.isCtxApi) {
    return undefined;
  }
  const memberPath = path.members.map((member) => member.name);
  if (path.hasDynamicMember) {
    memberPath.push('[...]');
  }
  if (!memberPath.length) {
    return undefined;
  }
  return {
    dynamicIndex: path.dynamicIndex,
    hasDynamicMember: path.hasDynamicMember,
    memberIndex: path.memberIndex,
    memberPath,
  };
}

export function getCtxApiMemberPathFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
):
  | {
      dynamicIndex: number;
      hasDynamicMember: boolean;
      isCtxApi: true;
      memberIndex: number;
      members: Array<{ index: number; name: string }>;
    }
  | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    if (!alias) {
      return undefined;
    }
    return {
      dynamicIndex: unwrapped.start || 0,
      hasDynamicMember: false,
      isCtxApi: true,
      memberIndex: unwrapped.start || 0,
      members: getCtxApiAliasMemberPath(alias, unwrapped.start || 0),
    };
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }

  const objectPath = getCtxApiMemberPathFromAst(unwrapped.object, aliases, identifierBindings);
  if (objectPath?.isCtxApi) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    return {
      ...objectPath,
      dynamicIndex: propertyName ? objectPath.dynamicIndex : propertyIndex,
      hasDynamicMember: objectPath.hasDynamicMember || !propertyName,
      memberIndex: objectPath.members.length ? objectPath.memberIndex : propertyIndex,
      members: propertyName
        ? [...objectPath.members, { index: propertyIndex, name: propertyName }]
        : objectPath.members,
    };
  }

  const objectCapability = getMaybeCtxApiCapabilityFromAst(unwrapped.object, aliases, identifierBindings);
  if (objectCapability) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    const members = getCtxApiCapabilityMemberPath(objectCapability, unwrapped.object?.start || propertyIndex);
    return {
      dynamicIndex: propertyName ? propertyIndex : propertyIndex,
      hasDynamicMember: !propertyName,
      isCtxApi: true,
      memberIndex: members.length ? members[0].index : propertyIndex,
      members: propertyName ? [...members, { index: propertyIndex, name: propertyName }] : members,
    };
  }

  if (!isUnshadowedCtxIdentifier(unwrapped.object, identifierBindings)) {
    return undefined;
  }
  const propertyName = getAstStaticPropertyName(unwrapped);
  if (propertyName !== 'api') {
    return undefined;
  }
  const propertyIndex = typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
  return {
    dynamicIndex: propertyIndex,
    hasDynamicMember: false,
    isCtxApi: true,
    memberIndex: propertyIndex,
    members: [],
  };
}

export function getCtxApiAliasMemberPath(alias: CtxApiAlias, index: number): Array<{ index: number; name: string }> {
  return getCtxApiCapabilityMemberPath(alias.capability, index);
}

export function getCtxApiCapabilityMemberPath(
  capability: CtxApiAlias['capability'],
  index: number,
): Array<{ index: number; name: string }> {
  if (capability === 'ctx.api.auth') {
    return [{ index, name: 'auth' }];
  }
  if (capability.startsWith('ctx.api.auth.')) {
    return [
      { index, name: 'auth' },
      { index, name: capability.slice('ctx.api.auth.'.length) },
    ];
  }
  if (capability === 'ctx.api.request') {
    return [{ index, name: 'request' }];
  }
  if (capability === 'ctx.api.resource') {
    return [{ index, name: 'resource' }];
  }
  return [];
}

export function getCtxApiCapabilityFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'] | '' {
  const path = getCtxApiMemberPathFromAst(node, aliases, identifierBindings);
  if (!path?.isCtxApi || path.hasDynamicMember) {
    return '';
  }
  if (!path.members.length) {
    return 'ctx.api';
  }
  if (path.members.length === 1 && RUNJS_CTX_API_ALLOWED_MEMBERS.has(path.members[0].name)) {
    return `ctx.api.${path.members[0].name}` as CtxApiAlias['capability'];
  }
  if (
    path.members.length === 2 &&
    path.members[0].name === 'auth' &&
    RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(path.members[1].name)
  ) {
    return `ctx.api.auth.${path.members[1].name}` as CtxApiAlias['capability'];
  }
  return '';
}

export function getMaybeCtxApiCapabilityFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'] | '' {
  return selectCtxApiCapability(collectPossibleCtxApiCapabilitiesFromAst(node, aliases, identifierBindings));
}

export function collectPossibleCtxApiCapabilitiesFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'][] {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }

  const directCapability = getCtxApiCapabilityFromAst(unwrapped, aliases, identifierBindings);
  if (directCapability) {
    return [directCapability];
  }

  if (unwrapped.type === 'ConditionalExpression') {
    return uniqueCtxApiCapabilities([
      ...collectPossibleCtxApiCapabilitiesFromAst(unwrapped.consequent, aliases, identifierBindings),
      ...collectPossibleCtxApiCapabilitiesFromAst(unwrapped.alternate, aliases, identifierBindings),
    ]);
  }

  if (unwrapped.type === 'LogicalExpression') {
    const leftCapabilities = collectPossibleCtxApiCapabilitiesFromAst(unwrapped.left, aliases, identifierBindings);
    const rightCapabilities = collectPossibleCtxApiCapabilitiesFromAst(unwrapped.right, aliases, identifierBindings);
    if (unwrapped.operator === '&&' && leftCapabilities.length) {
      return leftCapabilities.every(isCtxApiCapabilityDefinitelyTruthy)
        ? uniqueCtxApiCapabilities(rightCapabilities)
        : uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftCapabilities.length) {
      return leftCapabilities.every(isCtxApiCapabilityDefinitelyTruthy)
        ? uniqueCtxApiCapabilities(leftCapabilities)
        : uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
    }
    return uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
  }

  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectPossibleCtxApiCapabilitiesFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }

  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectPossibleCtxApiCapabilitiesFromAst(unwrapped.right, aliases, identifierBindings);
  }

  return [];
}

export function selectCtxApiCapability(capabilities: CtxApiAlias['capability'][]): CtxApiAlias['capability'] | '' {
  const uniqueCapabilities = uniqueCtxApiCapabilities(capabilities);
  if (!uniqueCapabilities.length) {
    return '';
  }
  if (uniqueCapabilities.length === 1) {
    return uniqueCapabilities[0];
  }
  if (uniqueCapabilities.some((capability) => capability === 'ctx.api')) {
    return 'ctx.api';
  }
  const topLevelMembers = new Set(uniqueCapabilities.map((capability) => capability.split('.')[2]));
  if (topLevelMembers.size > 1) {
    return 'ctx.api';
  }
  const topLevelMember = [...topLevelMembers][0];
  if (topLevelMember === 'auth') {
    return 'ctx.api.auth';
  }
  if (topLevelMember === 'request' || topLevelMember === 'resource') {
    return `ctx.api.${topLevelMember}` as CtxApiAlias['capability'];
  }
  return 'ctx.api';
}

export function uniqueCtxApiCapabilities(
  capabilities: Array<CtxApiAlias['capability'] | ''>,
): CtxApiAlias['capability'][] {
  return [...new Set(capabilities.filter(Boolean) as CtxApiAlias['capability'][])];
}

export function isCtxApiCapabilityDefinitelyTruthy(capability: CtxApiAlias['capability']) {
  return (
    capability === 'ctx.api' ||
    capability === 'ctx.api.auth' ||
    capability === 'ctx.api.request' ||
    capability === 'ctx.api.resource' ||
    capability === 'ctx.api.auth.authenticator'
  );
}
