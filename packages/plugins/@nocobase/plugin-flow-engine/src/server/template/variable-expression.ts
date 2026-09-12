/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseExpressionAt } from 'acorn';

export type PathSegment = string | number;
export type CanonicalPathSegment = string | Readonly<{ kind: 'index' }>;

export type SourceSpan = Readonly<{ start: number; end: number }>;
export type TemplatePathSegment = string | number;

export type VariablePathRef = Readonly<{
  varName: string;
  runtimeSegments: readonly PathSegment[];
  runtimeKey: string;
  canonicalKey: string;
  span: SourceSpan;
  templatePath: readonly TemplatePathSegment[];
}>;

export type ResolvePathPolicy = Readonly<{
  allowAll: boolean;
  allowedPaths: ReadonlySet<string>;
  unrestrictedVariables: ReadonlySet<string>;
}>;

export type VariableExpressionErrorCode =
  | 'bare-ctx'
  | 'ctx-call'
  | 'ctx-write'
  | 'dynamic-ctx-path'
  | 'invalid-expression'
  | 'reserved-helper'
  | 'unsafe-execution'
  | 'unreliable-scope';

export type VariableExpressionError = Readonly<{
  code: VariableExpressionErrorCode;
  span: SourceSpan;
  templatePath: readonly TemplatePathSegment[];
}>;

export type AnalyzedExpression = Readonly<{
  source: string;
  compiled: string;
  helperIdentifier: string;
  expressionSpan: SourceSpan;
  placeholderSpan: SourceSpan;
  paths: readonly VariablePathRef[];
  supported: boolean;
}>;

export type AnalyzedTemplateNode =
  | Readonly<{ kind: 'string'; source: string; expressions: readonly AnalyzedExpression[] }>
  | Readonly<{ kind: 'array'; items: readonly AnalyzedTemplateNode[] }>
  | Readonly<{ kind: 'object'; entries: Readonly<Record<string, AnalyzedTemplateNode>> }>
  | Readonly<{ kind: 'value'; value: unknown }>;

export type AnalyzedTemplate = Readonly<{
  value: AnalyzedTemplateNode;
  paths: readonly VariablePathRef[];
  usage: Readonly<Record<string, readonly VariablePathRef[]>>;
  errors: readonly VariableExpressionError[];
  supported: boolean;
}>;

export type AnalyzeTemplateMode = 'request' | 'untrusted-request' | 'flow-model';

type AstNode = {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
};

type Scope = {
  bindings: Set<string>;
  parent?: Scope;
};

type ParsedMemberPath =
  | { kind: 'none' }
  | { kind: 'bare'; root: AstNode }
  | { kind: 'dynamic'; root: AstNode }
  | { kind: 'static'; root: AstNode; segments: PathSegment[] };

const CANONICAL_INDEX: CanonicalPathSegment = Object.freeze({ kind: 'index' });
const RESERVED_HELPERS = new Set(['__get', '__resolveVariablePath']);
const SAFE_MATH_CALLS = new Set([
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atan2',
  'atanh',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'exp',
  'expm1',
  'floor',
  'fround',
  'hypot',
  'imul',
  'log',
  'log10',
  'log1p',
  'log2',
  'max',
  'min',
  'pow',
  'random',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'tan',
  'tanh',
  'trunc',
]);
const UNSAFE_EXECUTION_NODES = new Set([
  'ArrowFunctionExpression',
  'AssignmentExpression',
  'AwaitExpression',
  'ClassDeclaration',
  'ClassExpression',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'FunctionDeclaration',
  'FunctionExpression',
  'ImportExpression',
  'MetaProperty',
  'NewExpression',
  'SequenceExpression',
  'SpreadElement',
  'StaticBlock',
  'TaggedTemplateExpression',
  'UpdateExpression',
  'WhileStatement',
  'YieldExpression',
]);
const ACORN_OPTIONS = { ecmaVersion: 'latest' as const, preserveParens: true, sourceType: 'script' as const };

export function getVariableRuntimeKey(varName: string, runtimeSegments: readonly PathSegment[]) {
  return JSON.stringify([varName, ...runtimeSegments]);
}

export function getVariableCanonicalKey(varName: string, runtimeSegments: readonly PathSegment[]) {
  const segments: CanonicalPathSegment[] = runtimeSegments.map((segment) =>
    typeof segment === 'number' ? CANONICAL_INDEX : segment,
  );
  return JSON.stringify([varName, ...segments]);
}

export function analyzeVariableTemplate(
  template: unknown,
  options: Readonly<{ mode?: AnalyzeTemplateMode }> = {},
): AnalyzedTemplate {
  const mode = options.mode ?? 'request';
  const paths: VariablePathRef[] = [];
  const errors: VariableExpressionError[] = [];
  const helperIdentifiers = new Set<string>();

  const visit = (value: unknown, templatePath: readonly TemplatePathSegment[]): AnalyzedTemplateNode => {
    if (typeof value === 'string') {
      const expressions = analyzeString(value, templatePath, paths, errors, helperIdentifiers, mode);
      return { kind: 'string', source: value, expressions };
    }
    if (Array.isArray(value)) {
      return { kind: 'array', items: value.map((item, index) => visit(item, [...templatePath, index])) };
    }
    if (value && typeof value === 'object') {
      const entries: Record<string, AnalyzedTemplateNode> = Object.create(null);
      for (const [key, item] of Object.entries(value)) entries[key] = visit(item, [...templatePath, key]);
      return { kind: 'object', entries };
    }
    return { kind: 'value', value };
  };

  const value = visit(template, []);
  const usage: Record<string, VariablePathRef[]> = Object.create(null);
  const seenRuntimeKeys = new Map<string, Set<string>>();
  for (const path of paths) {
    const seen = seenRuntimeKeys.get(path.varName) ?? new Set<string>();
    seenRuntimeKeys.set(path.varName, seen);
    if (seen.has(path.runtimeKey)) continue;
    seen.add(path.runtimeKey);
    (usage[path.varName] ??= []).push(path);
  }

  return {
    value,
    paths,
    usage,
    errors,
    supported: mode === 'flow-model' || errors.length === 0,
  };
}

function analyzeString(
  source: string,
  templatePath: readonly TemplatePathSegment[],
  allPaths: VariablePathRef[],
  allErrors: VariableExpressionError[],
  helperIdentifiers: Set<string>,
  mode: AnalyzeTemplateMode,
) {
  const expressions: AnalyzedExpression[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const placeholderStart = source.indexOf('{{', cursor);
    if (placeholderStart < 0) break;
    const parseStart = placeholderStart + 2;
    let ast: AstNode;
    try {
      ast = parseExpressionAt(source, parseStart, ACORN_OPTIONS) as AstNode;
    } catch (error) {
      const position = getAcornErrorPosition(error, parseStart);
      allErrors.push({ code: 'invalid-expression', span: { start: position, end: position }, templatePath });
      cursor = parseStart;
      continue;
    }

    let placeholderEnd = ast.end;
    while (/\s/.test(source[placeholderEnd] ?? '')) placeholderEnd += 1;
    if (!source.startsWith('}}', placeholderEnd)) {
      allErrors.push({
        code: 'invalid-expression',
        span: { start: ast.start, end: ast.end },
        templatePath,
      });
      cursor = parseStart;
      continue;
    }

    const expressionEnd = placeholderEnd;
    const expressionErrors: VariableExpressionError[] = [];
    const helperIdentifier = createHelperIdentifier(ast, helperIdentifiers);
    let expressionPaths = analyzeAst(ast, templatePath, expressionErrors, mode);
    const dashedPath = parseDashedCtxPath(source.slice(ast.start, ast.end));
    if (dashedPath && expressionPaths.length === 1 && expressionErrors.length === 0) {
      expressionPaths = [createPathRef(dashedPath[0], dashedPath.slice(1), ast, templatePath)];
    }

    const supported = expressionErrors.length === 0;
    const retainedPaths = supported ? expressionPaths : [];
    allErrors.push(...expressionErrors);
    allPaths.push(...retainedPaths);

    expressions.push({
      source: source.slice(parseStart, expressionEnd),
      compiled: compileExpression(source, parseStart, expressionEnd, retainedPaths, helperIdentifier),
      helperIdentifier,
      expressionSpan: { start: parseStart, end: expressionEnd },
      placeholderSpan: { start: placeholderStart, end: placeholderEnd + 2 },
      paths: retainedPaths,
      supported,
    });
    cursor = placeholderEnd + 2;
  }
  return expressions;
}

function analyzeAst(
  ast: AstNode,
  templatePath: readonly TemplatePathSegment[],
  errors: VariableExpressionError[],
  mode: AnalyzeTemplateMode,
) {
  const paths: VariablePathRef[] = [];
  const pathRanges: SourceSpan[] = [];
  const errorKeys = new Set<string>();
  const rootScope: Scope = { bindings: new Set() };

  const addError = (code: VariableExpressionErrorCode, node: AstNode) => {
    const key = `${code}:${node.start}:${node.end}`;
    if (errorKeys.has(key)) return;
    errorKeys.add(key);
    errors.push({ code, span: { start: node.start, end: node.end }, templatePath });
  };

  const visit = (node: AstNode, scope: Scope, parent?: AstNode, parentKey?: string) => {
    if (mode === 'untrusted-request' && isUnsafeExecutionNode(node)) addError('unsafe-execution', node);

    if (RESERVED_HELPERS.has(identifierName(node) ?? '') && isIdentifierReference(parent, parentKey)) {
      addError('reserved-helper', node);
    }

    if (isFunctionNode(node)) {
      visitFunction(node, scope, visit);
      return;
    }
    if (node.type === 'BlockStatement' || node.type === 'StaticBlock') {
      const blockScope = createScope(scope);
      collectDirectLexicalBindings(node, blockScope.bindings);
      visitNodeFields(node, blockScope, visit, new Set(['type', 'start', 'end']));
      return;
    }
    if (node.type === 'CatchClause') {
      const catchScope = createScope(scope);
      addPatternBindings(asNode(node.param), catchScope.bindings);
      visitPatternExpressions(asNode(node.param), catchScope, visit);
      visitMaybeNode(node.body, catchScope, visit, node, 'body');
      return;
    }
    if (node.type === 'WithStatement') addError('unreliable-scope', node);
    if (
      node.type === 'CallExpression' &&
      identifierName(unwrapChain(asNode(node.callee) ?? node)) === 'eval' &&
      !hasBinding(scope, 'eval')
    ) {
      addError('unreliable-scope', node);
    }
    if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
      const loopScope = createScope(scope);
      const declaration = asNode(node.type === 'ForStatement' ? node.init : node.left);
      if (declaration?.type === 'VariableDeclaration' && declaration.kind !== 'var') {
        for (const item of nodeArray(declaration.declarations)) addPatternBindings(asNode(item.id), loopScope.bindings);
      }
      if (
        node.type !== 'ForStatement' &&
        declaration?.type !== 'VariableDeclaration' &&
        containsCtxDerived(declaration, scope)
      ) {
        addError('ctx-write', declaration);
      }
      visitNodeFields(node, loopScope, visit, new Set(['type', 'start', 'end']));
      return;
    }
    if (node.type === 'SwitchStatement') {
      const switchScope = createScope(scope);
      for (const switchCase of nodeArray(node.cases)) {
        for (const statement of nodeArray(switchCase.consequent)) {
          if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
            for (const declaration of nodeArray(statement.declarations)) {
              addPatternBindings(asNode(declaration.id), switchScope.bindings);
            }
          }
          if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
            const name = identifierName(asNode(statement.id));
            if (name) switchScope.bindings.add(name);
          }
        }
      }
      visitMaybeNode(node.discriminant, scope, visit, node, 'discriminant');
      for (const switchCase of nodeArray(node.cases)) {
        visitMaybeNode(switchCase.test, switchScope, visit, switchCase, 'test');
        for (const statement of nodeArray(switchCase.consequent))
          visit(statement, switchScope, switchCase, 'consequent');
      }
      return;
    }
    if (node.type === 'ClassExpression' || node.type === 'ClassDeclaration') {
      const classScope = createScope(scope);
      const name = identifierName(asNode(node.id));
      if (name) classScope.bindings.add(name);
      visitMaybeNode(node.superClass, classScope, visit, node, 'superClass');
      visitMaybeNode(node.body, classScope, visit, node, 'body');
      return;
    }
    if (node.type === 'VariableDeclaration') {
      for (const declaration of nodeArray(node.declarations)) {
        visitPatternExpressions(asNode(declaration.id), scope, visit);
        visitMaybeNode(declaration.init, scope, visit, declaration, 'init');
      }
      return;
    }
    if (node.type === 'Property') {
      if (node.computed === true) visitMaybeNode(node.key, scope, visit, node, 'key');
      if (node.shorthand === true) visitMaybeNode(node.value, scope, visit, node, 'value');
      else visitMaybeNode(node.value, scope, visit, node, 'value');
      return;
    }

    if (node.type === 'MemberExpression') {
      const parsed = parseMemberPath(node, scope);
      const covered = pathRanges.some((span) => span.start <= node.start && span.end >= node.end);
      if (!covered && parsed.kind === 'static') {
        if (!parsed.segments.length || typeof parsed.segments[0] !== 'string') {
          addError('dynamic-ctx-path', node);
        } else {
          const ref = createPathRef(parsed.segments[0], parsed.segments.slice(1), node, templatePath);
          paths.push(ref);
          pathRanges.push(ref.span);
        }
      } else if (!covered && parsed.kind === 'dynamic') {
        addError('dynamic-ctx-path', node);
      }
    }

    if ((node.type === 'CallExpression' || node.type === 'NewExpression') && isCtxDerived(asNode(node.callee), scope)) {
      addError('ctx-call', node);
    }
    if (node.type === 'TaggedTemplateExpression' && isCtxDerived(asNode(node.tag), scope)) {
      addError('ctx-call', node);
    }
    if (node.type === 'AssignmentExpression' && containsCtxDerived(asNode(node.left), scope)) {
      addError('ctx-write', node);
    }
    if (node.type === 'UpdateExpression' && isCtxDerived(asNode(node.argument), scope)) {
      addError('ctx-write', node);
    }
    if (node.type === 'UnaryExpression' && node.operator === 'delete' && isCtxDerived(asNode(node.argument), scope)) {
      addError('ctx-write', node);
    }
    if (
      node.type === 'Identifier' &&
      identifierName(node) === 'ctx' &&
      !hasBinding(scope, 'ctx') &&
      isIdentifierReference(parent, parentKey) &&
      !(parent?.type === 'MemberExpression' && parentKey === 'object')
    ) {
      addError('bare-ctx', node);
    }

    visitNodeFields(node, scope, visit, new Set(['type', 'start', 'end']));
  };

  visit(ast, rootScope);
  return paths.sort((left, right) => left.span.start - right.span.start);
}

function isUnsafeExecutionNode(node: AstNode) {
  if (node.type === 'CallExpression') return !isSafeMathCall(node);
  if (node.type === 'Literal' && (typeof node.value === 'bigint' || typeof node.bigint === 'string')) return true;
  if (node.type === 'UnaryExpression' && node.operator === 'delete') return true;
  return UNSAFE_EXECUTION_NODES.has(node.type);
}

function isSafeMathCall(node: AstNode) {
  if (node.optional === true) return false;
  const callee = unwrapChain(asNode(node.callee) ?? node);
  if (callee.type !== 'MemberExpression' || callee.computed === true || callee.optional === true) return false;
  return (
    identifierName(asNode(callee.object)) === 'Math' &&
    SAFE_MATH_CALLS.has(identifierName(asNode(callee.property)) ?? '')
  );
}

function visitFunction(
  node: AstNode,
  outerScope: Scope,
  visit: (node: AstNode, scope: Scope, parent?: AstNode, parentKey?: string) => void,
) {
  const scope = createScope(outerScope);
  const name = identifierName(asNode(node.id));
  if (name) scope.bindings.add(name);
  for (const parameter of nodeArray(node.params)) addPatternBindings(parameter, scope.bindings);
  collectFunctionVarBindings(asNode(node.body), scope.bindings);
  for (const parameter of nodeArray(node.params)) visitPatternExpressions(parameter, scope, visit);
  visitMaybeNode(node.body, scope, visit, node, 'body');
}

function visitPatternExpressions(
  pattern: AstNode | undefined,
  scope: Scope,
  visit: (node: AstNode, scope: Scope, parent?: AstNode, parentKey?: string) => void,
) {
  if (!pattern) return;
  if (pattern.type === 'AssignmentPattern') {
    visitPatternExpressions(asNode(pattern.left), scope, visit);
    visitMaybeNode(pattern.right, scope, visit, pattern, 'right');
    return;
  }
  if (pattern.type === 'RestElement') {
    visitPatternExpressions(asNode(pattern.argument), scope, visit);
    return;
  }
  if (pattern.type === 'ArrayPattern') {
    for (const element of nodeArray(pattern.elements)) visitPatternExpressions(element, scope, visit);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of nodeArray(pattern.properties)) {
      if (property.type === 'RestElement') {
        visitPatternExpressions(asNode(property.argument), scope, visit);
        continue;
      }
      if (property.computed === true) visitMaybeNode(property.key, scope, visit, property, 'key');
      visitPatternExpressions(asNode(property.value), scope, visit);
    }
  }
}

function collectDirectLexicalBindings(node: AstNode, bindings: Set<string>) {
  for (const statement of nodeArray(node.body)) {
    if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
      for (const declaration of nodeArray(statement.declarations)) addPatternBindings(asNode(declaration.id), bindings);
    }
    if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
      const name = identifierName(asNode(statement.id));
      if (name) bindings.add(name);
    }
  }
}

function collectFunctionVarBindings(node: AstNode | undefined, bindings: Set<string>) {
  if (!node) return;
  if (isFunctionNode(node)) return;
  if (node.type === 'VariableDeclaration' && node.kind === 'var') {
    for (const declaration of nodeArray(node.declarations)) addPatternBindings(asNode(declaration.id), bindings);
  }
  if (node.type === 'FunctionDeclaration') {
    const name = identifierName(asNode(node.id));
    if (name) bindings.add(name);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    if (isNode(value)) collectFunctionVarBindings(value, bindings);
    else if (Array.isArray(value))
      for (const item of value) if (isNode(item)) collectFunctionVarBindings(item, bindings);
  }
}

function addPatternBindings(pattern: AstNode | undefined, bindings: Set<string>) {
  if (!pattern) return;
  const name = identifierName(pattern);
  if (name) {
    bindings.add(name);
    return;
  }
  if (pattern.type === 'RestElement') {
    addPatternBindings(asNode(pattern.argument), bindings);
    return;
  }
  if (pattern.type === 'AssignmentPattern') {
    addPatternBindings(asNode(pattern.left), bindings);
    return;
  }
  if (pattern.type === 'ArrayPattern') {
    for (const element of nodeArray(pattern.elements)) addPatternBindings(element, bindings);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of nodeArray(pattern.properties)) {
      addPatternBindings(asNode(property.type === 'RestElement' ? property.argument : property.value), bindings);
    }
  }
}

function parseMemberPath(node: AstNode, scope: Scope): ParsedMemberPath {
  const current = unwrapChain(node);
  if (current.type === 'Identifier') {
    if (identifierName(current) !== 'ctx' || hasBinding(scope, 'ctx')) return { kind: 'none' };
    return { kind: 'bare', root: current };
  }
  if (current.type !== 'MemberExpression') return { kind: 'none' };
  const base = parseMemberPath(asNode(current.object) ?? current, scope);
  if (base.kind === 'none' || base.kind === 'dynamic') return base;
  const segment = getStaticMemberSegment(current);
  if (segment === undefined) return { kind: 'dynamic', root: base.root };
  return { kind: 'static', root: base.root, segments: [...(base.kind === 'static' ? base.segments : []), segment] };
}

function getStaticMemberSegment(node: AstNode): PathSegment | undefined {
  const property = asNode(node.property);
  if (!property) return undefined;
  if (node.computed !== true) return identifierName(property);
  if (property.type !== 'Literal') return undefined;
  return typeof property.value === 'string' || typeof property.value === 'number' ? property.value : undefined;
}

function isCtxDerived(node: AstNode | undefined, scope: Scope): boolean {
  if (!node) return false;
  const current = unwrapChain(node);
  if (current.type === 'Identifier') return identifierName(current) === 'ctx' && !hasBinding(scope, 'ctx');
  if (current.type === 'MemberExpression') return isCtxDerived(asNode(current.object), scope);
  if (current.type === 'CallExpression' || current.type === 'NewExpression') {
    return isCtxDerived(asNode(current.callee), scope);
  }
  if (current.type === 'AwaitExpression') return isCtxDerived(asNode(current.argument), scope);
  if (current.type === 'SequenceExpression') {
    return isCtxDerived(nodeArray(current.expressions).at(-1), scope);
  }
  if (current.type === 'ConditionalExpression') {
    return isCtxDerived(asNode(current.consequent), scope) || isCtxDerived(asNode(current.alternate), scope);
  }
  if (current.type === 'LogicalExpression') {
    return isCtxDerived(asNode(current.left), scope) || isCtxDerived(asNode(current.right), scope);
  }
  if (current.type === 'AssignmentExpression') return isCtxDerived(asNode(current.right), scope);
  return false;
}

function containsCtxDerived(node: AstNode | undefined, scope: Scope): boolean {
  if (!node) return false;
  if (isCtxDerived(node, scope)) return true;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    if (isNode(value) && containsCtxDerived(value, scope)) return true;
    if (Array.isArray(value) && value.some((item) => isNode(item) && containsCtxDerived(item, scope))) return true;
  }
  return false;
}

function parseDashedCtxPath(source: string): string[] | null {
  if (!source.startsWith('ctx.')) return null;
  const segments = source.slice(4).split('.');
  if (segments.length < 2 || segments.some((segment) => !segment)) return null;
  const varName = parseIdentifierSource(segments[0]);
  if (!varName) return null;
  let hasDash = false;
  const decodedSegments: string[] = [];
  for (const segment of segments.slice(1)) {
    const parts = segment.split('-');
    if (parts.length > 1) hasDash = true;
    const decodedParts = parts.map(parseIdentifierSource);
    if (decodedParts.some((part) => !part)) return null;
    decodedSegments.push(decodedParts.join('-'));
  }
  return hasDash ? [varName, ...decodedSegments] : null;
}

function parseIdentifierSource(source: string) {
  try {
    const node = parseExpressionAt(source, 0, ACORN_OPTIONS) as AstNode;
    return node.type === 'Identifier' && node.end === source.length ? identifierName(node) : undefined;
  } catch (_) {
    return undefined;
  }
}

function createPathRef(
  varName: string,
  runtimeSegments: readonly PathSegment[],
  node: Pick<AstNode, 'start' | 'end'>,
  templatePath: readonly TemplatePathSegment[],
): VariablePathRef {
  return {
    varName,
    runtimeSegments,
    runtimeKey: getVariableRuntimeKey(varName, runtimeSegments),
    canonicalKey: getVariableCanonicalKey(varName, runtimeSegments),
    span: { start: node.start, end: node.end },
    templatePath,
  };
}

function createHelperIdentifier(ast: AstNode, used: Set<string>) {
  const identifiers = new Set<string>();
  const collect = (node: AstNode) => {
    const name = identifierName(node);
    if (name) identifiers.add(name);
    for (const value of Object.values(node)) {
      if (isNode(value)) collect(value);
      else if (Array.isArray(value)) for (const item of value) if (isNode(item)) collect(item);
    }
  };
  collect(ast);

  let index = used.size;
  let candidate = `__resolveVariablePath${index}`;
  while (identifiers.has(candidate) || used.has(candidate)) candidate = `__resolveVariablePath${++index}`;
  used.add(candidate);
  return candidate;
}

function compileExpression(
  source: string,
  start: number,
  end: number,
  paths: readonly VariablePathRef[],
  helperIdentifier: string,
) {
  let compiled = source.slice(start, end);
  for (const path of [...paths].sort((left, right) => right.span.start - left.span.start)) {
    const replacement = `(await ${helperIdentifier}(${JSON.stringify(path.varName)}, ${JSON.stringify(
      path.runtimeSegments,
    )}))`;
    compiled = `${compiled.slice(0, path.span.start - start)}${replacement}${compiled.slice(path.span.end - start)}`;
  }
  return compiled;
}

function visitNodeFields(
  node: AstNode,
  scope: Scope,
  visit: (node: AstNode, scope: Scope, parent?: AstNode, parentKey?: string) => void,
  skipped: ReadonlySet<string>,
) {
  for (const [key, value] of Object.entries(node)) {
    if (skipped.has(key)) continue;
    if (isNode(value)) visit(value, scope, node, key);
    else if (Array.isArray(value)) for (const item of value) if (isNode(item)) visit(item, scope, node, key);
  }
}

function visitMaybeNode(
  value: unknown,
  scope: Scope,
  visit: (node: AstNode, scope: Scope, parent?: AstNode, parentKey?: string) => void,
  parent: AstNode,
  parentKey: string,
) {
  if (isNode(value)) visit(value, scope, parent, parentKey);
}

function unwrapChain(node: AstNode): AstNode {
  return (node.type === 'ChainExpression' || node.type === 'ParenthesizedExpression') && isNode(node.expression)
    ? unwrapChain(node.expression)
    : node;
}

function createScope(parent: Scope): Scope {
  return { bindings: new Set(), parent };
}

function hasBinding(scope: Scope, name: string): boolean {
  return scope.bindings.has(name) || (!!scope.parent && hasBinding(scope.parent, name));
}

function identifierName(node: AstNode | undefined) {
  return node?.type === 'Identifier' && typeof node.name === 'string' ? node.name : undefined;
}

function isIdentifierReference(parent: AstNode | undefined, parentKey: string | undefined) {
  if (!parent) return true;
  if (parent.type === 'MemberExpression' && parentKey === 'property' && parent.computed !== true) return false;
  if (
    (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') &&
    parentKey === 'key' &&
    parent.computed !== true
  ) {
    return false;
  }
  return !(
    (parent.type === 'LabeledStatement' && parentKey === 'label') ||
    ((parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parentKey === 'label')
  );
}

function isFunctionNode(node: AstNode) {
  return (
    node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression'
  );
}

function isNode(value: unknown): value is AstNode {
  return !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string';
}

function asNode(value: unknown): AstNode | undefined {
  return isNode(value) ? value : undefined;
}

function nodeArray(value: unknown): AstNode[] {
  return Array.isArray(value) ? value.filter(isNode) : [];
}

function getAcornErrorPosition(error: unknown, fallback: number) {
  return typeof error === 'object' && error && 'pos' in error && typeof error.pos === 'number' ? error.pos : fallback;
}
