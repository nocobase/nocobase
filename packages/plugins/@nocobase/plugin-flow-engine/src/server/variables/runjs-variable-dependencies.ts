/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isAstFunctionLike, unwrapAstChainExpression } from '../flow-surfaces/runjs-authoring/ast/bindings';
import { maskJavaScriptComments } from '../flow-surfaces/runjs-authoring/ast/source';
import {
  collectAstIdentifierBindingsFromAst,
  collectStaticFilterValueBindingsFromAst,
} from '../flow-surfaces/runjs-authoring/ast/static-bindings';
import {
  collectAstPatternBindingIdentifiers,
  getAstMemberRootIdentifier,
  getAstStaticPropertyName,
  hasAstActiveBinding,
  isUnshadowedCtxIdentifier,
  resolveAstAliasBinding,
  resolveAstStaticStringValue,
} from '../flow-surfaces/runjs-authoring/ast/static-values';
import type { AstIdentifierBinding, StaticFilterValueBinding } from '../flow-surfaces/runjs-authoring/internal-types';
import { parseRunJsAuthoringAst } from '../flow-surfaces/runjs-authoring/ast/parser';
import { walkAstAncestor, walkAstSimple } from '../flow-surfaces/runjs-authoring/ast/walk';
import {
  MAX_RUNJS_SOURCES_PER_REQUEST,
  MAX_RUNJS_SOURCE_LENGTH,
  MAX_RUNJS_TOTAL_SOURCE_LENGTH,
} from '../flow-surfaces/runjs-authoring/runtime/constants';
import { analyzeVariableTemplate, type VariablePathRef } from '../template/variable-expression';

type PersistedRunJsValue = Readonly<{
  code: string;
  version?: string | null;
}>;

type AstNode = Readonly<{
  argument?: unknown;
  arguments?: readonly unknown[];
  callee?: unknown;
  computed?: boolean;
  elements?: readonly unknown[];
  expressions?: readonly unknown[];
  id?: unknown;
  init?: unknown;
  kind?: string;
  key?: unknown;
  left?: unknown;
  method?: boolean;
  name?: string;
  object?: unknown;
  operator?: string;
  params?: readonly unknown[];
  properties?: readonly unknown[];
  property?: unknown;
  quasis?: readonly Readonly<{ value?: Readonly<{ cooked?: string | null; raw?: string }> }>[];
  shorthand?: boolean;
  start?: number;
  type?: string;
  value?: unknown;
}>;

type StaticJsonValue = null | boolean | number | string | StaticJsonValue[] | { [key: string]: StaticJsonValue };

type StaticJsonResult = Readonly<{ ok: true; value: StaticJsonValue }> | Readonly<{ ok: false }>;

type TraversalContainer = Record<string, unknown> | unknown[];

type TraversalFrame = Readonly<{
  depth: number;
  input: unknown;
  key: string;
  parent: TraversalContainer;
  pathTail: readonly string[];
}>;

type EnumerableDataEntry = readonly [key: string, value: unknown];

export type PreparedFlowModelVariableSource =
  | Readonly<{
      ok: true;
      runJsPathPatterns: readonly RunJsVariablePathPattern[];
      runJsTemplates: readonly string[];
      templateSource: unknown;
    }>
  | Readonly<{ ok: false }>;

type RunJsVariablePathSegmentPattern =
  | Readonly<{ kind: 'dynamic'; parts: readonly string[] }>
  | Readonly<{ kind: 'static'; value: string | number }>;

export type RunJsVariablePathPattern = Readonly<{
  segments: readonly RunJsVariablePathSegmentPattern[];
}>;

const RUNJS_VALUE_KEYS = new Set(['code', 'version']);
const RUNJS_PATH_SUFFIXES = new Set(['stepParams.jsSettings.runJs', 'stepParams.clickSettings.runJs']);
const MUTATING_CTX_METHODS = new Set(['__defineGetter__', '__defineSetter__']);
const GLOBAL_OBJECT_NAMES = new Set(['globalThis']);
const DYNAMIC_CODE_EXECUTION_NAMES = new Set(['eval', 'Function']);

export const MAX_FLOW_MODEL_VARIABLE_SOURCE_DEPTH = 128;
export const MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES = 10_000;
export const MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH = 256 * 1024;
export const MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH = 1024 * 1024;

function getEnumerableDataEntries(value: object) {
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const entries: EnumerableDataEntry[] = [];
  for (const key of Object.keys(descriptors)) {
    const descriptor = descriptors[key];
    if (!descriptor.enumerable) continue;
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      throw new TypeError('FlowModel variable source must not contain accessors');
    }
    entries.push([key, descriptor.value]);
  }
  return { descriptors, entries };
}

function readPersistedRunJsValue(entries: readonly EnumerableDataEntry[]): PersistedRunJsValue | undefined {
  if (!entries.length || entries.some(([key]) => !RUNJS_VALUE_KEYS.has(key))) return;
  const values = new Map(entries);
  const code = values.get('code');
  const version = values.get('version');
  if (typeof code !== 'string' || (version != null && typeof version !== 'string')) return;
  return { code, version: version as string | null | undefined };
}

function isPersistedRunJsPath(pathTail: readonly string[]) {
  return RUNJS_PATH_SUFFIXES.has(pathTail.slice(-3).join('.'));
}

function createTraversalContainer(input: object, descriptors: PropertyDescriptorMap): TraversalContainer {
  if (!Array.isArray(input)) return Object.create(null) as Record<string, unknown>;
  const length = descriptors.length?.value;
  if (!Number.isInteger(length) || length < 0 || length > MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES) {
    throw new RangeError('FlowModel variable source array exceeds its limit');
  }
  return new Array(length);
}

function defineTraversalValue(parent: TraversalContainer, key: string, value: unknown) {
  Object.defineProperty(parent, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function functionBindsCtxParameter(node: AstNode, cache: WeakMap<object, boolean>) {
  if (!isAstFunctionLike(node)) return false;
  const objectNode = node as object;
  const cached = cache.get(objectNode);
  if (typeof cached === 'boolean') return cached;
  let bindsCtx = false;
  for (const parameter of node.params || []) {
    collectAstPatternBindingIdentifiers(parameter, (name: string) => {
      if (name === 'ctx') bindsCtx = true;
    });
  }
  cache.set(objectNode, bindsCtx);
  return bindsCtx;
}

function hasCtxParameterInFunctionAncestors(ancestors: readonly AstNode[], cache: WeakMap<object, boolean>) {
  return ancestors.some((ancestor) => functionBindsCtxParameter(ancestor, cache));
}

function getDirectCtxMethodName(
  node: unknown,
  identifierBindings: ReturnType<typeof collectAstIdentifierBindingsFromAst>,
) {
  const member = unwrapAstChainExpression(node) as AstNode | undefined;
  if (member?.type !== 'MemberExpression' || !isUnshadowedCtxIdentifier(member.object, identifierBindings)) return;
  return getAstStaticPropertyName(member);
}

function isCtxRootedMember(node: unknown, identifierBindings: ReturnType<typeof collectAstIdentifierBindingsFromAst>) {
  const member = unwrapAstChainExpression(node) as AstNode | undefined;
  if (member?.type !== 'MemberExpression') return false;
  const root = getAstMemberRootIdentifier(member);
  return root?.name === 'ctx' && !hasAstActiveBinding('ctx', root.index, identifierBindings);
}

function isCtxMutationTarget(
  target: unknown,
  identifierBindings: ReturnType<typeof collectAstIdentifierBindingsFromAst>,
): boolean {
  const node = unwrapAstChainExpression(target) as AstNode | undefined;
  if (!node) return false;
  if (node.type === 'Identifier') return isUnshadowedCtxIdentifier(node, identifierBindings);
  if (node.type === 'MemberExpression') return isCtxRootedMember(node, identifierBindings);
  if (node.type === 'AssignmentPattern') return isCtxMutationTarget(node.left, identifierBindings);
  if (node.type === 'RestElement') return isCtxMutationTarget(node.argument, identifierBindings);
  if (node.type === 'ArrayPattern') {
    return (node.elements || []).some((element) => isCtxMutationTarget(element, identifierBindings));
  }
  if (node.type !== 'ObjectPattern') return false;
  return (node.properties || []).some((propertyValue) => {
    const property = propertyValue as AstNode | undefined;
    if (property?.type === 'RestElement') {
      return isCtxMutationTarget(property.argument, identifierBindings);
    }
    return property?.type === 'Property' && isCtxMutationTarget(property.value, identifierBindings);
  });
}

function isNonReferenceIdentifier(node: AstNode, parent: AstNode | undefined) {
  if (!parent) return false;
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return true;
  if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return true;
  if (
    (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') &&
    parent.key === node &&
    !parent.computed
  ) {
    return true;
  }
  return (
    (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') &&
    parent.value === node
  );
}

function thisUsesTopLevelBinding(ancestors: readonly AstNode[]) {
  for (let index = 0; index < ancestors.length; index += 1) {
    const ancestor = ancestors[index];
    if (isAstFunctionLike(ancestor) && ancestor.type !== 'ArrowFunctionExpression') return false;
    if (ancestor.type === 'StaticBlock') return false;
    if (ancestor.type === 'PropertyDefinition' && unwrapAstChainExpression(ancestor.value) === ancestors[index + 1]) {
      return false;
    }
  }
  return true;
}

function hasUnsafeCtxUsage(ast: unknown, identifierBindings: ReturnType<typeof collectAstIdentifierBindingsFromAst>) {
  let unsafe = false;
  walkAstAncestor(ast, {
    Identifier(node: AstNode, ancestors: AstNode[]) {
      const parent = ancestors[ancestors.length - 2];
      if (isNonReferenceIdentifier(node, parent)) return;
      if (
        node.name &&
        (GLOBAL_OBJECT_NAMES.has(node.name) || DYNAMIC_CODE_EXECUTION_NAMES.has(node.name)) &&
        !hasAstActiveBinding(node.name, node.start || 0, identifierBindings)
      ) {
        unsafe = true;
        return;
      }
      if (!isUnshadowedCtxIdentifier(node, identifierBindings)) return;
      if (parent?.type === 'MemberExpression' && unwrapAstChainExpression(parent.object) === node) return;
      unsafe = true;
    },
    ThisExpression(_node: AstNode, ancestors: AstNode[]) {
      if (thisUsesTopLevelBinding(ancestors)) unsafe = true;
    },
    WithStatement() {
      unsafe = true;
    },
  });
  return unsafe;
}

function hasCtxMutation(ast: unknown, identifierBindings: ReturnType<typeof collectAstIdentifierBindingsFromAst>) {
  let mutated = false;
  walkAstSimple(ast, {
    AssignmentExpression(node: AstNode) {
      if (isCtxMutationTarget(node.left, identifierBindings)) mutated = true;
    },
    CallExpression(node: AstNode) {
      const callee = unwrapAstChainExpression(node.callee) as AstNode | undefined;
      if (
        callee?.type === 'MemberExpression' &&
        MUTATING_CTX_METHODS.has(getAstStaticPropertyName(callee)) &&
        isCtxRootedMember(callee, identifierBindings)
      ) {
        mutated = true;
      }
    },
    ForInStatement(node: AstNode) {
      if (isCtxMutationTarget(node.left, identifierBindings)) mutated = true;
    },
    ForOfStatement(node: AstNode) {
      if (isCtxMutationTarget(node.left, identifierBindings)) mutated = true;
    },
    UnaryExpression(node: AstNode) {
      if (node.operator === 'delete' && isCtxMutationTarget(node.argument, identifierBindings)) {
        mutated = true;
      }
    },
    UpdateExpression(node: AstNode) {
      if (isCtxMutationTarget(node.argument, identifierBindings)) mutated = true;
    },
  });
  return mutated;
}

function analyzeValidatedGetVarPath(value: string): Readonly<{ path: string; ref: VariablePathRef }> | undefined {
  const path = value.trim();
  if (!path) return;
  const template = `{{${path}}}`;
  const analysis = analyzeVariableTemplate(template, { mode: 'flow-model' });
  if (analysis.errors.length !== 0 || analysis.paths.length !== 1 || analysis.value.kind !== 'string') return;
  if (analysis.value.expressions.length !== 1) return;
  const expression = analysis.value.expressions[0];
  const variablePath = expression.paths[0];
  if (
    !variablePath ||
    !expression.supported ||
    expression.paths.length !== 1 ||
    expression.expressionSpan.start !== 2 ||
    expression.expressionSpan.end !== 2 + path.length ||
    expression.placeholderSpan.start !== 0 ||
    expression.placeholderSpan.end !== template.length ||
    variablePath.span.start !== 2 ||
    variablePath.span.end !== 2 + path.length
  ) {
    return;
  }
  return { path, ref: variablePath };
}

function createValidatedGetVarTemplateFromPath(value: string): string | undefined {
  const validated = analyzeValidatedGetVarPath(value);
  return validated ? `{{ ${validated.path} }}` : undefined;
}

function createValidatedGetVarTemplate(
  value: unknown,
  code: string,
  staticValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): string | undefined {
  const path = resolveConstString(value, code, staticValueBindings, identifierBindings);
  return typeof path === 'string' ? createValidatedGetVarTemplateFromPath(path) : undefined;
}

function resolveConstString(
  value: unknown,
  code: string,
  staticValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
  seen: Set<StaticFilterValueBinding> = new Set(),
): string | undefined {
  const valueNode = unwrapAstChainExpression(value) as AstNode | undefined;
  if (!valueNode) return;
  const directValue = resolveAstStaticStringValue(valueNode, code);
  if (typeof directValue === 'string') return directValue;
  if (valueNode.type !== 'Identifier' || !valueNode.name) return;
  const binding = resolveAstAliasBinding(valueNode.name, valueNode.start || 0, staticValueBindings, identifierBindings);
  if (!binding || seen.has(binding)) return;
  seen.add(binding);
  return resolveConstString(binding.valueNode, code, staticValueBindings, identifierBindings, seen);
}

function collectConstIdentifierValueBindings(
  ast: unknown,
  code: string,
  identifierBindings: AstIdentifierBinding[],
): StaticFilterValueBinding[] {
  const simpleInitializers = new WeakMap<object, Set<string>>();
  walkAstAncestor(ast, {
    VariableDeclarator(node: AstNode, ancestors: AstNode[]) {
      const declaration = ancestors[ancestors.length - 2];
      const id = unwrapAstChainExpression(node.id) as AstNode | undefined;
      const initializer = unwrapAstChainExpression(node.init);
      if (
        declaration?.type !== 'VariableDeclaration' ||
        declaration.kind !== 'const' ||
        id?.type !== 'Identifier' ||
        !initializer ||
        typeof initializer !== 'object'
      ) {
        return;
      }
      if (!id.name) return;
      const names = simpleInitializers.get(initializer) || new Set<string>();
      names.add(id.name);
      simpleInitializers.set(initializer, names);
    },
  });
  return collectStaticFilterValueBindingsFromAst(ast, code, identifierBindings).filter((binding) => {
    const valueNode = unwrapAstChainExpression(binding.valueNode);
    return !!valueNode && typeof valueNode === 'object' && simpleInitializers.get(valueNode)?.has(binding.name);
  });
}

function resolveDynamicTemplateLiteral(
  node: unknown,
  staticValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
  seen: Set<StaticFilterValueBinding> = new Set(),
): AstNode | undefined {
  const valueNode = unwrapAstChainExpression(node) as AstNode | undefined;
  if (!valueNode) return;
  if (valueNode.type === 'TemplateLiteral' && valueNode.expressions?.length) return valueNode;
  if (valueNode.type !== 'Identifier' || !valueNode.name) return;

  const binding = resolveAstAliasBinding(valueNode.name, valueNode.start || 0, staticValueBindings, identifierBindings);
  if (!binding || seen.has(binding)) return;
  seen.add(binding);
  return resolveDynamicTemplateLiteral(binding.valueNode, staticValueBindings, identifierBindings, seen);
}

function createDynamicPathSentinel(index: number, parts: readonly string[]) {
  let suffix = 0;
  let sentinel = `__nocobase_dynamic_path_${index}_${suffix}__`;
  while (parts.some((part) => part.includes(sentinel))) {
    suffix += 1;
    sentinel = `__nocobase_dynamic_path_${index}_${suffix}__`;
  }
  return sentinel;
}

function getDynamicOnlyBracketValue(value: string, sentinels: readonly string[]) {
  const matchedSentinels = new Set<string>();
  const dynamicParts: string[] = [];
  let cursor = 0;
  while (cursor < value.length) {
    if (/\s/.test(value[cursor])) {
      cursor += 1;
      continue;
    }
    const sentinel = sentinels.find(
      (candidate) => !matchedSentinels.has(candidate) && value.startsWith(candidate, cursor),
    );
    if (!sentinel) return;
    matchedSentinels.add(sentinel);
    dynamicParts.push(sentinel);
    cursor += sentinel.length;
  }
  return dynamicParts.length ? dynamicParts.join('') : undefined;
}

function quoteDynamicOnlyBracketSegments(value: string, sentinels: readonly string[]) {
  const brackets: Array<{ end: number; start: number }> = [];
  const bracketStarts: number[] = [];
  let quote: '"' | "'" | undefined;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[') {
      bracketStarts.push(index);
      continue;
    }
    if (character !== ']' || !bracketStarts.length) continue;
    brackets.push({ start: bracketStarts.pop() as number, end: index });
  }

  let candidate = value;
  for (const bracket of brackets.sort((left, right) => right.start - left.start)) {
    const dynamicValue = getDynamicOnlyBracketValue(candidate.slice(bracket.start + 1, bracket.end), sentinels);
    if (!dynamicValue) continue;
    candidate = `${candidate.slice(0, bracket.start + 1)}${JSON.stringify(dynamicValue)}${candidate.slice(
      bracket.end,
    )}`;
  }
  return candidate;
}

function createPathSegmentPattern(
  value: string | number,
  sentinels: readonly string[],
  matchedSentinels: Set<string>,
): RunJsVariablePathSegmentPattern | undefined {
  if (typeof value === 'number') return Object.freeze({ kind: 'static', value });

  const occurrences = sentinels
    .map((sentinel) => ({ index: value.indexOf(sentinel), sentinel }))
    .filter((occurrence) => occurrence.index >= 0)
    .sort((left, right) => left.index - right.index);
  if (!occurrences.length) return Object.freeze({ kind: 'static', value });

  const parts: string[] = [];
  let cursor = 0;
  for (const occurrence of occurrences) {
    if (
      matchedSentinels.has(occurrence.sentinel) ||
      value.indexOf(occurrence.sentinel, occurrence.index + occurrence.sentinel.length) >= 0 ||
      occurrence.index < cursor
    ) {
      return;
    }
    parts.push(value.slice(cursor, occurrence.index));
    cursor = occurrence.index + occurrence.sentinel.length;
    matchedSentinels.add(occurrence.sentinel);
  }
  parts.push(value.slice(cursor));
  return Object.freeze({ kind: 'dynamic', parts: Object.freeze(parts) });
}

function getFunctionParameterEnvironmentNames(ancestors: readonly AstNode[]) {
  const names = new Set<string>();
  for (let index = 0; index < ancestors.length - 1; index += 1) {
    const ancestor = ancestors[index];
    if (!isAstFunctionLike(ancestor)) continue;
    if (!(ancestor.params || []).includes(ancestors[index + 1])) continue;
    for (const parameter of ancestor.params || []) {
      collectAstPatternBindingIdentifiers(parameter, (name: string) => names.add(name));
    }
  }
  return names;
}

function hasFunctionParameterBindingInArgument(argument: unknown, ancestors: readonly AstNode[]) {
  const parameterNames = getFunctionParameterEnvironmentNames(ancestors);
  if (!parameterNames.size || !argument) return false;
  let matched = false;
  walkAstAncestor(argument, {
    Identifier(node: AstNode, argumentAncestors: AstNode[]) {
      const parent = argumentAncestors[argumentAncestors.length - 2];
      if (!isNonReferenceIdentifier(node, parent) && node.name && parameterNames.has(node.name)) matched = true;
    },
  });
  return matched;
}

function createValidatedGetVarPathPattern(
  value: unknown,
  staticValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): RunJsVariablePathPattern | undefined {
  const templateLiteral = resolveDynamicTemplateLiteral(value, staticValueBindings, identifierBindings);
  if (!templateLiteral) return;

  const parts = (templateLiteral.quasis || []).map((quasi) => quasi.value?.cooked ?? quasi.value?.raw ?? '');
  if (parts.length !== (templateLiteral.expressions?.length || 0) + 1) return;
  parts[0] = parts[0].trimStart();
  parts[parts.length - 1] = parts[parts.length - 1].trimEnd();
  const sentinels = parts.slice(0, -1).map((_part, index) => createDynamicPathSentinel(index, parts));

  let candidate = parts[0];
  for (let index = 0; index < parts.length - 1; index += 1) {
    candidate += sentinels[index] + parts[index + 1];
  }
  candidate = quoteDynamicOnlyBracketSegments(candidate, sentinels);
  const validated = analyzeValidatedGetVarPath(candidate);
  if (!validated) return;
  if (sentinels.some((sentinel) => validated.ref.varName.includes(sentinel))) return;
  const matchedSentinels = new Set<string>();
  const segments = [validated.ref.varName, ...validated.ref.runtimeSegments].map((segment) =>
    createPathSegmentPattern(segment, sentinels, matchedSentinels),
  );
  if (segments.some((segment) => !segment) || matchedSentinels.size !== sentinels.length) return;
  return Object.freeze({
    segments: Object.freeze(segments as RunJsVariablePathSegmentPattern[]),
  });
}

export function matchesRunJsVariablePathPattern(pathRef: VariablePathRef, pattern: RunJsVariablePathPattern) {
  const values = [pathRef.varName, ...pathRef.runtimeSegments];
  if (values.length !== pattern.segments.length) return false;
  return pattern.segments.every((segment, index) => {
    const value = values[index];
    if (segment.kind === 'static') return value === segment.value;
    if (typeof value === 'number') return segment.parts.every((part) => part.length === 0);
    if (!value.startsWith(segment.parts[0])) return false;

    let cursor = segment.parts[0].length;
    for (let partIndex = 1; partIndex < segment.parts.length - 1; partIndex += 1) {
      const nextIndex = value.indexOf(segment.parts[partIndex], cursor);
      if (nextIndex < 0) return false;
      cursor = nextIndex + segment.parts[partIndex].length;
    }
    const suffix = segment.parts[segment.parts.length - 1];
    const suffixStart = value.length - suffix.length;
    return suffixStart >= cursor && value.startsWith(suffix, suffixStart);
  });
}

function resolveStaticJsonValue(
  node: unknown,
  code: string,
  staticValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
): StaticJsonResult {
  const valueNode = unwrapAstChainExpression(node) as AstNode | undefined;
  if (!valueNode) return { ok: false };
  const stringValue = resolveConstString(valueNode, code, staticValueBindings, identifierBindings);
  if (typeof stringValue === 'string') return { ok: true, value: stringValue };
  if (valueNode.type === 'Identifier') return { ok: false };
  if (valueNode.type === 'Literal') {
    const literalValue = valueNode.value;
    if (literalValue === null) return { ok: true, value: null };
    if (typeof literalValue === 'boolean') return { ok: true, value: literalValue };
    if (typeof literalValue === 'number' && Number.isFinite(literalValue)) return { ok: true, value: literalValue };
    return { ok: false };
  }
  if (valueNode.type === 'UnaryExpression' && valueNode.operator === '-') {
    const argument = unwrapAstChainExpression(valueNode.argument) as AstNode | undefined;
    return argument?.type === 'Literal' && typeof argument.value === 'number' && Number.isFinite(argument.value)
      ? { ok: true, value: -argument.value }
      : { ok: false };
  }
  if (valueNode.type === 'ArrayExpression') {
    const value: StaticJsonValue[] = [];
    for (const element of valueNode.elements || []) {
      if (!element || (element as AstNode).type === 'SpreadElement') return { ok: false };
      const resolved = resolveStaticJsonValue(element, code, staticValueBindings, identifierBindings);
      if (!resolved.ok) return resolved;
      value.push(resolved.value);
    }
    return { ok: true, value };
  }
  if (valueNode.type !== 'ObjectExpression') return { ok: false };

  const value: Record<string, StaticJsonValue> = Object.create(null);
  for (const propertyValue of valueNode.properties || []) {
    const property = propertyValue as AstNode | undefined;
    if (
      property?.type !== 'Property' ||
      property.computed ||
      property.kind !== 'init' ||
      property.method ||
      property.shorthand
    ) {
      return { ok: false };
    }
    const keyNode = unwrapAstChainExpression(property.key) as AstNode | undefined;
    const key =
      keyNode?.type === 'Identifier'
        ? keyNode.name
        : keyNode?.type === 'Literal' && (typeof keyNode.value === 'string' || typeof keyNode.value === 'number')
          ? String(keyNode.value)
          : undefined;
    if (typeof key !== 'string' || key === '__proto__' || Object.prototype.hasOwnProperty.call(value, key)) {
      return { ok: false };
    }
    const resolved = resolveStaticJsonValue(property.value, code, staticValueBindings, identifierBindings);
    if (!resolved.ok) return resolved;
    value[key] = resolved.value;
  }
  return { ok: true, value };
}

function collectValidatedResolveJsonTemplates(value: StaticJsonValue): string[] {
  const analysis = analyzeVariableTemplate(value, { mode: 'untrusted-request' });
  if (!analysis.supported || analysis.errors.length) return [];

  const templates = new Set<string>();
  const visit = (current: StaticJsonValue) => {
    if (typeof current === 'string') {
      if (analyzeVariableTemplate(current, { mode: 'untrusted-request' }).paths.length) templates.add(current);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current && typeof current === 'object') Object.values(current).forEach(visit);
  };
  visit(value);
  return Array.from(templates);
}

function extractStaticVariableDependencies(code: string): Readonly<{
  pathPatterns: readonly RunJsVariablePathPattern[];
  templates: readonly string[];
}> {
  const parsed = parseRunJsAuthoringAst(code);
  if (!parsed.ast) return { pathPatterns: [], templates: [] };

  const identifierBindings = collectAstIdentifierBindingsFromAst(parsed.ast, code);
  if (hasUnsafeCtxUsage(parsed.ast, identifierBindings) || hasCtxMutation(parsed.ast, identifierBindings)) {
    return { pathPatterns: [], templates: [] };
  }

  const staticValueBindings = collectConstIdentifierValueBindings(parsed.ast, code, identifierBindings);
  const functionCtxParameterCache = new WeakMap<object, boolean>();
  const pathPatterns = new Map<string, RunJsVariablePathPattern>();
  const templates = new Set<string>();
  walkAstAncestor(parsed.ast, {
    CallExpression(node: AstNode, ancestors: AstNode[]) {
      const methodName = getDirectCtxMethodName(node.callee, identifierBindings);
      if (
        hasCtxParameterInFunctionAncestors(ancestors, functionCtxParameterCache) ||
        hasFunctionParameterBindingInArgument(node.arguments?.[0], ancestors)
      ) {
        return;
      }
      if (methodName === 'getVar') {
        const pathPattern = createValidatedGetVarPathPattern(
          node.arguments?.[0],
          staticValueBindings,
          identifierBindings,
        );
        if (pathPattern) {
          pathPatterns.set(JSON.stringify(pathPattern), pathPattern);
          return;
        }
        const template = createValidatedGetVarTemplate(
          node.arguments?.[0],
          code,
          staticValueBindings,
          identifierBindings,
        );
        if (template) templates.add(template);
        return;
      }
      if (methodName !== 'resolveJsonTemplate' || node.arguments?.length !== 1) return;
      const resolved = resolveStaticJsonValue(node.arguments[0], code, staticValueBindings, identifierBindings);
      if (!resolved.ok) return;
      collectValidatedResolveJsonTemplates(resolved.value).forEach((template) => templates.add(template));
    },
  });
  return {
    pathPatterns: Array.from(pathPatterns.values()),
    templates: Array.from(templates),
  };
}

export function prepareFlowModelVariableSource(
  value: unknown,
  options: Readonly<{ isRunJsValuePath?: (pathTail: readonly string[]) => boolean }> = {},
): PreparedFlowModelVariableSource {
  try {
    const pathPatterns = new Map<string, RunJsVariablePathPattern>();
    const templates = new Set<string>();
    const seen = new WeakSet<object>();
    const root: Record<string, unknown> = Object.create(null);
    const stack: TraversalFrame[] = [{ depth: 0, input: value, key: 'value', parent: root, pathTail: [] }];
    let scheduledNodes = 1;
    let sourceCount = 0;
    let totalStringLength = 0;
    let totalSourceLength = 0;

    while (stack.length) {
      const frame = stack.pop();
      if (!frame) break;
      const { depth, input, key, parent, pathTail } = frame;
      if (!input || typeof input !== 'object') {
        if (typeof input === 'string') {
          totalStringLength += input.length;
          if (
            input.length > MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH ||
            totalStringLength > MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH
          ) {
            return { ok: false };
          }
        }
        defineTraversalValue(parent, key, input);
        continue;
      }
      if (seen.has(input)) return { ok: false };
      seen.add(input);

      const { descriptors, entries } = getEnumerableDataEntries(input);
      for (const [entryKey] of entries) {
        totalStringLength += entryKey.length;
        if (
          entryKey.length > MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH ||
          totalStringLength > MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH
        ) {
          return { ok: false };
        }
      }
      const runJsPath = options.isRunJsValuePath ? options.isRunJsValuePath(pathTail) : isPersistedRunJsPath(pathTail);
      const runJs = !Array.isArray(input) && runJsPath ? readPersistedRunJsValue(entries) : undefined;
      const output = createTraversalContainer(input, descriptors);
      defineTraversalValue(parent, key, output);

      if (runJs) {
        scheduledNodes += entries.length;
        sourceCount += 1;
        totalStringLength += runJs.code.length + (runJs.version?.length || 0);
        totalSourceLength += runJs.code.length;
        if (
          scheduledNodes > MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES ||
          runJs.code.length > MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH ||
          (runJs.version != null && runJs.version.length > MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH) ||
          totalStringLength > MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH ||
          sourceCount > MAX_RUNJS_SOURCES_PER_REQUEST ||
          runJs.code.length > MAX_RUNJS_SOURCE_LENGTH ||
          totalSourceLength > MAX_RUNJS_TOTAL_SOURCE_LENGTH
        ) {
          return { ok: false };
        }
        for (const [entryKey, entryValue] of entries) {
          const preparedEntryValue =
            entryKey === 'code' ? (runJs.version === 'v2' ? '' : maskJavaScriptComments(runJs.code)) : entryValue;
          defineTraversalValue(output, entryKey, preparedEntryValue);
        }
        const dependencies = extractStaticVariableDependencies(runJs.code);
        dependencies.templates.forEach((template) => templates.add(template));
        dependencies.pathPatterns.forEach((pattern) => pathPatterns.set(JSON.stringify(pattern), pattern));
        continue;
      }

      if (entries.length && depth >= MAX_FLOW_MODEL_VARIABLE_SOURCE_DEPTH) return { ok: false };
      scheduledNodes += entries.length;
      if (scheduledNodes > MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES) return { ok: false };
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [entryKey, entryValue] = entries[index];
        const nextPath = [...pathTail, entryKey];
        stack.push({
          depth: depth + 1,
          input: entryValue,
          key: entryKey,
          parent: output,
          pathTail: options.isRunJsValuePath ? nextPath : nextPath.slice(-3),
        });
      }
    }

    return {
      ok: true,
      runJsPathPatterns: Array.from(pathPatterns.values()),
      runJsTemplates: Array.from(templates),
      templateSource: root.value,
    };
  } catch {
    return { ok: false };
  }
}

export function collectPersistedRunJsVariableTemplates(value: unknown): string[] {
  const prepared = prepareFlowModelVariableSource(value);
  return prepared.ok ? Array.from(prepared.runJsTemplates) : [];
}
