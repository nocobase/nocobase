/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AstFunctionBinding,
  AstIdentifierBinding,
  AstIdentifierWrite,
  AstStaticObjectAliasCopy,
  SourceRange,
  StaticFilterValueBinding,
  StaticStringBinding,
  StringLiteralBinding,
} from '../internal-types';
import { walkAstAncestor } from './walk';
import {
  findAstAncestor,
  getAstBindingScopeRange,
  getAstExecutionScopeRange,
  isAstFunctionLike,
  isSameAstRange,
  unwrapAstChainExpression,
} from './bindings';
import { getAstSource } from './source';
import { collectAstIdentifierWritesFromAst } from './execution';
import {
  addAstFunctionParamBindings,
  collectAstObjectPatternPathAliases,
  collectAstPatternBindingIdentifiers,
  getAstAliasRootName,
  getAstBindingIdentifierName,
  getAstBindingIdentifierNode,
  getAstMemberAliasLookup,
  getRunJsObjectPropertyByPath,
  getAstStaticMemberKey,
  getAstStaticPropertyName,
  hasAstShadowBinding,
  resolveAstAliasBinding,
  resolveAstMemberAliasBinding,
  resolveRunJsStaticObjectExpression,
  resolveRunJsStaticString,
  resolveAstStaticStringValue,
  resolveAstStaticTemplateLiteralValue,
} from './static-values';

export function collectAstIdentifierBindingsFromAst(ast: any, source: string): AstIdentifierBinding[] {
  const bindings: AstIdentifierBinding[] = [];
  const addBinding = (
    name: string,
    node: any,
    scope: SourceRange,
    declarationStart?: number,
    unavailableRanges?: SourceRange[],
  ) => {
    if (!name) {
      return;
    }
    bindings.push({
      name,
      declarationStart:
        typeof declarationStart === 'number'
          ? declarationStart
          : typeof node?.start === 'number'
            ? node.start
            : scope.start,
      unavailableRanges,
      start: scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      const unavailableRanges =
        declaration?.kind === 'var' ? undefined : getForHeadUnavailableBindingRanges(declaration, ancestors);
      if (node.id?.type === 'Identifier') {
        const declarationStart =
          declaration?.kind === 'var'
            ? scope.start
            : typeof node.end === 'number'
              ? node.end
              : typeof node.start === 'number'
                ? node.start
                : scope.start;
        addBinding(node.id.name, node.id, scope, declarationStart, unavailableRanges);
        return;
      }
      collectAstPatternBindingDeclarations(node.id, (name, bindingNode, declarationStart) =>
        addBinding(
          name,
          bindingNode,
          scope,
          declaration?.kind === 'var' ? scope.start : declarationStart,
          unavailableRanges,
        ),
      );
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node.id, parentScope, parentScope.start);
      }
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    FunctionExpression(node: any) {
      if (node.id?.type === 'Identifier') {
        bindings.push({
          name: node.id.name,
          start: typeof node.id.start === 'number' ? node.id.start : typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : source.length,
        });
      }
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    ArrowFunctionExpression(node: any) {
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    ClassDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node.id, parentScope);
      }
    },
    ClassExpression(node: any) {
      if (node.id?.type === 'Identifier') {
        bindings.push({
          name: node.id.name,
          start: typeof node.id.start === 'number' ? node.id.start : typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : source.length,
        });
      }
    },
    CatchClause(node: any) {
      const scope = {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : source.length,
      };
      collectAstPatternBindingIdentifiers(node.param, (name, bindingNode) => addBinding(name, bindingNode, scope));
    },
  });

  return bindings;
}

function getForHeadUnavailableBindingRanges(declaration: any, ancestors: any[]): SourceRange[] | undefined {
  const parent = ancestors[ancestors.length - 3];
  if (
    (parent?.type !== 'ForOfStatement' && parent?.type !== 'ForInStatement') ||
    parent.left !== declaration ||
    typeof parent.right?.start !== 'number' ||
    typeof parent.right?.end !== 'number'
  ) {
    return undefined;
  }
  return [
    {
      start: parent.right.start,
      end: parent.right.end,
    },
  ];
}

function collectAstPatternBindingDeclarations(
  node: any,
  addBinding: (name: string, node: any, declarationStart: number) => void,
  declarationStart?: number,
) {
  if (!node) {
    return;
  }
  const fallbackStart =
    typeof declarationStart === 'number'
      ? declarationStart
      : typeof node.end === 'number'
        ? node.end
        : typeof node.start === 'number'
          ? node.start
          : 0;
  if (node.type === 'Identifier') {
    addBinding(node.name, node, fallbackStart);
    return;
  }
  if (node.type === 'AssignmentPattern') {
    collectAstPatternBindingDeclarations(
      node.left,
      addBinding,
      typeof node.end === 'number' ? node.end : fallbackStart,
    );
    return;
  }
  if (node.type === 'RestElement') {
    collectAstPatternBindingDeclarations(
      node.argument,
      addBinding,
      typeof node.end === 'number' ? node.end : fallbackStart,
    );
    return;
  }
  if (node.type === 'ArrayPattern') {
    for (const element of node.elements || []) {
      collectAstPatternBindingDeclarations(element, addBinding);
    }
    return;
  }
  if (node.type === 'ObjectPattern') {
    for (const property of node.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternBindingDeclarations(
          property.argument,
          addBinding,
          typeof property.end === 'number' ? property.end : undefined,
        );
        continue;
      }
      if (property.type === 'Property') {
        collectAstPatternBindingDeclarations(property.value, addBinding);
      }
    }
  }
}

export function collectAstFunctionBindingsFromAst(ast: any, source: string): AstFunctionBinding[] {
  const bindings: AstFunctionBinding[] = [];
  const addBinding = (
    name: string,
    functionNode: any,
    scope: SourceRange,
    declarationNode: any,
    bindingStart = scope.start,
    hoisted = false,
  ) => {
    if (!name || !isAstFunctionLike(functionNode)) {
      return;
    }
    bindings.push({
      name,
      functionNode,
      declarationStart:
        typeof declarationNode?.start === 'number'
          ? declarationNode.start
          : typeof functionNode.start === 'number'
            ? functionNode.start
            : scope.start,
      start: bindingStart,
      end: scope.end,
      hoisted,
      scopeStart: scope.start,
    });
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node, parentScope, node.id, parentScope.start, true);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      const functionNode = unwrapAstChainExpression(node.init);
      if (!isAstFunctionLike(functionNode)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      addBinding(
        node.id.name,
        functionNode,
        scope,
        node.id,
        typeof node.id.start === 'number' ? node.id.start : scope.start,
      );
    },
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const functionNode = unwrapAstChainExpression(node.right);
      if (!isAstFunctionLike(functionNode)) {
        return;
      }
      const scope = getAstExecutionScopeRange(ancestors, source.length);
      addBinding(
        node.left.name,
        functionNode,
        scope,
        node.left,
        typeof node.left.start === 'number' ? node.left.start : scope.start,
      );
    },
  });

  return bindings;
}

export function collectStaticStringBindingsFromAst(
  ast: any,
  source: string,
  seedStringBindings: StaticStringBinding[] = [],
  identifierBindings: AstIdentifierBinding[] = [],
): StaticStringBinding[] {
  const bindings: StaticStringBinding[] = [];
  const availableBindings = [...seedStringBindings];
  const writes = collectAstStaticBindingWritesFromAst(ast, source, identifierBindings);
  const aliasCopies = collectAstStaticObjectAliasCopiesFromAst(ast, source, identifierBindings);
  const addBinding = (
    name: string,
    value: string,
    node: any,
    scope: SourceRange,
    declarationStart: number,
    executionScope: SourceRange,
  ) => {
    const binding = {
      declarationStart,
      executionScope,
      name,
      value,
      start: typeof node?.start === 'number' ? node.start : declarationStart,
      end: scope.end,
    };
    bindings.push(binding);
    availableBindings.push(binding);
  };
  const copyMemberBindings = (
    sourceName: string,
    targetName: string,
    node: any,
    scope: SourceRange,
    declarationStart: number,
    executionScope: SourceRange,
  ) => {
    const exactBinding = availableBindings.find(
      (binding) =>
        binding.name === sourceName &&
        isStaticStringBindingActiveAtIndex(binding, declarationStart, writes, identifierBindings),
    );
    if (
      exactBinding &&
      !availableBindings.some((binding) => binding.name === targetName && binding.start >= declarationStart)
    ) {
      addBinding(targetName, exactBinding.value, node, scope, declarationStart, executionScope);
    }
    const prefix = `${sourceName}.`;
    const sourceBindings = availableBindings.filter(
      (binding) =>
        binding.name.startsWith(prefix) &&
        isStaticStringBindingActiveAtIndex(binding, declarationStart, writes, identifierBindings),
    );
    for (const sourceBinding of sourceBindings) {
      const name = `${targetName}${sourceBinding.name.slice(sourceName.length)}`;
      if (availableBindings.some((binding) => binding.name === name && binding.start >= declarationStart)) {
        continue;
      }
      addBinding(name, sourceBinding.value, node, scope, declarationStart, executionScope);
    }
  };
  const collectMemberBindings = (
    prefix: string,
    valueNode: any,
    scope: SourceRange,
    declarationStart: number,
    executionScope: SourceRange,
    bindingStartNode: any,
  ) => {
    const unwrapped = unwrapAstChainExpression(valueNode);
    if (unwrapped?.type !== 'ObjectExpression') {
      return;
    }
    const seenMembers = new Set<string>();
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type === 'SpreadElement') {
        break;
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
      const bindingName = `${prefix}.${member}`;
      const resolved = resolveRunJsStaticString(property.value, source, availableBindings, identifierBindings);
      if (typeof resolved === 'string') {
        addBinding(bindingName, resolved, bindingStartNode, scope, declarationStart, executionScope);
        continue;
      }
      collectMemberBindings(bindingName, property.value, scope, declarationStart, executionScope, bindingStartNode);
    }
  };
  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      if (declaration?.kind !== 'const') {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const declarationStart = typeof node.start === 'number' ? node.start : scope.start;
      if (node.id?.type === 'ObjectPattern') {
        const sourceName = resolveAstStaticAliasCopySourceName(node.init, aliasCopies, identifierBindings);
        if (!sourceName) {
          return;
        }
        collectAstObjectPatternPathAliases(node.id, (name, members, aliasNode) => {
          const aliasDeclarationStart = typeof aliasNode?.start === 'number' ? aliasNode.start : declarationStart;
          copyMemberBindings(
            `${sourceName}.${members.join('.')}`,
            name,
            aliasNode || node,
            scope,
            aliasDeclarationStart,
            executionScope,
          );
        });
        return;
      }
      if (node.id?.type !== 'Identifier') {
        return;
      }
      const resolved = resolveRunJsStaticString(node.init, source, availableBindings, identifierBindings);
      if (typeof resolved === 'string') {
        addBinding(node.id.name, resolved, node, scope, declarationStart, executionScope);
      }
      collectMemberBindings(node.id.name, node.init, scope, declarationStart, executionScope, node);
      const sourceName = resolveAstStaticAliasCopySourceName(node.init, aliasCopies, identifierBindings);
      if (sourceName) {
        copyMemberBindings(sourceName, node.id.name, node, scope, declarationStart, executionScope);
      }
    },
  });
  return trimStaticStringBindingsAfterWrites(bindings, writes, identifierBindings);
}

export function isStaticStringBindingActiveAtIndex(
  binding: StaticStringBinding,
  index: number,
  writes: AstIdentifierWrite[],
  identifierBindings: AstIdentifierBinding[],
) {
  if (index < binding.start || index >= binding.end) {
    return false;
  }
  const declarationStart = binding.declarationStart ?? binding.start;
  const rootName = getAstAliasRootName(binding.name);
  const executionScope = binding.executionScope;
  if (hasAstShadowBinding(rootName, index, binding, identifierBindings)) {
    return false;
  }
  if (!executionScope) {
    return true;
  }
  return !writes.some(
    (write) =>
      (write.name === binding.name || binding.name.startsWith(`${write.name}.`)) &&
      write.index > declarationStart &&
      write.index >= binding.start &&
      write.index < index &&
      write.alwaysRunsInExecutionScope &&
      isSameAstRange(write.executionScope, executionScope) &&
      !hasAstShadowBinding(rootName, write.index, binding, identifierBindings),
  );
}

export function trimStaticStringBindingsAfterWrites(
  bindings: StaticStringBinding[],
  writes: AstIdentifierWrite[],
  identifierBindings: AstIdentifierBinding[],
): StaticStringBinding[] {
  return bindings.map((binding) => {
    const declarationStart = binding.declarationStart ?? binding.start;
    const rootName = getAstAliasRootName(binding.name);
    const executionScope = binding.executionScope;
    const nextWrite = writes
      .filter(
        (write) =>
          (write.name === binding.name || binding.name.startsWith(`${write.name}.`)) &&
          write.index > declarationStart &&
          write.index >= binding.start &&
          write.index < binding.end &&
          write.alwaysRunsInExecutionScope &&
          !!executionScope &&
          isSameAstRange(write.executionScope, executionScope) &&
          !hasAstShadowBinding(rootName, write.index, binding, identifierBindings),
      )
      .sort((left, right) => left.index - right.index)[0];
    return nextWrite ? { ...binding, end: nextWrite.index } : binding;
  });
}

export function collectStaticFilterValueBindingsFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): StaticFilterValueBinding[] {
  const bindings: StaticFilterValueBinding[] = [];
  const availableBindings: StaticFilterValueBinding[] = [];
  const writes = collectAstStaticBindingWritesFromAst(ast, source, identifierBindings);
  const getActiveBindings = (index: number) =>
    trimStaticFilterValueBindingsAfterWrites(availableBindings, writes, identifierBindings).filter(
      (binding) => index >= binding.start && index < binding.end,
    );
  const addBinding = (
    name: string,
    valueNode: any,
    node: any,
    scope: SourceRange,
    declarationStart: number,
    executionScope: SourceRange,
  ) => {
    const binding = {
      declarationStart,
      executionScope,
      name,
      start: typeof node?.end === 'number' ? node.end : declarationStart,
      end: scope.end,
      valueNode,
    };
    bindings.push(binding);
    availableBindings.push(binding);
  };
  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      if (!node.init) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      if (declaration?.kind !== 'const') {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors, source.length);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const declarationStart = typeof node.start === 'number' ? node.start : scope.start;
      if (node.id?.type === 'ObjectPattern') {
        const sourceObject = resolveRunJsStaticObjectExpression(
          node.init,
          identifierBindings,
          getActiveBindings(declarationStart),
        );
        if (!sourceObject) {
          return;
        }
        collectAstObjectPatternPathAliases(node.id, (name, members, aliasNode) => {
          const property = getRunJsObjectPropertyByPath(
            sourceObject,
            members,
            identifierBindings,
            getActiveBindings(declarationStart),
          );
          if (property) {
            addBinding(
              name,
              property.value,
              aliasNode || node,
              scope,
              typeof aliasNode?.start === 'number' ? aliasNode.start : declarationStart,
              executionScope,
            );
          }
        });
        return;
      }
      if (node.id?.type !== 'Identifier') {
        return;
      }
      addBinding(node.id.name, node.init, node, scope, declarationStart, executionScope);
    },
  });
  return trimStaticFilterValueBindingsAfterWrites(bindings, writes, identifierBindings);
}

export function trimStaticFilterValueBindingsAfterWrites(
  bindings: StaticFilterValueBinding[],
  writes: AstIdentifierWrite[],
  identifierBindings: AstIdentifierBinding[],
): StaticFilterValueBinding[] {
  return bindings.map((binding) => {
    const nextWrite = writes
      .filter(
        (write) =>
          (write.name === binding.name || write.name.startsWith(`${binding.name}.`)) &&
          write.index > binding.declarationStart &&
          write.index >= binding.start &&
          write.index < binding.end &&
          write.alwaysRunsInExecutionScope &&
          isSameAstRange(write.executionScope, binding.executionScope) &&
          !hasAstShadowBinding(binding.name, write.index, binding, identifierBindings),
      )
      .sort((left, right) => left.index - right.index)[0];
    return nextWrite ? { ...binding, end: nextWrite.index } : binding;
  });
}

export function collectAstStaticBindingWritesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): AstIdentifierWrite[] {
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const aliasCopies = collectAstStaticObjectAliasCopiesFromAst(ast, source, identifierBindings);
  return [...writes, ...collectAstStaticAliasCopyWrites(writes, aliasCopies, identifierBindings)];
}

export function collectAstStaticObjectAliasCopiesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): AstStaticObjectAliasCopy[] {
  const aliases: AstStaticObjectAliasCopy[] = [];
  const resolveSourceName = (node: any) => resolveAstStaticAliasCopySourceName(node, aliases, identifierBindings);

  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      if (!node.init) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      if (declaration?.kind !== 'const') {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors, source.length);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const addAlias = (name: string, sourceName: string | undefined, aliasNode: any) => {
        if (!sourceName || sourceName === name || sourceName.startsWith(`${name}.`)) {
          return;
        }
        aliases.push({
          declarationStart: typeof node.start === 'number' ? node.start : scope.start,
          executionScope,
          name,
          sourceName,
          start:
            typeof aliasNode?.start === 'number'
              ? aliasNode.start
              : typeof node.start === 'number'
                ? node.start
                : scope.start,
          end: scope.end,
        });
      };
      if (node.id?.type === 'Identifier') {
        addAlias(node.id.name, resolveSourceName(node.init), node);
        return;
      }
      if (node.id?.type !== 'ObjectPattern') {
        return;
      }
      const sourceName = resolveSourceName(node.init);
      if (!sourceName) {
        return;
      }
      collectAstObjectPatternPathAliases(node.id, (name, members, aliasNode) => {
        addAlias(name, `${sourceName}.${members.join('.')}`, aliasNode || node);
      });
    },
  });

  return aliases;
}

export function resolveAstStaticAliasCopySourceName(
  node: any,
  aliases: AstStaticObjectAliasCopy[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    return alias?.sourceName || unwrapped.name;
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }
  const lookup = getAstMemberAliasLookup(unwrapped);
  if (!lookup) {
    return undefined;
  }
  const rootAlias = resolveAstAliasBinding(lookup.rootName, lookup.index, aliases, identifierBindings);
  if (!rootAlias) {
    return lookup.aliasName;
  }
  const suffix = lookup.aliasName.slice(lookup.rootName.length);
  return `${rootAlias.sourceName}${suffix}`;
}

export function collectAstStaticAliasCopyWrites(
  writes: AstIdentifierWrite[],
  aliases: AstStaticObjectAliasCopy[],
  identifierBindings: AstIdentifierBinding[],
): AstIdentifierWrite[] {
  const mirroredWrites: AstIdentifierWrite[] = [];
  const seen = new Set(writes.map((write) => getAstIdentifierWriteKey(write)));
  const queue = [...writes];
  const addMirroredWrite = (write: AstIdentifierWrite, name: string) => {
    if (!name || name === write.name) {
      return;
    }
    const mirroredWrite = { ...write, name };
    const key = getAstIdentifierWriteKey(mirroredWrite);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    mirroredWrites.push(mirroredWrite);
    queue.push(mirroredWrite);
  };

  for (let index = 0; index < queue.length; index += 1) {
    const write = queue[index];
    for (const alias of aliases) {
      if (!isAstStaticObjectAliasCopyActiveAtIndex(alias, write.index, identifierBindings)) {
        continue;
      }
      if (write.name.startsWith(`${alias.name}.`)) {
        addMirroredWrite(write, `${alias.sourceName}${write.name.slice(alias.name.length)}`);
      }
      if (
        (write.name === alias.sourceName || write.name.startsWith(`${alias.sourceName}.`)) &&
        isAstStaticObjectAliasCopySourceActiveAtIndex(alias, write.index, identifierBindings)
      ) {
        addMirroredWrite(write, `${alias.name}${write.name.slice(alias.sourceName.length)}`);
      }
    }
  }
  return mirroredWrites;
}

export function getAstIdentifierWriteKey(write: AstIdentifierWrite) {
  return [
    write.name,
    write.index,
    write.alwaysRunsInExecutionScope ? '1' : '0',
    write.executionScope.start,
    write.executionScope.end,
  ].join(':');
}

export function isAstStaticObjectAliasCopyActiveAtIndex(
  alias: AstStaticObjectAliasCopy,
  index: number,
  identifierBindings: AstIdentifierBinding[],
) {
  return (
    index >= alias.start &&
    index < alias.end &&
    !hasAstShadowBinding(getAstAliasRootName(alias.name), index, alias, identifierBindings)
  );
}

export function isAstStaticObjectAliasCopySourceActiveAtIndex(
  alias: AstStaticObjectAliasCopy,
  index: number,
  identifierBindings: AstIdentifierBinding[],
) {
  return !hasAstShadowBinding(getAstAliasRootName(alias.sourceName), index, alias, identifierBindings);
}
