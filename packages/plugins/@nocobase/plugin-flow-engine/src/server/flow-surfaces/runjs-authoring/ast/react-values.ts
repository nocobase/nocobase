/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AstIdentifierBinding, CtxRootAlias, ReactDefaultAlias, ReactNamespaceAlias } from '../internal-types';
import { unwrapAstChainExpression } from './bindings';
import {
  getAstStaticPropertyName,
  compareAstAliasPrecedence,
  hasAstActiveBinding,
  isAstCtxApiAliasAssignmentOperator,
  isAstDynamicMemberAliasMatch,
  isCtxRootFromAst,
  resolveAstAliasBinding,
  resolveAstDynamicAliasBinding,
  resolveAstMemberAliasBinding,
  resolveAstNamedAliasBinding,
} from './static-values';

export function getReactNamespaceCapabilityFromAstPatternSource(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  if (sourceTarget?.ambiguous) {
    return '';
  }
  if (sourceTarget?.node) {
    const capability = getReactNamespaceCapabilityFromAst(
      sourceTarget.node,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (capability) {
      return capability;
    }
  }
  const fallbackCapability = getReactNamespaceCapabilityFromAstPatternFallbackSources(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
  );
  if (fallbackCapability) {
    return fallbackCapability;
  }
  if (!sourceTarget?.aliasName) {
    return '';
  }
  const directCapability = getDirectReactNamespaceCapabilityFromAstAliasName(sourceTarget, identifierBindings);
  if (directCapability) {
    return directCapability;
  }
  const alias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  return alias?.capability || '';
}

export function getReactDefaultNamespaceCapabilityFromAstPatternSource(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
  defaultAliases: ReactDefaultAlias[] = [],
) {
  if (sourceTarget?.node) {
    const capability = getReactDefaultNamespaceCapabilityFromAst(
      sourceTarget.node,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
    if (capability) {
      return capability;
    }
  }
  const fallbackCapability = getReactDefaultCapabilityFromAstPatternFallbackSources(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
    defaultAliases,
  );
  if (fallbackCapability) {
    return fallbackCapability;
  }
  if (!sourceTarget?.aliasName) {
    return '';
  }
  const directCapability = getDirectReactDefaultCapabilityFromAstAliasName(sourceTarget, identifierBindings);
  if (directCapability) {
    return directCapability;
  }
  const exactAlias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    defaultAliases,
    identifierBindings,
  );
  if (exactAlias) {
    return exactAlias.capability;
  }
  const dynamicAlias = resolveAstDynamicAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    defaultAliases,
    identifierBindings,
  );
  const exactNamespaceAlias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  if (dynamicAlias && (!exactNamespaceAlias || compareAstAliasPrecedence(dynamicAlias, exactNamespaceAlias) >= 0)) {
    return dynamicAlias.capability;
  }
  const exactNamespaceCapability = getReactNamespaceCapabilityFromAstPatternSource(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
  );
  if (exactNamespaceCapability) {
    return '';
  }
  if (dynamicAlias) {
    return dynamicAlias.capability;
  }
  const namespaceAliasName = getAstDefaultMemberAliasBase(sourceTarget.aliasName);
  if (!namespaceAliasName) {
    return '';
  }
  const directNamespaceCapability = getDirectReactNamespaceCapabilityFromAstAliasName(
    {
      ...sourceTarget,
      aliasName: namespaceAliasName,
    },
    identifierBindings,
  );
  if (directNamespaceCapability) {
    return `${directNamespaceCapability}.default`;
  }
  const namespaceAlias = resolveAstNamedAliasBinding(
    namespaceAliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  return namespaceAlias ? `${namespaceAlias.capability}.default` : '';
}

export function getReactNamespaceCapabilityFromAstPatternFallbackSources(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  for (const fallbackTarget of sourceTarget?.fallbackSourceTargets || []) {
    const capability = getReactNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (capability) {
      return capability;
    }
  }
  return '';
}

export function getReactDefaultCapabilityFromAstPatternFallbackSources(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[],
) {
  for (const fallbackTarget of sourceTarget?.fallbackSourceTargets || []) {
    const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
    if (capability) {
      return capability;
    }
    const namespaceCapability = getReactNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (namespaceCapability) {
      return '';
    }
  }
  return '';
}

export function getAstDefaultMemberAliasBase(aliasName: string) {
  const suffix = '.default';
  return aliasName.endsWith(suffix) ? aliasName.slice(0, -suffix.length) : '';
}

export function getDirectReactNamespaceCapabilityFromAstAliasName(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
) {
  const aliasName = String(sourceTarget?.aliasName || '');
  const index = sourceTarget?.index || 0;
  if (aliasName === 'React' && !hasAstActiveBinding('React', index, identifierBindings)) {
    return 'React';
  }
  if (
    aliasName === 'ctx.React' &&
    sourceTarget.rootName === 'ctx' &&
    !hasAstActiveBinding('ctx', index, identifierBindings)
  ) {
    return 'ctx.React';
  }
  if (
    aliasName === 'ctx.libs.React' &&
    sourceTarget.rootName === 'ctx' &&
    !hasAstActiveBinding('ctx', index, identifierBindings)
  ) {
    return 'ctx.libs.React';
  }
  return '';
}

export function getDirectReactDefaultCapabilityFromAstAliasName(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
) {
  const namespaceAliasName = getAstDefaultMemberAliasBase(String(sourceTarget?.aliasName || ''));
  if (!namespaceAliasName) {
    return '';
  }
  const namespaceCapability = getDirectReactNamespaceCapabilityFromAstAliasName(
    {
      ...sourceTarget,
      aliasName: namespaceAliasName,
    },
    identifierBindings,
  );
  return namespaceCapability ? `${namespaceCapability}.default` : '';
}

export function isAstPatternDefaultValueSuppressedByReactNamespace(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  if (!sourceTarget) {
    return false;
  }
  return Boolean(
    getReactNamespaceCapabilityFromAstPatternSource(sourceTarget, identifierBindings, namespaceAliases, ctxRootAliases),
  );
}

export function getReactNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getReactNamespaceCapabilityFromAst(unwrapped.consequent, identifierBindings, aliases, ctxRootAliases) ||
      getReactNamespaceCapabilityFromAst(unwrapped.alternate, identifierBindings, aliases, ctxRootAliases)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      getReactNamespaceCapabilityFromAst(unwrapped.left, identifierBindings, aliases, ctxRootAliases) ||
      getReactNamespaceCapabilityFromAst(unwrapped.right, identifierBindings, aliases, ctxRootAliases)
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getReactNamespaceCapabilityFromAst(
      expressions[expressions.length - 1],
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getReactNamespaceCapabilityFromAst(unwrapped.right, identifierBindings, aliases, ctxRootAliases);
  }
  if (unwrapped.type === 'Identifier') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    const alias = resolveAstAliasBinding(unwrapped.name, index, aliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  if (unwrapped.type === 'MemberExpression') {
    const alias = resolveAstMemberAliasBinding(unwrapped, aliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  return getDirectReactNamespaceCapabilityFromAst(unwrapped, identifierBindings, ctxRootAliases);
}

export function getReactDefaultNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
  defaultAliases: ReactDefaultAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.consequent,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      ) ||
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.alternate,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      )
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.left,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      ) ||
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.right,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      )
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getReactDefaultNamespaceCapabilityFromAst(
      expressions[expressions.length - 1],
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getReactDefaultNamespaceCapabilityFromAst(
      unwrapped.right,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
  }
  if (unwrapped.type === 'Identifier') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    const alias = resolveAstAliasBinding(unwrapped.name, index, defaultAliases, identifierBindings);
    return alias?.capability || '';
  }
  if (unwrapped.type === 'MemberExpression') {
    const alias = resolveAstMemberAliasBinding(unwrapped, defaultAliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  if (unwrapped.type !== 'MemberExpression' || getAstStaticPropertyName(unwrapped) !== 'default') {
    return '';
  }
  const namespace = getReactNamespaceCapabilityFromAst(unwrapped.object, identifierBindings, aliases, ctxRootAliases);
  return namespace ? `${namespace}.default` : '';
}

export function getDirectReactNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'Identifier' && unwrapped.name === 'React') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    return hasAstActiveBinding('React', index, identifierBindings) ? '' : 'React';
  }
  if (unwrapped.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(unwrapped);
  if (propertyName !== 'React') {
    return '';
  }
  if (isCtxRootFromAst(unwrapped.object, ctxRootAliases, identifierBindings)) {
    return 'ctx.React';
  }
  const object = unwrapAstChainExpression(unwrapped.object);
  if (
    object?.type === 'MemberExpression' &&
    getAstStaticPropertyName(object) === 'libs' &&
    isCtxRootFromAst(object.object, ctxRootAliases, identifierBindings)
  ) {
    return 'ctx.libs.React';
  }
  return '';
}
