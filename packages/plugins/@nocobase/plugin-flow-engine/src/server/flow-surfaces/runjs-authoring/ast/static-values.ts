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
  AstFunctionBinding,
  AstIdentifierBinding,
  AstIdentifierWrite,
  AstStaticObjectAliasCopy,
  CallArgumentSource,
  CtxMethodAlias,
  CtxRootAlias,
  ReactDefaultAlias,
  ReactNamespaceAlias,
  RunJsAstInspection,
  SourceBinding,
  SourceRange,
  StaticFilterValueBinding,
  StaticStringBinding,
} from '../internal-types';
import { AST_DYNAMIC_MEMBER_ALIAS } from '../internal-types';
import { AST_CTX_METHOD_NAMES } from '../runtime/constants';
import { normalizeText } from '../runtime/surface';
import {
  findAstAncestor,
  getAstBindingScopeRange,
  getAstExecutionScopeRange,
  isAstDefinitelyNonEmptyForInSource,
  isAstDefinitelyNonEmptyForOfSource,
  isAstFunctionLike,
  isNameBoundAtIndex,
  isSameAstRange,
  unwrapAstChainExpression,
} from './bindings';
import { findMatches, findTopLevelChar, getAstSource, splitTopLevel, trimBindingElement } from './source';

export function resolveCtxMethodCall(node: any, aliases: CtxMethodAlias[], identifierBindings: AstIdentifierBinding[]) {
  const callee = unwrapAstChainExpression(node.callee);
  const directMethod = getCtxMethodName(callee, identifierBindings);
  if (directMethod) {
    return {
      capability: `ctx.${directMethod}`,
      method: directMethod,
    };
  }
  if (callee?.type === 'Identifier') {
    const alias = resolveAstAliasBinding(callee.name, node.start || 0, aliases, identifierBindings);
    if (alias) {
      return alias;
    }
  }
  return undefined;
}

export function getCtxMethodName(node: any, identifierBindings: AstIdentifierBinding[]) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression' || !isUnshadowedCtxIdentifier(member.object, identifierBindings)) {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  return AST_CTX_METHOD_NAMES.has(propertyName) ? propertyName : '';
}

export function getAstStaticPropertyName(node: any): string {
  const property = node?.key || node?.property;
  if (!property) {
    return '';
  }
  if (!node.computed && property.type === 'Identifier') {
    return property.name;
  }
  const unwrapped = unwrapAstChainExpression(property);
  if (unwrapped?.type === 'Literal' && (typeof unwrapped.value === 'string' || typeof unwrapped.value === 'number')) {
    return String(unwrapped.value);
  }
  const value = resolveAstStaticStringValue(property, '');
  return typeof value === 'string' ? value : '';
}

export function getAstStaticMemberKey(node: any): string {
  const property = node?.key || node?.property;
  if (!property) {
    return '';
  }
  if (!node.computed && property.type === 'Identifier') {
    return property.name;
  }
  const unwrapped = unwrapAstChainExpression(property);
  if (unwrapped?.type === 'Literal') {
    if (typeof unwrapped.value === 'string' || typeof unwrapped.value === 'number') {
      return String(unwrapped.value);
    }
    return '';
  }
  const value = resolveAstStaticStringValue(property, '');
  return typeof value === 'string' ? value : '';
}

export function isCtxIdentifier(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  return unwrapped?.type === 'Identifier' && unwrapped.name === 'ctx';
}

export function isUnshadowedCtxIdentifier(node: any, identifierBindings: AstIdentifierBinding[]) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!isCtxIdentifier(unwrapped)) {
    return false;
  }
  const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
  return !hasAstActiveBinding('ctx', index, identifierBindings);
}

export function isCtxRootFromAst(node: any, aliases: CtxRootAlias[], identifierBindings: AstIdentifierBinding[]) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      isCtxRootFromAst(unwrapped.consequent, aliases, identifierBindings) ||
      isCtxRootFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      isCtxRootFromAst(unwrapped.left, aliases, identifierBindings) ||
      isCtxRootFromAst(unwrapped.right, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return isCtxRootFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return isCtxRootFromAst(unwrapped.right, aliases, identifierBindings);
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

export function hasAstActiveBinding(name: string, index: number, identifierBindings: AstIdentifierBinding[]) {
  return identifierBindings.some((binding) => binding.name === name && index >= binding.start && index < binding.end);
}

export function isAstCtxApiAliasAssignmentOperator(operator: string) {
  return operator === '=' || operator === '||=' || operator === '&&=' || operator === '??=';
}

export function isAstDefiniteAssignmentOperator(operator: string) {
  return operator === '=' || operator === '&&=';
}

export function getAstAssignmentTargetScope(
  target: any,
  ancestors: any[],
  sourceLength: number,
  identifierBindings: AstIdentifierBinding[],
): SourceRange {
  const fallbackScope = getAstBindingScopeRange(ancestors, sourceLength);
  if (target?.type === 'Identifier') {
    const index = typeof target.start === 'number' ? target.start : 0;
    const binding = resolveAstActiveIdentifierBinding(target.name, index, identifierBindings);
    if (binding) {
      const executionScope = getAstExecutionScopeRange(ancestors, sourceLength);
      if (binding.start < executionScope.start && binding.end >= executionScope.end) {
        return fallbackScope;
      }
      return {
        start: binding.start,
        end: binding.end,
      };
    }
  }
  return fallbackScope;
}

export function getAstMemberAssignmentTargetScope(
  target: any,
  ancestors: any[],
  sourceLength: number,
  identifierBindings: AstIdentifierBinding[],
): SourceRange {
  const fallbackScope = getAstBindingScopeRange(ancestors, sourceLength);
  const lookup = getAstMemberAliasLookup(target);
  if (!lookup) {
    return fallbackScope;
  }
  const binding = resolveAstActiveIdentifierBinding(lookup.rootName, lookup.index, identifierBindings);
  if (!binding) {
    return fallbackScope;
  }
  const executionScope = getAstExecutionScopeRange(ancestors, sourceLength);
  if (binding.start < executionScope.start && binding.end >= executionScope.end) {
    return fallbackScope;
  }
  return {
    start: binding.start,
    end: binding.end,
  };
}

export function findUnboundCtxMatches(masked: string, pattern: RegExp, bindings: SourceBinding[]) {
  return findMatches(masked, pattern).filter((entry) => !isNameBoundAtIndex(bindings, 'ctx', entry.index));
}

export function dedupeAstResourceEntries(entries: RunJsAstInspection['invalidResourceTypeCalls']) {
  const seen = new Set<string>();
  return entries
    .filter((entry) => {
      const key = `${entry.ruleId}:${entry.capability}:${entry.index}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.index - right.index);
}

export function resolveAstResourceTypeExpression(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): { status: 'resolved'; value: string } | { status: 'unresolved'; expression: string } {
  const resolved = resolveAstStaticStringValue(node, source);
  if (typeof resolved === 'string') {
    return { status: 'resolved', value: resolved };
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type === 'Identifier') {
    const binding = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, stringBindings, identifierBindings);
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  if (unwrapped?.type === 'MemberExpression') {
    const binding = resolveAstMemberAliasBinding(unwrapped, stringBindings, identifierBindings);
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  const templateValue = resolveAstStaticTemplateLiteralValue(unwrapped, source, stringBindings, identifierBindings);
  if (typeof templateValue === 'string') {
    return { status: 'resolved', value: templateValue };
  }
  return {
    status: 'unresolved',
    expression: source.slice(node?.start || 0, node?.end || node?.start || 0).trim(),
  };
}

export function resolveAstStaticStringValue(node: any, source: string): string | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Literal' && typeof unwrapped.value === 'string') {
    return unwrapped.value;
  }
  if (unwrapped.type === 'TemplateLiteral' && !unwrapped.expressions?.length) {
    return unwrapped.quasis?.[0]?.value?.cooked ?? source.slice(unwrapped.start + 1, unwrapped.end - 1);
  }
  return undefined;
}

export function resolveAstStaticTemplateLiteralValue(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'TemplateLiteral' || !(unwrapped.expressions || []).length) {
    return undefined;
  }
  const quasis = unwrapped.quasis || [];
  const expressions = unwrapped.expressions || [];
  let value = '';
  for (let index = 0; index < quasis.length; index += 1) {
    const quasi = quasis[index];
    value += quasi?.value?.cooked ?? quasi?.value?.raw ?? '';
    if (index >= expressions.length) {
      continue;
    }
    const expression = resolveAstResourceTypeExpression(expressions[index], source, stringBindings, identifierBindings);
    if (expression.status !== 'resolved') {
      return undefined;
    }
    value += expression.value;
  }
  return value;
}

export function resolveAstAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter((entry) => entry.name === name && index >= entry.start && index < entry.end)
    .sort((left, right) => right.start - left.start);
  return candidates.find((entry) => !hasAstShadowBinding(name, index, entry, identifierBindings));
}

export function resolveAstMemberAliasBinding<T extends SourceRange & { name: string }>(
  node: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const lookup = getAstMemberAliasLookup(node);
  if (!lookup) {
    return undefined;
  }
  return resolveAstNamedAliasBinding(lookup.aliasName, lookup.index, lookup.rootName, aliases, identifierBindings);
}

export function getAstMemberAliasLookup(node: any): { aliasName: string; index: number; rootName: string } | undefined {
  const member = unwrapAstChainExpression(node);
  if (member?.type !== 'MemberExpression') {
    return undefined;
  }
  const memberKey = getAstStaticMemberKey(member);
  if (!memberKey) {
    return undefined;
  }
  const object = unwrapAstChainExpression(member.object);
  if (object?.type === 'Identifier') {
    return {
      aliasName: `${object.name}.${memberKey}`,
      index: typeof member.start === 'number' ? member.start : typeof object.start === 'number' ? object.start : 0,
      rootName: object.name,
    };
  }
  const objectLookup = getAstMemberAliasLookup(object);
  if (!objectLookup) {
    return undefined;
  }
  return {
    aliasName: `${objectLookup.aliasName}.${memberKey}`,
    index: typeof member.start === 'number' ? member.start : objectLookup.index,
    rootName: objectLookup.rootName,
  };
}

export function getAstMemberWriteLookup(node: any): { aliasName: string; index: number; rootName: string } | undefined {
  const staticLookup = getAstMemberAliasLookup(node);
  if (staticLookup) {
    return staticLookup;
  }
  const root = getAstMemberRootIdentifier(node);
  if (!root) {
    return undefined;
  }
  const member = unwrapAstChainExpression(node);
  return {
    aliasName: root.name,
    index: typeof member?.start === 'number' ? member.start : root.index,
    rootName: root.name,
  };
}

export function getAstMemberRootIdentifier(node: any): { index: number; name: string } | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    return {
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      name: unwrapped.name,
    };
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }
  return getAstMemberRootIdentifier(unwrapped.object);
}

export function getAstAliasRootName(name: string) {
  return String(name || '').split('.')[0] || name;
}

export function resolveAstNamedAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  rootName: string | undefined,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter((entry) => entry.name === name && index >= entry.start && index < entry.end)
    .sort((left, right) => right.start - left.start);
  return candidates.find(
    (entry) => !hasAstShadowBinding(rootName || getAstAliasRootName(name), index, entry, identifierBindings),
  );
}

export function resolveAstDynamicAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  rootName: string | undefined,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter(
      (entry) =>
        entry.name !== name &&
        index >= entry.start &&
        index < entry.end &&
        isAstDynamicMemberAliasMatch(entry.name, name),
    )
    .sort((left, right) => right.start - left.start);
  return candidates.find(
    (entry) => !hasAstShadowBinding(rootName || getAstAliasRootName(name), index, entry, identifierBindings),
  );
}

export function compareAstAliasPrecedence(
  left: SourceRange & { precedenceStart?: number },
  right: SourceRange & { precedenceStart?: number },
) {
  if (left.start !== right.start) {
    return left.start - right.start;
  }
  return getAstAliasPrecedenceStart(left) - getAstAliasPrecedenceStart(right);
}

export function getAstAliasPrecedenceStart(alias: SourceRange & { precedenceStart?: number }) {
  return typeof alias.precedenceStart === 'number' ? alias.precedenceStart : alias.start;
}

export function isAstDynamicMemberAliasMatch(patternName: string, name: string) {
  if (!patternName.includes(AST_DYNAMIC_MEMBER_ALIAS)) {
    return false;
  }
  const patternParts = patternName.split('.');
  const nameParts = name.split('.');
  return (
    patternParts.length === nameParts.length &&
    patternParts.every((part, index) => part === AST_DYNAMIC_MEMBER_ALIAS || part === nameParts[index])
  );
}

export function resolveAstActiveIdentifierBinding(
  name: string,
  index: number,
  identifierBindings: AstIdentifierBinding[],
): AstIdentifierBinding | undefined {
  return identifierBindings
    .filter((binding) => binding.name === name && index >= binding.start && index < binding.end)
    .sort(
      (left, right) =>
        left.end - left.start - (right.end - right.start) || right.start - left.start || right.end - left.end,
    )[0];
}

export function hasAstShadowBinding(
  name: string,
  index: number,
  alias: SourceRange,
  identifierBindings: AstIdentifierBinding[],
) {
  return identifierBindings.some(
    (binding) => binding.name === name && binding.start > alias.start && index >= binding.start && index < binding.end,
  );
}

export function addAstFunctionParamBindings(bindings: AstIdentifierBinding[], node: any, sourceLength: number) {
  const scope = {
    start: typeof node.start === 'number' ? node.start : 0,
    end: typeof node.end === 'number' ? node.end : sourceLength,
  };
  for (const param of node.params || []) {
    collectAstPatternBindingIdentifiers(param, (name, bindingNode) => {
      bindings.push({
        name,
        start: typeof bindingNode?.start === 'number' ? bindingNode.start : scope.start,
        end: scope.end,
      });
    });
  }
}

export function collectAstPatternBindingIdentifiers(node: any, addBinding: (name: string, node: any) => void) {
  if (!node) {
    return;
  }
  if (node.type === 'Identifier') {
    addBinding(node.name, node);
    return;
  }
  if (node.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(node.left, addBinding);
    return;
  }
  if (node.type === 'RestElement') {
    collectAstPatternBindingIdentifiers(node.argument, addBinding);
    return;
  }
  if (node.type === 'ArrayPattern') {
    for (const element of node.elements || []) {
      collectAstPatternBindingIdentifiers(element, addBinding);
    }
    return;
  }
  if (node.type === 'ObjectPattern') {
    for (const property of node.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternBindingIdentifiers(property.argument, addBinding);
        continue;
      }
      if (property.type === 'Property') {
        collectAstPatternBindingIdentifiers(property.value, addBinding);
      }
    }
  }
}

export function collectAstObjectPatternAliases(
  pattern: any,
  addAlias: (alias: string, member: string, node?: any) => void,
) {
  for (const property of pattern.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    const alias = getAstBindingIdentifierName(property.value);
    const aliasNode = getAstBindingIdentifierNode(property.value);
    if (member && alias) {
      addAlias(alias, member, aliasNode);
    }
  }
}

export function collectAstObjectPatternPathAliases(
  pattern: any,
  addAlias: (alias: string, members: string[], node?: any) => void,
  parentMembers: string[] = [],
) {
  for (const property of pattern.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (!member) {
      continue;
    }
    const members = [...parentMembers, member];
    const alias = getAstBindingIdentifierName(property.value);
    const aliasNode = getAstBindingIdentifierNode(property.value);
    if (alias) {
      addAlias(alias, members, aliasNode);
    }
    const nestedPattern = getAstObjectPatternFromValue(property.value);
    if (nestedPattern) {
      collectAstObjectPatternPathAliases(nestedPattern, addAlias, members);
    }
  }
}

export function collectAstPatternDefaultValueAliases(
  pattern: any,
  addAlias: (alias: string, valueNode: any, aliasNode: any, defaultPattern: any) => void,
) {
  if (!pattern) {
    return;
  }
  if (pattern.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(pattern.left, (alias, aliasNode) => {
      addAlias(alias, pattern.right, aliasNode, pattern.left);
    });
    collectAstPatternDefaultValueAliases(pattern.left, addAlias);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternDefaultValueAliases(property.argument, addAlias);
        continue;
      }
      if (property.type === 'Property') {
        collectAstPatternDefaultValueAliases(property.value, addAlias);
      }
    }
    return;
  }
  if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements || []) {
      collectAstPatternDefaultValueAliases(element, addAlias);
    }
    return;
  }
  if (pattern.type === 'RestElement') {
    collectAstPatternDefaultValueAliases(pattern.argument, addAlias);
  }
}

export function collectAstPatternDefaultValueAliasesWithSource(
  pattern: any,
  sourceTarget: any,
  addAlias: (alias: string, valueNode: any, aliasNode: any, defaultPattern: any, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(unwrapped.left, (alias, aliasNode) => {
      addAlias(alias, unwrapped.right, aliasNode, unwrapped.left, sourceTarget);
    });
    collectAstPatternDefaultValueAliasesWithSource(unwrapped.left, sourceTarget, addAlias);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternDefaultValueAliasesWithSource(property.argument, undefined, addAlias);
        continue;
      }
      if (property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      collectAstPatternDefaultValueAliasesWithSource(
        property.value,
        member ? getAstPatternMemberSourceTarget(sourceTarget, member) : undefined,
        addAlias,
      );
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      collectAstPatternDefaultValueAliasesWithSource(
        unwrapped.elements[index],
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        addAlias,
      );
    }
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternDefaultValueAliasesWithSource(unwrapped.argument, undefined, addAlias);
  }
}

export function collectAstPatternSourceTargets(
  pattern: any,
  sourceNode: any,
  visit: (target: any, sourceTarget: any) => void,
) {
  collectAstPatternSourceTargetsRec(pattern, createAstPatternSourceTarget(sourceNode), visit);
}

export function collectAstPatternCarrierSourceTargets<T extends AstCapabilityAlias>(
  pattern: any,
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternCarrierSourceTargetsFromSourceTarget(
    pattern,
    createAstPatternSourceTarget(sourceNode),
    aliases,
    identifierBindings,
    visit,
  );
}

export function collectAstPatternCarrierSourceTargetsFromSourceTarget<T extends AstCapabilityAlias>(
  pattern: any,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
    const targetLookup = getAstPatternTargetAliasLookup(target);
    if (!targetLookup) {
      return;
    }
    collectAstCarrierSourceTargets(
      target,
      targetLookup.aliasName,
      patternSourceTarget,
      aliases,
      identifierBindings,
      visit,
    );
  });
}

export function collectAstPatternSourceTargetsRec(
  pattern: any,
  sourceTarget: any,
  visit: (target: any, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'Identifier' || unwrapped.type === 'MemberExpression') {
    visit(unwrapped, sourceTarget);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternSourceTargetsRec(unwrapped.left, sourceTarget, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternSourceTargetsRec(unwrapped.argument, sourceTarget, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      if (!member) {
        continue;
      }
      collectAstPatternSourceTargetsRec(property.value, getAstPatternMemberSourceTarget(sourceTarget, member), visit);
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      if (unwrapped.elements[index]?.type === 'RestElement') {
        continue;
      }
      collectAstPatternSourceTargetsRec(
        unwrapped.elements[index],
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        visit,
      );
    }
  }
}

export function collectAstPatternRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  pattern: any,
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternRestCarrierSourceTargetsRec(
    pattern,
    createAstPatternSourceTarget(sourceNode),
    aliases,
    identifierBindings,
    visit,
  );
}

export function collectAstPatternRestCarrierSourceTargetsRec<T extends AstCapabilityAlias>(
  pattern: any,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternRestCarrierSourceTargetsRec(unwrapped.left, sourceTarget, aliases, identifierBindings, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    const excludedMembers = collectAstObjectPatternStaticMembers(unwrapped);
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstObjectRestCarrierSourceTargets(
          property.argument,
          sourceTarget,
          excludedMembers,
          aliases,
          identifierBindings,
          visit,
        );
        continue;
      }
      if (property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      if (!member) {
        continue;
      }
      collectAstPatternRestCarrierSourceTargetsRec(
        property.value,
        getAstPatternMemberSourceTarget(sourceTarget, member),
        aliases,
        identifierBindings,
        visit,
      );
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element) {
        continue;
      }
      if (element.type === 'RestElement') {
        collectAstArrayRestCarrierSourceTargets(
          element.argument,
          sourceTarget,
          index,
          aliases,
          identifierBindings,
          visit,
        );
        continue;
      }
      collectAstPatternRestCarrierSourceTargetsRec(
        element,
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        aliases,
        identifierBindings,
        visit,
      );
    }
  }
}

export function collectAstObjectRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  sourceTarget: any,
  excludedMembers: Set<string>,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const targetLookup = getAstPatternTargetAliasLookup(target);
  if (!targetLookup) {
    return;
  }
  collectAstCarrierCandidateMembers(sourceTarget?.node, aliases, identifierBindings).forEach((member) => {
    if (excludedMembers.has(member)) {
      return;
    }
    const memberSourceTarget = getAstStaticCarrierMemberSourceTarget(sourceTarget?.node, member);
    if (!memberSourceTarget) {
      return;
    }
    visit({
      sourceTarget: memberSourceTarget,
      target,
      targetAliasName: `${targetLookup.aliasName}.${member}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || excludedMembers.has(firstMember)) {
        return;
      }
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetLookup.aliasName}.${suffix}`,
      });
    },
  );
  collectAstObjectSpreadCarrierCopies(
    sourceTarget?.node,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || excludedMembers.has(firstMember)) {
        return;
      }
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetLookup.aliasName}.${suffix}`,
      });
    },
    excludedMembers,
  );
}

export function collectAstCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  targetAliasName: string,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstKnownCarrierMembers(sourceTarget?.node, (member, valueNode) => {
    visit({
      sourceTarget: createAstPatternSourceTarget(valueNode),
      target,
      targetAliasName: `${targetAliasName}.${member}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetAliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetAliasName}.${suffix}`,
      });
    },
  );
  collectAstLiteralSpreadCarrierCopies(
    sourceTarget?.node,
    targetAliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetAliasName}.${suffix}`,
      });
    },
  );
  collectAstDynamicCarrierSourceTargets(sourceTarget?.node, (suffix, dynamicSourceTarget) => {
    visit({
      sourceTarget: dynamicSourceTarget,
      target,
      targetAliasName: `${targetAliasName}.${suffix}`,
    });
  });
}

export function collectAstArrayRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  sourceTarget: any,
  restStartIndex: number,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const targetLookup = getAstPatternTargetAliasLookup(target);
  if (!targetLookup) {
    return;
  }
  const mapRestSuffix = (suffix: string) => {
    const [sourceIndexText, ...restSuffixParts] = suffix.split('.');
    const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
    if (sourceIndexText === AST_DYNAMIC_MEMBER_ALIAS) {
      return `${AST_DYNAMIC_MEMBER_ALIAS}${restSuffix}`;
    }
    const sourceIndex = Number(sourceIndexText);
    if (!Number.isInteger(sourceIndex) || sourceIndex < restStartIndex) {
      return '';
    }
    return `${sourceIndex - restStartIndex}${restSuffix}`;
  };
  collectAstKnownCarrierMembers(sourceTarget?.node, (member, valueNode) => {
    const sourceIndex = Number(member);
    if (!Number.isInteger(sourceIndex) || sourceIndex < restStartIndex) {
      return;
    }
    visit({
      sourceTarget: createAstPatternSourceTarget(valueNode),
      target,
      targetAliasName: `${targetLookup.aliasName}.${sourceIndex - restStartIndex}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      const mappedSuffix = mapRestSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetLookup.aliasName}.${mappedSuffix}`,
      });
    },
  );
  collectAstArraySpreadCarrierCopies(
    sourceTarget?.node,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      const mappedSuffix = mapRestSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetLookup.aliasName}.${mappedSuffix}`,
      });
    },
  );
}

export function collectAstRestCarrierAliasCopies<T extends AstCapabilityAlias>(
  sourceTarget: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias: T) => void,
) {
  const sourceAliasName = sourceTarget?.aliasName;
  if (!sourceAliasName) {
    return;
  }
  const sourcePrefix = `${sourceAliasName}.`;
  const sourceIndex = sourceTarget.index || 0;
  const rootName = sourceTarget.rootName || getAstAliasRootName(sourceAliasName);
  const copied = new Set<string>();
  const sourceAliases = aliases
    .filter((entry) => entry.name.startsWith(sourcePrefix) && sourceIndex >= entry.start && sourceIndex < entry.end)
    .sort((left, right) => right.start - left.start);
  for (const sourceAlias of sourceAliases) {
    const suffix = sourceAlias.name.slice(sourcePrefix.length);
    if (!suffix || copied.has(`${targetAliasName}.${suffix}`)) {
      continue;
    }
    if (hasAstShadowBinding(rootName, sourceIndex, sourceAlias, identifierBindings)) {
      continue;
    }
    copied.add(`${targetAliasName}.${suffix}`);
    visit(suffix, sourceAlias);
  }
}

export function collectAstLiteralSpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
) {
  collectAstObjectSpreadCarrierCopies(sourceNode, targetAliasName, aliases, identifierBindings, visit);
  collectAstArraySpreadCarrierCopies(sourceNode, targetAliasName, aliases, identifierBindings, visit);
}

export function collectAstCarrierCandidateMembers<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const members = new Set<string>();
  collectAstStaticCarrierMembers(sourceNode, (member) => members.add(member));
  collectAstKnownCarrierMembers(sourceNode, (member) => members.add(member));
  collectAstLiteralSpreadCarrierCopies(sourceNode, '__candidate__', aliases, identifierBindings, (suffix) => {
    const firstMember = suffix.split('.')[0];
    if (firstMember) {
      members.add(firstMember);
    }
  });
  collectAstDynamicCarrierSourceTargets(sourceNode, (suffix) => {
    const firstMember = suffix.split('.')[0];
    if (firstMember) {
      members.add(firstMember);
    }
  });
  return members;
}

export function collectAstObjectSpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
  excludedMembers = new Set<string>(),
) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ObjectExpression') {
    return;
  }
  const seenMembers = new Set<string>(excludedMembers);
  for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
    const property = unwrapped.properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'Property') {
      const member = getAstStaticMemberKey(property);
      if (member) {
        seenMembers.add(member);
      }
      continue;
    }
    if (property.type !== 'SpreadElement') {
      continue;
    }
    const sourceTarget = createAstPatternSourceTarget(property.argument);
    const visitSpreadMember = (suffix: string, sourceAlias?: T, spreadSourceTarget?: any) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || seenMembers.has(firstMember)) {
        return;
      }
      seenMembers.add(firstMember);
      visit(suffix, sourceAlias, spreadSourceTarget);
    };
    collectAstRestCarrierAliasCopies(
      sourceTarget,
      targetAliasName,
      aliases,
      identifierBindings,
      (suffix, sourceAlias) => visitSpreadMember(suffix, sourceAlias, sourceTarget),
    );
    collectAstStaticCarrierMemberSourceTargets(property.argument, (suffix, spreadSourceTarget) =>
      visitSpreadMember(suffix, undefined, spreadSourceTarget),
    );
    collectAstDynamicCarrierSourceTargets(property.argument, (suffix, dynamicSourceTarget) => {
      visitSpreadMember(suffix, undefined, dynamicSourceTarget);
    });
  }
}

export function collectAstDynamicCarrierSourceTargets(
  sourceNode: any,
  visit: (suffix: string, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ObjectExpression') {
    return;
  }
  for (const property of unwrapped.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticMemberKey(property);
    if (member) {
      continue;
    }
    visit(
      AST_DYNAMIC_MEMBER_ALIAS,
      createAstAmbiguousSourceTarget(createAstPatternSourceTarget(property.value || property)),
    );
  }
}

export function collectAstArraySpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ArrayExpression') {
    return;
  }
  let concreteIndexOffset = 0;
  let hasUnboundedSpread = false;
  for (const element of unwrapped.elements || []) {
    if (!element) {
      if (!hasUnboundedSpread) {
        concreteIndexOffset += 1;
      }
      continue;
    }
    if (element.type !== 'SpreadElement') {
      if (!hasUnboundedSpread) {
        concreteIndexOffset += 1;
        continue;
      }
      visit(AST_DYNAMIC_MEMBER_ALIAS, undefined, createAstPatternSourceTarget(element));
      continue;
    }
    if (hasUnboundedSpread) {
      const sourceTarget = createAstPatternSourceTarget(element.argument);
      const mapUnboundedSpreadSuffix = (suffix: string) => {
        const [, ...restSuffixParts] = suffix.split('.');
        const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
        return `${AST_DYNAMIC_MEMBER_ALIAS}${restSuffix}`;
      };
      collectAstRestCarrierAliasCopies(
        sourceTarget,
        targetAliasName,
        aliases,
        identifierBindings,
        (suffix, sourceAlias) => {
          visit(mapUnboundedSpreadSuffix(suffix), sourceAlias, sourceTarget);
        },
      );
      collectAstStaticCarrierMemberSourceTargets(element.argument, (suffix, spreadSourceTarget) => {
        visit(mapUnboundedSpreadSuffix(suffix), undefined, spreadSourceTarget);
      });
      continue;
    }
    const sourceTarget = createAstPatternSourceTarget(element.argument);
    const mapSpreadSuffix = (suffix: string) => {
      const [sourceIndexText, ...restSuffixParts] = suffix.split('.');
      const sourceIndex = Number(sourceIndexText);
      if (!Number.isInteger(sourceIndex) || sourceIndex < 0) {
        return '';
      }
      const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
      const targetIndex = hasUnboundedSpread ? sourceIndex : sourceIndex + concreteIndexOffset;
      return `${targetIndex}${restSuffix}`;
    };
    collectAstRestCarrierAliasCopies(
      sourceTarget,
      targetAliasName,
      aliases,
      identifierBindings,
      (suffix, sourceAlias) => {
        const mappedSuffix = mapSpreadSuffix(suffix);
        if (!mappedSuffix) {
          return;
        }
        visit(mappedSuffix, sourceAlias, sourceTarget);
      },
    );
    collectAstStaticCarrierMemberSourceTargets(element.argument, (suffix, spreadSourceTarget) => {
      const mappedSuffix = mapSpreadSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit(mappedSuffix, undefined, spreadSourceTarget);
    });
    const spreadLength = getAstStaticArrayElementCount(element.argument);
    if (!hasUnboundedSpread && typeof spreadLength === 'number') {
      concreteIndexOffset += spreadLength;
      continue;
    }
    hasUnboundedSpread = true;
  }
}

export function collectAstStaticCarrierMemberSourceTargets(
  node: any,
  visit: (member: string, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    const seenMembers = new Set<string>();
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type === 'SpreadElement') {
        collectAstStaticCarrierMemberSourceTargets(property.argument, (member, sourceTarget) => {
          if (seenMembers.has(member)) {
            return;
          }
          seenMembers.add(member);
          visit(member, sourceTarget);
        });
        continue;
      }
      if (property.type !== 'Property') {
        break;
      }
      const member = getAstStaticMemberKey(property);
      if (!member) {
        break;
      }
      if (seenMembers.has(member)) {
        continue;
      }
      seenMembers.add(member);
      visit(member, createAstPatternSourceTarget(property.value));
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    let targetIndex = 0;
    for (const element of unwrapped.elements || []) {
      if (!element) {
        targetIndex += 1;
        continue;
      }
      if (element.type !== 'SpreadElement') {
        visit(String(targetIndex), createAstPatternSourceTarget(element));
        targetIndex += 1;
        continue;
      }
      const spreadLength = getAstStaticArrayElementCount(element.argument);
      if (typeof spreadLength !== 'number') {
        return;
      }
      collectAstStaticCarrierMemberSourceTargets(element.argument, (member, sourceTarget) => {
        const sourceIndex = Number(member);
        if (!Number.isInteger(sourceIndex) || sourceIndex < 0) {
          return;
        }
        visit(String(targetIndex + sourceIndex), sourceTarget);
      });
      targetIndex += spreadLength;
    }
  }
}

export function getAstStaticArrayElementCount(node: any): number | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'ArrayExpression') {
    return undefined;
  }
  let count = 0;
  for (const element of unwrapped.elements || []) {
    if (!element) {
      count += 1;
      continue;
    }
    if (element.type !== 'SpreadElement') {
      count += 1;
      continue;
    }
    const spreadLength = getAstStaticArrayElementCount(element.argument);
    if (typeof spreadLength !== 'number') {
      return undefined;
    }
    count += spreadLength;
  }
  return count;
}

export function collectAstObjectPatternStaticMembers(pattern: any) {
  const members = new Set<string>();
  for (const property of pattern?.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (member) {
      members.add(member);
    }
  }
  return members;
}

export function getAstPatternTargetAliasLookup(
  target: any,
): { aliasName: string; index: number; rootName: string } | undefined {
  const unwrapped = unwrapAstChainExpression(target);
  if (unwrapped?.type === 'Identifier') {
    return {
      aliasName: unwrapped.name,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      rootName: unwrapped.name,
    };
  }
  return getAstMemberAliasLookup(unwrapped);
}

export function collectAstPatternMemberExpressions(pattern: any, visit: (memberNode: any) => void) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'MemberExpression') {
    visit(unwrapped);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternMemberExpressions(unwrapped.left, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternMemberExpressions(unwrapped.argument, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      collectAstPatternMemberExpressions(property.type === 'Property' ? property.value : property.argument, visit);
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (const element of unwrapped.elements || []) {
      collectAstPatternMemberExpressions(element, visit);
    }
  }
}

export function createAstPatternSourceTarget(node: any) {
  const sourceRoot = getAstPatternSourceRoot(node);
  return {
    node,
    aliasName: sourceRoot?.aliasName,
    rootName: sourceRoot?.rootName,
    index: sourceRoot?.index ?? (typeof node?.start === 'number' ? node.start : 0),
  };
}

export function createMaybeAstPatternSourceTarget(node: any) {
  return node ? createAstPatternSourceTarget(node) : undefined;
}

export function getAstPatternMemberSourceTarget(sourceTarget: any, member: string) {
  const memberSourceTarget = getAstStaticCarrierMemberSourceTarget(sourceTarget?.node, member);
  if (memberSourceTarget) {
    return memberSourceTarget;
  }
  const sourceRoot = sourceTarget?.aliasName ? sourceTarget : getAstPatternSourceRoot(sourceTarget?.node);
  if (sourceRoot?.aliasName) {
    return {
      aliasName: `${sourceRoot.aliasName}.${member}`,
      rootName: sourceRoot.rootName,
      index: sourceRoot.index ?? sourceTarget?.index ?? 0,
    };
  }
  return { index: sourceTarget?.index ?? 0 };
}

export function getAstStaticCarrierMemberSourceTarget(node: any, member: string): any {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ObjectExpression') {
    return getAstObjectCarrierMemberSourceTarget(unwrapped, member);
  }
  if (unwrapped.type === 'ArrayExpression') {
    return getAstArrayCarrierMemberSourceTarget(unwrapped, member);
  }
  return undefined;
}

export function getAstObjectCarrierMemberSourceTarget(node: any, member: string): any {
  const fallbackSourceTargets: any[] = [];
  for (let index = (node.properties || []).length - 1; index >= 0; index -= 1) {
    const property = node.properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'SpreadElement') {
      const spreadTarget = getAstSpreadMemberSourceTarget(property.argument, member);
      if (spreadTarget) {
        fallbackSourceTargets.push(spreadTarget);
      }
      continue;
    }
    if (property.type !== 'Property') {
      return createAstFallbackSourceTarget(fallbackSourceTargets, property.start || node.start || 0);
    }
    const propertyKey = getAstStaticMemberKey(property);
    if (!propertyKey) {
      fallbackSourceTargets.push(createAstAmbiguousSourceTarget(createAstPatternSourceTarget(property.value)));
      continue;
    }
    if (propertyKey !== member) {
      continue;
    }
    const propertyTarget = createAstPatternSourceTarget(property.value);
    if (!fallbackSourceTargets.length) {
      return propertyTarget;
    }
    return createAstFallbackSourceTarget(
      [...fallbackSourceTargets, propertyTarget],
      typeof property.value?.start === 'number' ? property.value.start : property.start || node.start || 0,
    );
  }
  return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
}

export function getAstArrayCarrierMemberSourceTarget(node: any, member: string): any {
  const targetIndex = Number(member);
  if (!Number.isInteger(targetIndex) || targetIndex < 0) {
    return undefined;
  }
  const fallbackSourceTargets: any[] = [];
  let concreteIndex = 0;
  let hasSpreadBefore = false;
  for (const element of node.elements || []) {
    if (!element) {
      if (!hasSpreadBefore && concreteIndex === targetIndex && !fallbackSourceTargets.length) {
        return undefined;
      }
      concreteIndex += 1;
      continue;
    }
    if (element.type === 'SpreadElement') {
      const spreadLength = getAstStaticArrayElementCount(element.argument);
      if (!hasSpreadBefore && typeof spreadLength === 'number') {
        const spreadIndex = targetIndex - concreteIndex;
        if (spreadIndex < 0) {
          return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
        }
        if (spreadIndex < spreadLength) {
          return getAstSpreadMemberSourceTarget(element.argument, String(spreadIndex));
        }
        concreteIndex += spreadLength;
        continue;
      }
      const spreadMember = hasSpreadBefore ? String(targetIndex) : String(targetIndex - concreteIndex);
      if (targetIndex >= concreteIndex || hasSpreadBefore) {
        const spreadTarget = getAstSpreadMemberSourceTarget(element.argument, spreadMember);
        if (spreadTarget) {
          fallbackSourceTargets.push(hasSpreadBefore ? createAstAmbiguousSourceTarget(spreadTarget) : spreadTarget);
        }
      }
      hasSpreadBefore = true;
      continue;
    }
    if (!hasSpreadBefore && concreteIndex === targetIndex) {
      const elementTarget = createAstPatternSourceTarget(element);
      if (!fallbackSourceTargets.length) {
        return elementTarget;
      }
      return createAstFallbackSourceTarget(
        [...fallbackSourceTargets, elementTarget],
        typeof element.start === 'number' ? element.start : node.start || 0,
      );
    }
    if (hasSpreadBefore) {
      fallbackSourceTargets.push(createAstAmbiguousSourceTarget(createAstPatternSourceTarget(element)));
    }
    concreteIndex += 1;
  }
  return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
}

export function createAstAmbiguousSourceTarget(sourceTarget: any) {
  return sourceTarget ? { ...sourceTarget, ambiguous: true } : undefined;
}

export function getAstSpreadMemberSourceTarget(spreadArgument: any, member: string): any {
  const sourceRoot = getAstPatternSourceRoot(spreadArgument);
  if (sourceRoot?.aliasName) {
    return {
      aliasName: `${sourceRoot.aliasName}.${member}`,
      rootName: sourceRoot.rootName,
      index: sourceRoot.index ?? (typeof spreadArgument?.start === 'number' ? spreadArgument.start : 0),
    };
  }
  return getAstStaticCarrierMemberSourceTarget(spreadArgument, member);
}

export function createAstFallbackSourceTarget(fallbackSourceTargets: any[], index: number) {
  const targets = fallbackSourceTargets.filter(Boolean);
  return targets.length
    ? {
        fallbackSourceTargets: targets,
        index,
      }
    : undefined;
}

export function getAstPatternSourceRoot(node: any): { aliasName: string; index: number; rootName: string } | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type === 'Identifier') {
    return {
      aliasName: unwrapped.name,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      rootName: unwrapped.name,
    };
  }
  return getAstMemberAliasLookup(unwrapped);
}

export function getAstStaticCarrierMemberValue(node: any, member: string) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ObjectExpression') {
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type !== 'Property') {
        return undefined;
      }
      const propertyKey = getAstStaticMemberKey(property);
      if (!propertyKey) {
        return undefined;
      }
      if (propertyKey === member) {
        return property.value;
      }
    }
  }
  if (unwrapped.type === 'ArrayExpression') {
    const index = Number(member);
    if (Number.isInteger(index) && index >= 0) {
      const element = unwrapped.elements?.[index];
      return element && element.type !== 'SpreadElement' ? element : undefined;
    }
  }
  return undefined;
}

export function collectAstKnownCarrierMembers(
  node: any,
  visit: (member: string, valueNode: any, aliasNode?: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    const seenMembers = new Set<string>();
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type !== 'Property') {
        return;
      }
      const member = getAstStaticMemberKey(property);
      if (!member) {
        return;
      }
      if (seenMembers.has(member)) {
        continue;
      }
      seenMembers.add(member);
      visit(member, property.value, property.value || property);
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element || element.type === 'SpreadElement') {
        return;
      }
      visit(String(index), element, element);
    }
  }
}

export function collectAstStaticCarrierMembers(
  node: any,
  visit: (member: string, valueNode: any, aliasNode?: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    for (const property of unwrapped.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticMemberKey(property);
      if (member) {
        visit(member, property.value, property.value || property);
      }
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element || element.type === 'SpreadElement') {
        continue;
      }
      visit(String(index), element, element);
    }
  }
}

export function getAstBindingIdentifierNode(node: any): any {
  if (node?.type === 'Identifier') {
    return node;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'Identifier') {
    return node.left;
  }
  return undefined;
}

export function getAstBindingIdentifierName(node: any): string {
  if (node?.type === 'Identifier') {
    return node.name;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'Identifier') {
    return node.left.name;
  }
  return '';
}

export function getAstObjectPatternFromValue(node: any): any | undefined {
  if (node?.type === 'ObjectPattern') {
    return node;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'ObjectPattern') {
    return node.left;
  }
  return undefined;
}

export function trimAstAliasesAfterWrites<
  T extends SourceRange & { declarationStart?: number; executionScope: SourceRange; name: string },
>(aliases: T[], writes: AstIdentifierWrite[], identifierBindings: AstIdentifierBinding[]): T[] {
  return aliases.map((alias) => {
    const aliasDeclarationStart = alias.declarationStart ?? alias.start;
    const aliasRootName = getAstAliasRootName(alias.name);
    const nextWrite = writes
      .filter(
        (write) =>
          (write.name === alias.name || (alias.name.includes('.') && write.name === aliasRootName)) &&
          write.index > aliasDeclarationStart &&
          write.index >= alias.start &&
          write.index < alias.end &&
          write.alwaysRunsInExecutionScope &&
          isSameAstRange(write.executionScope, alias.executionScope) &&
          !hasAstShadowBinding(aliasRootName, write.index, alias, identifierBindings),
      )
      .sort((left, right) => left.index - right.index)[0];
    return nextWrite ? { ...alias, end: nextWrite.index } : alias;
  });
}

export function resolveRunJsStaticString(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  if (!node) {
    return undefined;
  }
  const resolved = resolveAstResourceTypeExpression(node, source, stringBindings, identifierBindings);
  return resolved.status === 'resolved' ? resolved.value : undefined;
}

export function resolveRunJsStaticObjectExpression(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
) {
  return resolveRunJsStaticObjectExpressionRec(node, identifierBindings, staticFilterValueBindings);
}

export function resolveRunJsStaticObjectExpressionRec(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  seen: Set<StaticFilterValueBinding> = new Set<StaticFilterValueBinding>(),
): any | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ObjectExpression') {
    return unwrapped;
  }
  if (unwrapped.type === 'Identifier') {
    const binding = resolveAstAliasBinding(
      unwrapped.name,
      unwrapped.start || 0,
      staticFilterValueBindings,
      identifierBindings,
    );
    if (!binding || seen.has(binding)) {
      return undefined;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(binding);
    return resolveRunJsStaticObjectExpressionRec(
      binding.valueNode,
      identifierBindings,
      staticFilterValueBindings,
      nextSeen,
    );
  }
  if (unwrapped.type === 'MemberExpression') {
    const object = resolveRunJsStaticObjectExpressionRec(
      unwrapped.object,
      identifierBindings,
      staticFilterValueBindings,
      seen,
    );
    if (!object) {
      return undefined;
    }
    const memberName = getAstStaticPropertyName(unwrapped);
    if (!memberName) {
      return undefined;
    }
    const property = getRunJsObjectProperty(object, [memberName], identifierBindings, staticFilterValueBindings);
    return resolveRunJsStaticObjectExpressionRec(property?.value, identifierBindings, staticFilterValueBindings, seen);
  }
  return undefined;
}

export function getRunJsObjectProperty(
  node: any,
  names: string[],
  identifierBindings?: AstIdentifierBinding[],
  staticFilterValueBindings?: StaticFilterValueBinding[],
) {
  const lookup = getRunJsObjectPropertyLookup(node, names, identifierBindings, staticFilterValueBindings);
  return lookup.status === 'found' ? lookup.property : undefined;
}

export function getRunJsObjectPropertyByPath(
  node: any,
  members: string[],
  identifierBindings?: AstIdentifierBinding[],
  staticFilterValueBindings?: StaticFilterValueBinding[],
) {
  let current = unwrapAstChainExpression(node);
  let property: any;
  for (let index = 0; index < members.length; index += 1) {
    const member = members[index];
    property = getRunJsObjectProperty(current, [member], identifierBindings, staticFilterValueBindings);
    if (!property) {
      return undefined;
    }
    current = resolveRunJsStaticObjectExpression(
      property.value,
      identifierBindings || [],
      staticFilterValueBindings || [],
    );
    if (!current && index < members.length - 1) {
      return undefined;
    }
  }
  return property;
}

export function getRunJsObjectPropertyLookup(
  node: any,
  names: string[],
  identifierBindings?: AstIdentifierBinding[],
  staticFilterValueBindings?: StaticFilterValueBinding[],
): { property: any; status: 'found' } | { status: 'missing' | 'unknown' } {
  const object = unwrapAstChainExpression(node);
  if (object?.type !== 'ObjectExpression') {
    return { status: 'missing' };
  }
  const nameSet = new Set(names.map((name) => name.toLowerCase()));
  const properties = object.properties || [];
  for (let index = properties.length - 1; index >= 0; index -= 1) {
    const property = properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'SpreadElement') {
      if (identifierBindings && staticFilterValueBindings) {
        const spreadObject = resolveRunJsStaticObjectExpression(
          property.argument,
          identifierBindings,
          staticFilterValueBindings,
        );
        if (spreadObject) {
          const spreadLookup = getRunJsObjectPropertyLookup(
            spreadObject,
            names,
            identifierBindings,
            staticFilterValueBindings,
          );
          if (spreadLookup.status !== 'missing') {
            return spreadLookup;
          }
          continue;
        }
      }
      return { status: 'unknown' };
    }
    if (property.type !== 'Property') {
      return { status: 'unknown' };
    }
    const propertyName = normalizeText(getAstStaticPropertyName(property));
    if (!propertyName) {
      return { status: 'unknown' };
    }
    if (nameSet.has(propertyName.toLowerCase())) {
      return { status: 'found', property };
    }
  }
  return { status: 'missing' };
}
