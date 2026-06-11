/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SourceBinding, SourceRange, StringLiteralBinding } from '../internal-types';
import {
  collectMethodCandidates,
  findArrowExpressionEnd,
  findMatchingDelimiter,
  findTopLevelChar,
  getPreviousSignificantTokenInfo,
  maskJavaScriptComments,
  readCompleteStringLiteral,
  splitTopLevel,
  stripEnclosure,
  trimBindingElement,
} from './source';

export function collectSourceBindings(
  masked: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
) {
  const bindings: SourceBinding[] = [];
  for (const match of masked.matchAll(/\b(const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    const kind = match[1];
    const matchIndex = match.index || 0;
    if ((kind === 'function' || kind === 'class') && isNamedFunctionOrClassExpression(masked, matchIndex, kind)) {
      const expressionRange = findNamedFunctionOrClassExpressionRange(masked, matchIndex, kind);
      if (expressionRange) {
        bindings.push({
          name: match[2],
          declarationStart: matchIndex,
          start: expressionRange.start,
          end: expressionRange.end,
        });
      }
      continue;
    }
    addSourceBinding(
      bindings,
      functionRanges,
      blockRanges,
      staticBlockRanges,
      masked,
      match[2],
      matchIndex,
      masked.length,
      kind,
    );
  }
  collectDestructuredVariableBindingNames(masked, functionRanges, blockRanges, staticBlockRanges, bindings);
  collectParameterBindingNames(masked, bindings);
  return bindings;
}

export function collectStringLiteralBindings(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: StringLiteralBinding[] = [];
  const commentMasked = maskJavaScriptComments(source);
  for (const match of commentMasked.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])/g)) {
    const declarationIndex = match.index || 0;
    const literalStart = declarationIndex + match[0].lastIndexOf(match[2]);
    const statementEnd = findSingleStatementEnd(masked, declarationIndex);
    const literal = readCompleteStringLiteral(source.slice(literalStart, statementEnd));
    if (!literal) {
      continue;
    }
    const binding = findSourceBindingByDeclaration(bindings, match[1], declarationIndex);
    entries.push({
      name: match[1],
      value: literal.value,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  }
  return entries;
}

export function isNamedFunctionOrClassExpression(masked: string, keywordIndex: number, kind: string) {
  let previous = getPreviousSignificantTokenInfo(masked, keywordIndex);
  if (kind === 'function' && previous?.token === 'async') {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  if (!previous) {
    return false;
  }
  return isExpressionPrefixToken(previous.token);
}

export function isExpressionPrefixToken(token: string) {
  return (
    [
      '=',
      '(',
      '[',
      ',',
      ':',
      '?',
      'return',
      'throw',
      'yield',
      'await',
      'case',
      'new',
      'delete',
      'void',
      'typeof',
    ].includes(token) || /^[!~+\-*%&|^<>]$/.test(token)
  );
}

export function findNamedFunctionOrClassExpressionRange(masked: string, keywordIndex: number, kind: string) {
  if (kind === 'function') {
    const openParen = masked.indexOf('(', keywordIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = closeParen > openParen ? findBraceBodyAfter(masked, closeParen) : undefined;
    return bodyRange ? { start: keywordIndex, end: bodyRange.end } : undefined;
  }

  const openBrace = masked.indexOf('{', keywordIndex);
  const closeBrace = findMatchingDelimiter(masked, openBrace);
  return closeBrace > openBrace ? { start: openBrace, end: closeBrace + 1 } : undefined;
}

export function addSourceBinding(
  bindings: SourceBinding[],
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
  masked: string,
  name: string,
  start: number,
  sourceEnd: number,
  kind: string,
) {
  const scope = resolveBindingScope(masked, sourceEnd, start, kind, functionRanges, blockRanges, staticBlockRanges);
  bindings.push({
    name,
    declarationStart: start,
    start: scope.start,
    end: scope.end,
  });
}

export function resolveBindingScope(
  masked: string,
  sourceEnd: number,
  start: number,
  kind: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
): SourceRange {
  const forScope = ['const', 'let', 'class'].includes(kind)
    ? findForScopeForDeclaration(masked, start, blockRanges)
    : undefined;
  if (forScope) {
    return forScope;
  }
  if (['const', 'let', 'class'].includes(kind)) {
    return findInnermostRange(start, blockRanges) || { start: 0, end: sourceEnd };
  }
  const functionScope = findInnermostRange(start, functionRanges);
  if (functionScope) {
    return functionScope;
  }
  const staticBlockScope = findInnermostRange(start, staticBlockRanges);
  if (staticBlockScope) {
    return staticBlockScope;
  }
  return { start: 0, end: sourceEnd };
}

export function findForScopeForDeclaration(masked: string, start: number, blockRanges: SourceRange[]) {
  const forHeader = findForHeaderRangeContaining(masked, start);
  if (!forHeader) {
    return undefined;
  }
  const bodyRange = findFollowingStatementRange(masked, forHeader.end, blockRanges);
  return bodyRange ? { start: forHeader.start, end: bodyRange.end } : undefined;
}

export function findForHeaderRangeContaining(masked: string, start: number) {
  for (const match of masked.matchAll(/\bfor\s*(?:await\s*)?\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (start > openParen && start < closeParen) {
      return { start: openParen + 1, end: closeParen };
    }
  }
  return undefined;
}

export function findFollowingBraceRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  return masked[cursor] === '{' ? blockRanges.find((range) => range.start === cursor) : undefined;
}

export function findFollowingStatementRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  const braceRange = findFollowingBraceRange(masked, afterIndex, blockRanges);
  if (braceRange) {
    return braceRange;
  }
  let start = afterIndex + 1;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (start >= masked.length) {
    return undefined;
  }
  const end = findSingleStatementEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

export function findSingleStatementEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';') {
        return index + 1;
      }
      if (char === '\n' || char === '\r') {
        return index;
      }
    }
  }
  return masked.length;
}

export function collectDestructuredVariableBindingNames(
  masked: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
  bindings: SourceBinding[],
) {
  for (const match of masked.matchAll(/\b(const|let|var)\s*(\{|\[)/g)) {
    const start = (match.index || 0) + match[0].length - 1;
    const end = findMatchingDelimiter(masked, start);
    if (end > start) {
      extractBindingPatternNames(masked.slice(start, end + 1)).forEach((name) => {
        addSourceBinding(
          bindings,
          functionRanges,
          blockRanges,
          staticBlockRanges,
          masked,
          name,
          match.index || 0,
          masked.length,
          match[1],
        );
      });
    }
  }
}

export function collectParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\bfunction\b[^(]*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\bcatch\s*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  collectArrowParameterBindingNames(masked, bindings);
  collectMethodParameterBindingNames(masked, bindings);
}

export function collectArrowParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\(/g)) {
    const openParen = match.index || 0;
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (closeParen <= openParen) {
      continue;
    }
    let cursor = closeParen + 1;
    while (cursor < masked.length && /\s/.test(masked[cursor])) {
      cursor += 1;
    }
    if (masked.slice(cursor, cursor + 2) !== '=>') {
      continue;
    }
    const bodyRange = findArrowBodyRange(masked, cursor + 2);
    if (bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) {
    const arrowIndex = (match.index || 0) + match[0].lastIndexOf('=>');
    const bodyRange = findArrowBodyRange(masked, arrowIndex + 2);
    if (bodyRange) {
      bindings.push({
        name: match[1],
        declarationStart: match.index || 0,
        start: match.index || 0,
        end: bodyRange.end,
      });
    }
  }
}

export function collectMethodParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    addParameterBindings(bindings, masked.slice(candidate.paramsStart, candidate.paramsEnd), {
      start: candidate.paramsStart,
      end: candidate.bodyRange.end,
    });
  });
}

export function findBraceBodyAfter(masked: string, afterIndex: number): SourceRange | undefined {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] !== '{') {
    return undefined;
  }
  const closeBrace = findMatchingDelimiter(masked, cursor);
  return closeBrace > cursor ? { start: cursor, end: closeBrace + 1 } : undefined;
}

export function findArrowBodyRange(masked: string, afterArrowIndex: number): SourceRange | undefined {
  let start = afterArrowIndex;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (masked[start] === '{') {
    const closeBrace = findMatchingDelimiter(masked, start);
    return closeBrace > start ? { start, end: closeBrace + 1 } : undefined;
  }
  const end = findArrowExpressionEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

export function addParameterBindings(bindings: SourceBinding[], params: string, range: SourceRange) {
  splitTopLevel(params, ',').forEach((param) => {
    extractBindingPatternNames(param).forEach((name) => {
      bindings.push({ name, declarationStart: range.start, ...range });
    });
  });
}

export function extractBindingPatternNames(pattern: string) {
  const names = new Set<string>();
  collectBindingPatternNames(pattern, names);
  return [...names];
}

export function collectBindingPatternNames(pattern: string, names: Set<string>) {
  const trimmed = trimBindingElement(pattern);
  if (!trimmed) {
    return;
  }
  if (trimmed.startsWith('{')) {
    collectObjectBindingPatternNames(trimmed, names);
    return;
  }
  if (trimmed.startsWith('[')) {
    collectArrayBindingPatternNames(trimmed, names);
    return;
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  if (match) {
    names.add(match[1]);
  }
}

export function collectObjectBindingPatternNames(pattern: string, names: Set<string>) {
  const body = stripEnclosure(pattern, '{', '}');
  splitTopLevel(body, ',').forEach((element) => {
    const trimmed = element.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith('...')) {
      collectBindingPatternNames(trimmed.slice(3), names);
      return;
    }
    const colon = findTopLevelChar(trimmed, ':');
    collectBindingPatternNames(colon >= 0 ? trimmed.slice(colon + 1) : trimmed, names);
  });
}

export function collectArrayBindingPatternNames(pattern: string, names: Set<string>) {
  splitTopLevel(stripEnclosure(pattern, '[', ']'), ',').forEach((element) =>
    collectBindingPatternNames(element, names),
  );
}

export function findInnermostRange(index: number, ranges: SourceRange[]) {
  return ranges
    .filter((range) => index >= range.start && index < range.end)
    .sort((left, right) => left.end - left.start - (right.end - right.start))[0];
}

export function isNameBoundAtIndex(bindings: SourceBinding[], name: string, index: number) {
  return bindings.some((binding) => binding.name === name && index >= binding.start && index < binding.end);
}

export function findSourceBindingByDeclaration(bindings: SourceBinding[], name: string, declarationStart: number) {
  return bindings.find((entry) => entry.name === name && (entry.declarationStart ?? entry.start) === declarationStart);
}

export function isSameAstRange(left: SourceRange, right: SourceRange) {
  return left.start === right.start && left.end === right.end;
}

export function isSourceAliasShadowedAtIndex(
  alias: SourceRange & { declarationStart?: number; name: string },
  bindings: SourceBinding[],
  index: number,
) {
  const aliasDeclarationStart = alias.declarationStart ?? alias.start;
  return bindings.some(
    (binding) =>
      binding.name === alias.name &&
      index >= binding.start &&
      index < binding.end &&
      (binding.declarationStart ?? binding.start) !== aliasDeclarationStart,
  );
}
export function isAstDefinitelyNonEmptyForInSource(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ObjectExpression') {
    return (unwrapped.properties || []).some(isAstDefinitelyEnumerableObjectProperty);
  }
  return false;
}

export function isAstDefinitelyNonEmptyForOfSource(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ArrayExpression') {
    return (unwrapped.elements || []).some(isAstDefinitelyNonEmptyArrayElement);
  }
  return false;
}

export function isAstDefinitelyNonEmptyArrayElement(element: any): boolean {
  if (!element) {
    return true;
  }
  if (element.type === 'SpreadElement') {
    return isAstDefinitelyNonEmptyForOfSource(element.argument);
  }
  return true;
}

export function isAstDefinitelyEnumerableObjectProperty(property: any) {
  if (!property || property.type === 'SpreadElement' || property.type !== 'Property') {
    return false;
  }
  if (property.computed) {
    return isAstDefinitelyEnumerableComputedObjectKey(property.key);
  }
  const key = property.key;
  const isProtoSetter =
    !property.method &&
    !property.shorthand &&
    (property.kind || 'init') === 'init' &&
    ((key?.type === 'Identifier' && key.name === '__proto__') ||
      (key?.type === 'Literal' && key.value === '__proto__'));
  if (isProtoSetter) {
    // Prototype-setter literals can affect inherited keys, but are not an own enumerable key themselves.
    return false;
  }
  if (key?.type === 'Identifier') {
    return true;
  }
  if (key?.type === 'Literal') {
    return true;
  }
  return true;
}

export function isAstDefinitelyEnumerableComputedObjectKey(key: any): boolean {
  const unwrapped = unwrapAstChainExpression(key);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'Literal') {
    return (
      typeof unwrapped.value === 'string' ||
      typeof unwrapped.value === 'number' ||
      typeof unwrapped.value === 'boolean' ||
      typeof unwrapped.value === 'bigint' ||
      unwrapped.value === null
    );
  }
  if (unwrapped.type === 'TemplateLiteral') {
    return (unwrapped.expressions || []).length === 0;
  }
  return false;
}

export function findAstAncestor(ancestors: any[], type: string) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (ancestors[index]?.type === type) {
      return ancestors[index];
    }
  }
  return undefined;
}

export function getAstExecutionScopeRange(ancestors: any[], sourceLength: number): SourceRange {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node) {
      continue;
    }
    if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
      return {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : sourceLength,
      };
    }
  }
  return { start: 0, end: sourceLength };
}

export function isAstAlwaysExecutedInCurrentExecutionScope(ancestors: any[]) {
  const conditionalAncestorTypes = new Set([
    'ConditionalExpression',
    'DoWhileStatement',
    'ForStatement',
    'IfStatement',
    'LogicalExpression',
    'SwitchCase',
    'SwitchStatement',
    'WhileStatement',
    'WithStatement',
  ]);
  const currentNodeIndex = ancestors.length - 1;
  for (let index = currentNodeIndex - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node) {
      continue;
    }
    if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
      return true;
    }
    if (node.type === 'ForInStatement' && !isAstDefinitelyNonEmptyForInSource(node.right)) {
      return false;
    }
    if (node.type === 'ForOfStatement' && !isAstDefinitelyNonEmptyForOfSource(node.right)) {
      return false;
    }
    if (node.type === 'CatchClause') {
      return false;
    }
    if (node.type === 'TryStatement') {
      const child = ancestors[index + 1];
      if (child !== node.block && child !== node.finalizer) {
        return false;
      }
      continue;
    }
    if (conditionalAncestorTypes.has(node.type)) {
      return false;
    }
  }
  return true;
}

export function getAstBindingScopeRange(ancestors: any[], sourceLength: number, functionScoped = false): SourceRange {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node || node.type === 'VariableDeclarator' || node.type === 'VariableDeclaration') {
      continue;
    }
    if (functionScoped) {
      if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
        return {
          start: typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : sourceLength,
        };
      }
      continue;
    }
    if (
      node.type === 'Program' ||
      node.type === 'BlockStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'SwitchStatement' ||
      node.type === 'StaticBlock' ||
      isAstFunctionLike(node)
    ) {
      return {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : sourceLength,
      };
    }
  }
  return { start: 0, end: sourceLength };
}

export function isAstFunctionLike(node: any) {
  return (
    !!node &&
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression')
  );
}

export function dedupeIndexedEntries<
  T extends { index: number; match?: string; capability?: string; component?: string },
>(entries: T[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.index}:${entry.match || ''}:${entry.capability || ''}:${entry.component || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
export function unwrapAstChainExpression(node: any): any {
  let current = node;
  while (current?.type === 'ChainExpression') {
    current = current.expression;
  }
  return current;
}
