/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CallArgumentSource,
  CtxLibMemberCaseMismatch,
  FlowResourceAlias,
  ReactComponentAlias,
  ResourceCallInReactHook,
  SourceBinding,
  SourceRange,
  StringLiteralBinding,
} from '../internal-types';
import {
  CTX_LIB_MEMBER_BY_LOWERCASE,
  FLOW_RESOURCE_CLASS_NAMES,
  INIT_RESOURCE_CLASS_NAMES,
  REACT_HOOK_PATTERN,
  REACT_NODE_COMPONENT_PROP_NAMES,
  RUNJS_RESOURCE_ACTION_PATTERN,
} from '../runtime/constants';
import {
  dedupeIndexedEntries,
  findSourceBindingByDeclaration,
  isNameBoundAtIndex,
  isSourceAliasShadowedAtIndex,
} from '../ast/bindings';
import {
  escapeRegExp,
  findMatchingDelimiter,
  findTopLevelChar,
  getCallArgumentSource,
  getCallArgumentSources,
  getCallFirstArgumentSource,
  getPreviousSignificantToken,
  maskJavaScriptComments,
  maskJavaScriptSource,
  readCompleteStringLiteral,
  readLeadingStringLiteral,
  splitTopLevel,
  splitTopLevelWithRanges,
  trimBindingElement,
} from '../ast/source';

export function collectInvalidApiResourceCalls(source: string, masked: string, bindings: SourceBinding[]) {
  const resourceMethods = new Set(['list', 'get', 'create', 'update', 'destroy']);
  const entries = [
    ...masked.matchAll(
      /\bctx\s*(?:\?\.|\.)\s*api\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*(list|get|create|update|destroy)\s*(?:\?\.)?\(/g,
    ),
  ]
    .filter((match) => !isNameBoundAtIndex(bindings, 'ctx', match.index || 0))
    .map((match) => ({
      index: match.index || 0,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
      method: match[1],
    }));

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*api\s*(?:\?\.|\.)\s*resource\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const openParen = masked.indexOf('(', index);
    const closeParen = openParen >= 0 ? findMatchingDelimiter(masked, openParen) : -1;
    const args = getCallArgumentSources(source, masked, index);
    if (args.length >= 2) {
      const method = readCompleteStringLiteral(args[0]?.source || '')?.value;
      if (method && resourceMethods.has(method)) {
        entries.push({
          index,
          match: `ctx.api.resource('${method}')`,
          method,
        });
      }
      const resourceName = readCompleteStringLiteral(args[0]?.source || '')?.value;
      const action = readCompleteStringLiteral(args[1]?.source || '')?.value;
      if (action && resourceMethods.has(action)) {
        entries.push({
          index,
          match: resourceName
            ? `ctx.api.resource('${resourceName}', '${action}')`
            : `ctx.api.resource(..., '${action}')`,
          method: action,
        });
      }
    }
    if (closeParen < 0) {
      continue;
    }
    const chainedMethod = masked
      .slice(closeParen + 1, closeParen + 96)
      .match(/^\s*(?:\?\.|\.)\s*(list|get|create|update|destroy)\s*(?:\?\.)?\(/);
    if (!chainedMethod) {
      continue;
    }
    const method = chainedMethod[1];
    const resourceName = readCompleteStringLiteral(args[0]?.source || '')?.value;
    entries.push({
      index,
      match: resourceName ? `ctx.api.resource('${resourceName}').${method}` : `ctx.api.resource(...).${method}`,
      method,
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectInvalidResourceTypeCalls(
  source: string,
  masked: string,
  stringBindings: StringLiteralBinding[],
  bindings: SourceBinding[],
) {
  const entries: Array<{
    capability: string;
    expression?: string;
    index: number;
    message?: string;
    resourceType?: string;
    ruleId: string;
  }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const method = match[1];
    const capability = `ctx.${method}`;
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      entries.push({
        capability,
        expression: '',
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate ${capability}(...) without a resource type`,
      });
      continue;
    }
    const resolved = resolveResourceTypeExpression(firstArg, stringBindings);
    if (resolved.status === 'unresolved') {
      entries.push({
        capability,
        expression: resolved.expression,
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate dynamic ${capability}(...) resource type '${resolved.expression}'`,
      });
      continue;
    }
    const allowedResourceTypes = method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
    if (!allowedResourceTypes.has(resolved.value)) {
      entries.push({
        capability,
        index,
        resourceType: resolved.value,
        ruleId: 'runjs-make-resource-type-invalid',
        message: `flowSurfaces authoring ${capability}(...) expects a FlowResource class name, not collection '${resolved.value}'`,
      });
    }
  }
  return entries;
}

export function collectResourceCallsInReactHooks(
  source: string,
  masked: string,
  reactHookCalls: Array<{ hook: string; index: number; match: string }>,
  bindings: SourceBinding[],
): ResourceCallInReactHook[] {
  const hookArgumentRanges = reactHookCalls
    .map((hook) => {
      const firstArg = getCallArgumentSources(source, masked, hook.index)[0];
      return firstArg ? { hook: hook.hook, range: firstArg } : null;
    })
    .filter(Boolean) as Array<{ hook: string; range: SourceRange }>;
  if (!hookArgumentRanges.length) {
    return [];
  }

  const entries: ResourceCallInReactHook[] = [];
  const pattern = /\bctx\s*(?:\?\.|\.)\s*(?:(makeResource|initResource)\s*(?:\?\.)?\(|resource\b)/g;
  for (const match of masked.matchAll(pattern)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const hook = hookArgumentRanges.find((entry) => index >= entry.range.start && index < entry.range.end);
    if (!hook) {
      continue;
    }
    entries.push({
      capability: match[1] ? `ctx.${match[1]}` : 'ctx.resource',
      hook: hook.hook,
      index,
    });
  }
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function resolveResourceTypeExpression(
  arg: CallArgumentSource,
  stringBindings: StringLiteralBinding[],
): { status: 'resolved'; value: string } | { status: 'unresolved'; expression: string } {
  const expression = arg.source.trim();
  const leadingLength = arg.source.length - arg.source.trimStart().length;
  const expressionIndex = arg.start + leadingLength;
  const literal = readCompleteStringLiteral(arg.source);
  if (literal) {
    return { status: 'resolved', value: literal.value };
  }
  if (/^[A-Za-z_$][\w$]*$/.test(expression)) {
    const binding = stringBindings.find(
      (entry) => entry.name === expression && expressionIndex >= entry.start && expressionIndex < entry.end,
    );
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  return {
    status: 'unresolved',
    expression,
  };
}

export function collectFlowResourceAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: FlowResourceAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    const binding = findSourceBindingByDeclaration(bindings, name, declarationIndex);
    aliases.push({
      name,
      capability,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', (match.index || 0) + match[0].lastIndexOf('ctx'))) {
      continue;
    }
    addAlias(match[1], `ctx.${match[2]}`, match.index || 0);
  }
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*resource\b/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', (match.index || 0) + match[0].lastIndexOf('ctx'))) {
      continue;
    }
    addAlias(match[1], 'ctx.resource', match.index || 0);
  }
  return aliases;
}

export function collectInvalidFlowResourceListCalls(
  masked: string,
  aliases: FlowResourceAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ capability: string; index: number }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g)) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    entries.push({
      index: match.index || 0,
      capability: 'ctx.resource.list',
    });
  }
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\([^)]*\)\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    entries.push({
      index: match.index || 0,
      capability: `ctx.${match[1]}(...).list`,
    });
  }
  aliases.forEach((alias) => {
    const pattern = new RegExp(
      `(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.|\\.)\\s*list\\s*(?:\\?\\.)?\\(`,
      'g',
    );
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      if (isSourceAliasShadowedAtIndex(alias, bindings, index)) {
        continue;
      }
      entries.push({
        index,
        capability: `${alias.name}.list`,
      });
    }
  });
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectCtxLibMemberCaseMismatches(
  source: string,
  masked: string,
  bindings: SourceBinding[],
): CtxLibMemberCaseMismatch[] {
  const entries: CtxLibMemberCaseMismatch[] = [];
  const addEntry = (
    index: number,
    member: string,
    accessKind: CtxLibMemberCaseMismatch['accessKind'],
    capability?: string,
  ) => {
    const expectedMember = CTX_LIB_MEMBER_BY_LOWERCASE.get(member.toLowerCase());
    if (!expectedMember || expectedMember === member) {
      return;
    }
    entries.push({
      accessKind,
      capability: capability || `ctx.libs.${member}`,
      expectedCapability: `ctx.libs.${expectedMember}`,
      expectedMember,
      index,
      member,
    });
  };

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*libs\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const member = match[1];
    addEntry(index + match[0].lastIndexOf(member), member, 'member');
  }

  for (const match of source.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*libs\s*(?:\?\.)?\s*\[\s*(['"])([A-Za-z_$][\w$]*)\1\s*\]/g,
  )) {
    const index = match.index || 0;
    if (masked.slice(index, index + 3) !== 'ctx' || isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const quote = match[1];
    const member = match[2];
    addEntry(index + match[0].indexOf(member), member, 'bracket', `ctx.libs[${quote}${member}${quote}]`);
  }

  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\s*(?:\?\.|\.)\s*libs\b/g)) {
    const declarationIndex = match.index || 0;
    const ctxIndex = declarationIndex + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const bindingPattern = match[1];
    const patternStart = declarationIndex + match[0].indexOf(bindingPattern);
    splitTopLevelWithRanges(bindingPattern, ',').forEach((property) => {
      const prop = readObjectBindingPropertyName(property.source);
      if (!prop) {
        return;
      }
      addEntry(patternStart + property.start + prop.offset, prop.name, 'destructure', `ctx.libs.${prop.name}`);
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function readObjectBindingPropertyName(element: string): { name: string; offset: number } | undefined {
  const trimmed = element.trim();
  if (!trimmed || trimmed.startsWith('...') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return undefined;
  }
  const normalized = trimBindingElement(trimmed);
  const colon = findTopLevelChar(normalized, ':');
  const rawProperty = (colon >= 0 ? normalized.slice(0, colon) : normalized).trim();
  const name = normalizeObjectPropertyName(rawProperty);
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
    return undefined;
  }
  const offset = Math.max(0, element.indexOf(name));
  return { name, offset };
}

export function collectReactHookCalls(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ hook: string; index: number; match: string }> = [];
  const memberPattern = new RegExp(
    `\\b(?:(?:ctx\\s*(?:\\?\\.|\\.)\\s*(?:libs\\s*(?:\\?\\.|\\.)\\s*)?React)|React)\\s*(?:\\?\\.|\\.)\\s*(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`,
    'g',
  );
  for (const match of masked.matchAll(memberPattern)) {
    const index = match.index || 0;
    if (masked.slice(index, index + 3) === 'ctx' && isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    entries.push({
      hook: match[1],
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  const barePattern = new RegExp(`(?<![.$\\w])(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`, 'g');
  for (const match of masked.matchAll(barePattern)) {
    const index = match.index || 0;
    const hook = match[1];
    if (getPreviousSignificantToken(masked, index) === 'function' || isObjectPropertyKey(masked, index, hook)) {
      continue;
    }
    entries.push({
      hook,
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectUnboundReactCreateElementCalls(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number }> = [];
  for (const match of masked.matchAll(/(?<![.$\w])React\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (!isNameBoundAtIndex(bindings, 'React', index)) {
      entries.push({ index });
    }
  }
  return entries;
}

export function collectReactComponentAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: ReactComponentAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    if (!/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const binding = findSourceBindingByDeclaration(bindings, name, declarationIndex);
    aliases.push({
      name,
      capability,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\b/g,
  )) {
    const declarationIndex = match.index || 0;
    const ctxIndex = declarationIndex + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    collectObjectBindingAliases(match[1]).forEach((alias) =>
      addAlias(alias, `${namespace}.${alias}`, declarationIndex),
    );
  }

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Z][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\b/g,
  )) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    addAlias(match[1], `${namespace}.${match[4]}`, match.index || 0);
  }

  return aliases;
}

export function collectReactComponentFunctionCalls(
  masked: string,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    const namespace = `ctx.${match[1] ? 'libs.' : ''}${match[2]}`;
    entries.push({
      index: match.index || 0,
      component: match[3],
      capability: `${namespace}.${match[3]}`,
    });
  }

  aliases.forEach((alias) => {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.)?\\(`, 'g');
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      if (isSourceAliasShadowedAtIndex(alias, bindings, index)) {
        continue;
      }
      const previous = getPreviousSignificantToken(masked, index);
      if (previous === 'function' || isObjectPropertyKey(masked, index, alias.name)) {
        continue;
      }
      entries.push({
        index,
        component: alias.name,
        capability: alias.capability,
      });
    }
  });

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectCtxRenderComponentSignatureCalls(
  source: string,
  masked: string,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      continue;
    }
    const reference = readReactComponentReference(firstArg.source, aliases, firstArg.start, bindings);
    if (reference) {
      entries.push({
        index: firstArg.start,
        ...reference,
      });
    }
  }
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

export function collectReactComponentPropReferences(
  source: string,
  masked: string,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const inspectPropsArg = (arg: CallArgumentSource | undefined) => {
    if (!arg) {
      return;
    }
    collectReactComponentPropReferencesFromObject(arg, aliases, bindings).forEach((entry) => entries.push(entry));
  };

  for (const match of masked.matchAll(
    /\b(?:(?:ctx\s*(?:\?\.|\.)\s*(?:libs\s*(?:\?\.|\.)\s*)?React)|React)\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g,
  )) {
    if (
      masked.slice(match.index || 0, (match.index || 0) + 3) === 'ctx' &&
      isNameBoundAtIndex(bindings, 'ctx', match.index || 0)
    ) {
      continue;
    }
    inspectPropsArg(getCallArgumentSources(source, masked, match.index || 0)[1]);
  }

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    const args = getCallArgumentSources(source, masked, match.index || 0);
    if (!readReactComponentReference(args[0]?.source || '', aliases, args[0]?.start || 0, bindings)) {
      continue;
    }
    inspectPropsArg(args[1]);
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactComponentPropReferencesFromObject(
  arg: CallArgumentSource,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const localMasked = maskJavaScriptSource(arg.source);
  const openOffset = arg.source.search(/\S/);
  if (openOffset < 0 || arg.source[openOffset] !== '{') {
    return entries;
  }
  const closeOffset = findMatchingDelimiter(localMasked, openOffset);
  if (closeOffset <= openOffset) {
    return entries;
  }
  const body = arg.source.slice(openOffset + 1, closeOffset);
  const bodyStart = arg.start + openOffset + 1;
  splitTopLevelWithRanges(body, ',').forEach((property) => {
    const colon = findTopLevelChar(property.source, ':');
    if (colon < 0) {
      return;
    }
    const propName = normalizeObjectPropertyName(property.source.slice(0, colon));
    if (!REACT_NODE_COMPONENT_PROP_NAMES.has(propName)) {
      return;
    }
    const rawValue = property.source.slice(colon + 1);
    const leading = rawValue.length - rawValue.trimStart().length;
    const valueStart = bodyStart + property.start + colon + 1 + leading;
    const reference = readReactComponentReference(rawValue, aliases, valueStart, bindings);
    if (!reference) {
      return;
    }
    entries.push({
      index: valueStart,
      prop: propName,
      ...reference,
    });
  });
  return entries;
}

function readReactComponentReference(
  expression: string,
  aliases: ReactComponentAlias[],
  expressionIndex: number,
  bindings: SourceBinding[],
): { component: string; capability: string } | undefined {
  const normalized = maskJavaScriptComments(expression).trim();
  const ctxMatch = normalized.match(
    /^ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)$/,
  );
  if (ctxMatch) {
    if (isNameBoundAtIndex(bindings, 'ctx', expressionIndex)) {
      return undefined;
    }
    const namespace = `ctx.${ctxMatch[1] ? 'libs.' : ''}${ctxMatch[2]}`;
    return {
      component: ctxMatch[3],
      capability: `${namespace}.${ctxMatch[3]}`,
    };
  }

  const aliasMatch = normalized.match(/^([A-Z][\w$]*)$/);
  if (!aliasMatch) {
    return undefined;
  }
  const alias = aliases.find(
    (entry) =>
      entry.name === aliasMatch[1] &&
      expressionIndex >= entry.start &&
      expressionIndex < entry.end &&
      !isSourceAliasShadowedAtIndex(entry, bindings, expressionIndex),
  );
  return alias
    ? {
        component: alias.name,
        capability: alias.capability,
      }
    : undefined;
}

function normalizeObjectPropertyName(value: string) {
  return value
    .trim()
    .replace(/^['"]([A-Za-z_$][\w$]*)['"]$/, '$1')
    .replace(/^\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\]$/, '$1');
}

function isObjectPropertyKey(masked: string, index: number, name: string) {
  let cursor = index + name.length;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] === ':') {
    return true;
  }
  if (masked[cursor] !== '(') {
    return false;
  }
  const previous = getPreviousSignificantToken(masked, index);
  return previous === '{' || previous === ',';
}

export function collectDirectDomWrites(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number; match: string }> = [];
  const commentMasked = maskJavaScriptComments(source);
  const windowAliases = collectWindowAliases(masked, bindings);
  let documentAliases = collectDocumentDomAliases(source, masked, bindings, windowAliases);
  const documentCarrierProperties = collectDocumentCarrierProperties(
    source,
    masked,
    bindings,
    documentAliases,
    windowAliases,
  );
  documentAliases = closeSourceAliasCopies(
    dedupeSourceAliasEntries([
      ...documentAliases,
      ...collectDocumentCarrierAliases(source, masked, bindings, documentCarrierProperties),
    ]),
    masked,
    bindings,
  );
  const documentCreateElementAliases = collectDocumentCreateElementAliases(
    source,
    masked,
    bindings,
    documentAliases,
    windowAliases,
  );
  const pattern =
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|\b(document)\s*(?:\?\.|\.)\s*(createElement)\b|\b(element)\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|(?<![.$\w])(insertAdjacentHTML)\s*(?:\?\.)?\(/g;
  for (const match of masked.matchAll(pattern)) {
    const index = match.index || 0;
    const boundRoot = match[3] || match[5];
    const bareFunction = match[7];
    if (
      (match[1] === 'ctx' && isNameBoundAtIndex(bindings, 'ctx', index)) ||
      (boundRoot && isNameBoundAtIndex(bindings, boundRoot, index)) ||
      (bareFunction && isNameBoundAtIndex(bindings, bareFunction, index))
    ) {
      continue;
    }
    entries.push({ index, match: match[0].replace(/\s*(?:\?\.)?\($/, '') });
  }
  for (const match of commentMasked.matchAll(
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, 'ctx') &&
      !isNameBoundAtIndex(bindings, 'ctx', index) &&
      (dynamicMember || isDirectDomMember(member))
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  for (const match of commentMasked.matchAll(
    /\b(document)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || member === 'createElement')
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  collectWindowDocumentCreateElementAccesses(commentMasked, masked).forEach((access) => {
    if (resolveActiveRootCapability(access.rootName, access.rootIndex, 'window', 'window', windowAliases, bindings)) {
      entries.push({ index: access.index, match: access.match });
    }
  });
  for (const match of commentMasked.matchAll(
    /\b(element)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || isDirectDomMember(member))
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  const documentCreateElementAccessesByRoot = collectDocumentCreateElementAccesses(commentMasked, masked);
  documentAliases.forEach((alias) => {
    (documentCreateElementAccessesByRoot.get(alias.name) || []).forEach((access) => {
      if (isSourceAliasActiveAtIndex(alias, bindings, access.rootIndex)) {
        entries.push({ index: access.index, match: access.match });
      }
    });
  });
  const carrierCreateElementAccessesByProperty = collectCarrierDocumentCreateElementAccesses(commentMasked, masked);
  documentCarrierProperties.forEach((carrier) => {
    (
      carrierCreateElementAccessesByProperty.get(carrierPropertyKey(carrier.objectName, carrier.propertyName)) || []
    ).forEach((access) => {
      if (isDocumentCarrierPropertyActiveAtIndex(carrier, bindings, access.rootIndex)) {
        entries.push({ index: access.index, match: access.match });
      }
    });
  });
  const createElementCallsByName = collectBareCreateElementCalls(masked);
  documentCreateElementAliases.forEach((alias) => {
    (createElementCallsByName.get(alias.name) || []).forEach((call) => {
      if (
        isSourceAliasActiveAtIndex(alias, bindings, call.index) &&
        !isObjectPropertyKey(masked, call.index, alias.name)
      ) {
        entries.push({ index: call.index, match: call.match });
      }
    });
  });
  return entries;
}

type SourceAliasEntry = {
  capability: string;
  declarationStart: number;
  end: number;
  name: string;
  start: number;
};

type SourceAliasCopyEdge = {
  declarationIndex: number;
  sourceIndex: number;
  sourceName: string;
  targetName: string;
};

type SourceAliasBindingIndex = {
  byDeclaration: Map<string, SourceBinding>;
  byName: Map<string, SourceBinding[]>;
};

type RootMemberAccess = {
  index: number;
  match: string;
  rootIndex: number;
  rootName: string;
};

type BareCall = {
  index: number;
  match: string;
};

type DocumentCarrierProperty = {
  capability: string;
  declarationStart: number;
  end: number;
  objectName: string;
  propertyName: string;
  start: number;
};

type CreateElementAliasCandidate = {
  alias: string;
  declarationIndex: number;
  rootIndex: number;
  rootName: string;
};

function collectWindowAliases(masked: string, bindings: SourceBinding[]): SourceAliasEntry[] {
  const entries: SourceAliasEntry[] = [];

  const addAlias = (alias: string, declarationIndex: number) => {
    if (alias === 'window') {
      return;
    }
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, 'window');
  };

  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*window\b(?!\s*(?:\.|\?\.|\[))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*window\b(?!\s*(?:\.|\?\.|\[))/g,
    ],
    (match) => {
      const declarationIndex = match.index || 0;
      const windowIndex = declarationIndex + match[0].lastIndexOf('window');
      if (isNameBoundAtIndex(bindings, 'window', windowIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex);
    },
  );

  return closeSourceAliasCopies(dedupeSourceAliasEntries(entries), masked, bindings);
}

function collectDocumentDomAliases(
  source: string,
  masked: string,
  bindings: SourceBinding[],
  windowAliases: SourceAliasEntry[],
): SourceAliasEntry[] {
  const entries: SourceAliasEntry[] = [];
  const commentMasked = maskJavaScriptComments(source);

  const addAlias = (alias: string, declarationIndex: number, capability: string) => {
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, capability);
  };

  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\b(?!\s*(?:\.|\?\.|\[))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*document\b(?!\s*(?:\.|\?\.|\[))/g,
    ],
    (match) => {
      const alias = match[1];
      const documentIndex = (match.index || 0) + match[0].lastIndexOf('document');
      if (isNameBoundAtIndex(bindings, 'document', documentIndex)) {
        return;
      }
      addAlias(alias, match.index || 0, 'document');
    },
  );

  collectDocumentAliasesFromWindowRoot(
    commentMasked,
    masked,
    bindings,
    'window',
    'window',
    (index) => !isNameBoundAtIndex(bindings, 'window', index),
    entries,
  );

  windowAliases.forEach((windowAlias) => {
    collectDocumentAliasesFromWindowRoot(
      commentMasked,
      masked,
      bindings,
      windowAlias.name,
      windowAlias.capability,
      (index) => isSourceAliasActiveAtIndex(windowAlias, bindings, index),
      entries,
    );
  });

  return closeSourceAliasCopies(dedupeSourceAliasEntries(entries), masked, bindings);
}

function collectDocumentCreateElementAliases(
  source: string,
  masked: string,
  bindings: SourceBinding[],
  documentAliases: SourceAliasEntry[],
  windowAliases: SourceAliasEntry[],
): SourceAliasEntry[] {
  const entries: SourceAliasEntry[] = [];
  const commentMasked = maskJavaScriptComments(source);
  const createElementAliasCandidatesByRoot = collectCreateElementAliasCandidatesFromDocumentRoots(
    commentMasked,
    masked,
  );

  const addAlias = (alias: string, declarationIndex: number, capability: string) => {
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, capability);
  };

  collectCreateElementAliasesFromDocumentRoot(
    commentMasked,
    masked,
    bindings,
    'document',
    'document',
    (index) => !isNameBoundAtIndex(bindings, 'document', index),
    entries,
  );

  collectCreateElementAliasesFromWindowDocumentRoot(
    commentMasked,
    masked,
    bindings,
    'window',
    'window',
    (index) => !isNameBoundAtIndex(bindings, 'window', index),
    entries,
  );

  windowAliases.forEach((windowAlias) => {
    collectCreateElementAliasesFromWindowDocumentRoot(
      commentMasked,
      masked,
      bindings,
      windowAlias.name,
      windowAlias.capability,
      (index) => isSourceAliasActiveAtIndex(windowAlias, bindings, index),
      entries,
    );
  });

  collectAliasMatches(
    masked,
    [/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\s*(?:\?\.|\.)\s*createElement\b/g],
    (match) => {
      const declarationIndex = match.index || 0;
      const documentIndex = declarationIndex + match[0].lastIndexOf('document');
      if (isNameBoundAtIndex(bindings, 'document', documentIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex, 'document.createElement');
    },
  );
  for (const match of commentMasked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\s*(?:\?\.\s*)?\[\s*(['"])createElement\2\s*\]/g,
  )) {
    const declarationIndex = match.index || 0;
    const documentIndex = declarationIndex + match[0].lastIndexOf('document');
    if (!isCodeTokenAt(masked, documentIndex, 'document') || isNameBoundAtIndex(bindings, 'document', documentIndex)) {
      continue;
    }
    addAlias(match[1], declarationIndex, 'document.createElement');
  }

  documentAliases.forEach((documentAlias) => {
    (createElementAliasCandidatesByRoot.get(documentAlias.name) || []).forEach((candidate) => {
      if (!isSourceAliasActiveAtIndex(documentAlias, bindings, candidate.rootIndex)) {
        return;
      }
      addAlias(candidate.alias, candidate.declarationIndex, `${documentAlias.capability}.createElement`);
    });
  });

  return closeSourceAliasCopies(dedupeSourceAliasEntries(entries), masked, bindings);
}

function collectDocumentCarrierProperties(
  source: string,
  masked: string,
  bindings: SourceBinding[],
  documentAliases: SourceAliasEntry[],
  windowAliases: SourceAliasEntry[],
): DocumentCarrierProperty[] {
  const entries: DocumentCarrierProperty[] = [];
  const commentMasked = maskJavaScriptComments(source);
  const addObjectLiteral = (objectName: string, declarationIndex: number, openBrace: number) => {
    const closeBrace = findMatchingDelimiter(masked, openBrace);
    if (closeBrace <= openBrace) {
      return;
    }
    const binding =
      findSourceBindingByDeclaration(bindings, objectName, declarationIndex) ||
      findActiveSourceBindingAtIndex(bindings, objectName, declarationIndex);
    const bodyStart = openBrace + 1;
    const body = source.slice(bodyStart, closeBrace);
    splitTopLevelWithRanges(body, ',').forEach((property) => {
      const carrierProperty = readDocumentCarrierObjectProperty(property.source, bodyStart + property.start);
      if (!carrierProperty) {
        return;
      }
      const capability = resolveDocumentExpressionCapability({
        expression: carrierProperty.value,
        expressionStart: carrierProperty.valueStart,
        masked,
        bindings,
        documentAliases,
        windowAliases,
      });
      if (!capability) {
        return;
      }
      entries.push({
        capability,
        declarationStart: binding?.declarationStart ?? binding?.start ?? declarationIndex,
        end: binding?.end ?? masked.length,
        objectName,
        propertyName: carrierProperty.propertyName,
        start: declarationIndex,
      });
    });
  };

  collectAliasMatches(
    masked,
    [/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g, /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*\{/g],
    (match) => {
      const declarationIndex = match.index || 0;
      const openBrace = declarationIndex + match[0].lastIndexOf('{');
      if (!isCodeTokenAt(commentMasked, openBrace, '{')) {
        return;
      }
      addObjectLiteral(match[1], declarationIndex, openBrace);
    },
  );

  return dedupeDocumentCarrierProperties(entries);
}

function collectDocumentCarrierAliases(
  source: string,
  masked: string,
  bindings: SourceBinding[],
  carriers: DocumentCarrierProperty[],
): SourceAliasEntry[] {
  const entries: SourceAliasEntry[] = [];
  if (!carriers.length) {
    return entries;
  }
  const commentMasked = maskJavaScriptComments(source);
  const carriersByObject = new Map<string, DocumentCarrierProperty[]>();
  carriers.forEach((carrier) => {
    const existing = carriersByObject.get(carrier.objectName);
    if (existing) {
      existing.push(carrier);
    } else {
      carriersByObject.set(carrier.objectName, [carrier]);
    }
  });

  const addAliases = (bindingPattern: string, declarationIndex: number, objectName: string, objectIndex: number) => {
    const objectCarriers = carriersByObject.get(objectName);
    if (!objectCarriers?.length || !isCodeTokenAt(masked, objectIndex, objectName)) {
      return;
    }
    objectCarriers.forEach((carrier) => {
      if (!isDocumentCarrierPropertyActiveAtIndex(carrier, bindings, objectIndex)) {
        return;
      }
      collectObjectBindingAliasesForProperty(bindingPattern, carrier.propertyName).forEach((alias) => {
        addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, carrier.capability);
      });
    });
  };

  for (const match of commentMasked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\b/g)) {
    const declarationIndex = match.index || 0;
    const objectIndex = declarationIndex + match[0].lastIndexOf(match[2]);
    addAliases(match[1], declarationIndex, match[2], objectIndex);
  }

  for (const match of commentMasked.matchAll(/\(\s*\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    const declarationIndex = match.index || 0;
    const objectIndex = declarationIndex + match[0].lastIndexOf(match[2]);
    addAliases(match[1], declarationIndex, match[2], objectIndex);
  }

  return dedupeSourceAliasEntries(entries);
}

function collectWindowDocumentCreateElementAccesses(commentMasked: string, masked: string): RootMemberAccess[] {
  return collectRootMemberAccesses(
    commentMasked,
    masked,
    [
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*document\s*(?:\?\.|\.)\s*createElement\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*document\s*(?:\?\.\s*)?\[\s*(['"])createElement\2\s*\]/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])document\2\s*\]\s*(?:\?\.|\.)\s*createElement\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])document\2\s*\]\s*(?:\?\.\s*)?\[\s*(['"])createElement\3\s*\]/g,
    ],
    (match) => ({
      rootName: match[1],
      rootIndex: (match.index || 0) + match[0].indexOf(match[1]),
      index: match.index || 0,
      match: match[0],
    }),
  );
}

function collectDocumentCreateElementAccesses(commentMasked: string, masked: string) {
  const entries = collectRootMemberAccesses(
    commentMasked,
    masked,
    [
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*createElement\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])createElement\2\s*\]/g,
    ],
    (match) => ({
      rootName: match[1],
      rootIndex: (match.index || 0) + match[0].indexOf(match[1]),
      index: match.index || 0,
      match: match[0],
    }),
  );
  return groupRootMemberAccessesByRoot(entries);
}

function collectCarrierDocumentCreateElementAccesses(commentMasked: string, masked: string) {
  const entries: Array<RootMemberAccess & { propertyName: string }> = [];
  const addEntries = (pattern: RegExp, propertyGroup: number) => {
    entries.push(
      ...collectRootMemberAccesses(commentMasked, masked, [pattern], (match) => ({
        rootName: match[1],
        rootIndex: (match.index || 0) + match[0].indexOf(match[1]),
        index: match.index || 0,
        match: match[0],
        propertyName: match[propertyGroup],
      })),
    );
  };
  addEntries(/(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*createElement\b/g, 2);
  addEntries(
    /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])createElement\3\s*\]/g,
    2,
  );
  addEntries(
    /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])([A-Za-z_$][\w$]*)\2\s*\]\s*(?:\?\.|\.)\s*createElement\b/g,
    3,
  );
  addEntries(
    /(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])([A-Za-z_$][\w$]*)\2\s*\]\s*(?:\?\.\s*)?\[\s*(['"])createElement\4\s*\]/g,
    3,
  );
  const grouped = new Map<string, RootMemberAccess[]>();
  entries.forEach((entry) => {
    const propertyName = entry.propertyName;
    if (!propertyName) {
      return;
    }
    const key = carrierPropertyKey(entry.rootName, propertyName);
    const existing = grouped.get(key);
    const normalizedEntry = {
      index: entry.index,
      match: entry.match,
      rootIndex: entry.rootIndex,
      rootName: entry.rootName,
    };
    if (existing) {
      existing.push(normalizedEntry);
    } else {
      grouped.set(key, [normalizedEntry]);
    }
  });
  return grouped;
}

function collectBareCreateElementCalls(masked: string) {
  const grouped = new Map<string, BareCall[]>();
  for (const match of masked.matchAll(/(?<![.$\w])([A-Za-z_$][\w$]*)\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    const name = match[1];
    if (getPreviousSignificantToken(masked, index) === 'function') {
      continue;
    }
    const entry = {
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    };
    const existing = grouped.get(name);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(name, [entry]);
    }
  }
  return grouped;
}

function collectCreateElementAliasCandidatesFromDocumentRoots(commentMasked: string, masked: string) {
  const candidates: CreateElementAliasCandidate[] = [];
  const addCandidate = (candidate: CreateElementAliasCandidate) => {
    if (!candidate.alias || !isCodeTokenAt(masked, candidate.rootIndex, candidate.rootName)) {
      return;
    }
    candidates.push(candidate);
  };

  for (const match of commentMasked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\b/g)) {
    const declarationIndex = match.index || 0;
    const rootName = match[2];
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addCandidate({ alias, declarationIndex, rootIndex, rootName });
    });
  }

  for (const match of commentMasked.matchAll(/\(\s*\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    const declarationIndex = match.index || 0;
    const rootName = match[2];
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addCandidate({ alias, declarationIndex, rootIndex, rootName });
    });
  }

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*createElement\b/g,
  )) {
    const declarationIndex = match.index || 0;
    const rootName = match[2];
    addCandidate({
      alias: match[1],
      declarationIndex,
      rootIndex: declarationIndex + match[0].lastIndexOf(rootName),
      rootName,
    });
  }

  for (const match of commentMasked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])createElement\3\s*\]/g,
  )) {
    const declarationIndex = match.index || 0;
    const rootName = match[2];
    addCandidate({
      alias: match[1],
      declarationIndex,
      rootIndex: declarationIndex + match[0].lastIndexOf(rootName),
      rootName,
    });
  }

  return groupCreateElementAliasCandidatesByRoot(candidates);
}

function groupCreateElementAliasCandidatesByRoot(candidates: CreateElementAliasCandidate[]) {
  const grouped = new Map<string, CreateElementAliasCandidate[]>();
  const seen = new Set<string>();
  candidates.forEach((candidate) => {
    const key = `${candidate.rootName}:${candidate.rootIndex}:${candidate.alias}:${candidate.declarationIndex}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const existing = grouped.get(candidate.rootName);
    if (existing) {
      existing.push(candidate);
    } else {
      grouped.set(candidate.rootName, [candidate]);
    }
  });
  return grouped;
}

function collectRootMemberAccesses<T extends RootMemberAccess>(
  commentMasked: string,
  masked: string,
  patterns: RegExp[],
  toEntry: (match: RegExpMatchArray & { index?: number }) => T,
) {
  const entries: T[] = [];
  const seen = new Set<string>();
  collectAliasMatches(commentMasked, patterns, (match) => {
    const entry = toEntry(match);
    if (!isCodeTokenAt(masked, entry.rootIndex, entry.rootName)) {
      return;
    }
    const key = `${entry.index}:${entry.match}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push(entry);
  });
  return entries;
}

function groupRootMemberAccessesByRoot(entries: RootMemberAccess[]) {
  const grouped = new Map<string, RootMemberAccess[]>();
  entries.forEach((entry) => {
    const existing = grouped.get(entry.rootName);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.rootName, [entry]);
    }
  });
  return grouped;
}

function readDocumentCarrierObjectProperty(source: string, start: number) {
  const trimmed = source.trim();
  if (!trimmed || trimmed.startsWith('...') || trimmed.startsWith('{')) {
    return undefined;
  }
  const leading = source.length - source.trimStart().length;
  const colon = findTopLevelChar(trimmed, ':');
  if (colon >= 0) {
    const propertyName = normalizeObjectPropertyName(trimmed.slice(0, colon));
    if (!/^[A-Za-z_$][\w$]*$/.test(propertyName)) {
      return undefined;
    }
    const rawValue = trimmed.slice(colon + 1);
    const valueLeading = rawValue.length - rawValue.trimStart().length;
    const value = rawValue.trim();
    if (!value) {
      return undefined;
    }
    return {
      propertyName,
      value,
      valueStart: start + leading + colon + 1 + valueLeading,
    };
  }
  const shorthand = trimmed.match(/^([A-Za-z_$][\w$]*)$/);
  if (!shorthand) {
    return undefined;
  }
  return {
    propertyName: shorthand[1],
    value: shorthand[1],
    valueStart: start + leading,
  };
}

function resolveDocumentExpressionCapability(input: {
  bindings: SourceBinding[];
  documentAliases: SourceAliasEntry[];
  expression: string;
  expressionStart: number;
  masked: string;
  windowAliases: SourceAliasEntry[];
}) {
  const expression = input.expression.trim();
  const bare = expression.match(/^([A-Za-z_$][\w$]*)$/);
  if (bare) {
    const name = bare[1];
    const index = input.expressionStart + expression.indexOf(name);
    if (
      name === 'document' &&
      isCodeTokenAt(input.masked, index, name) &&
      !isNameBoundAtIndex(input.bindings, name, index)
    ) {
      return 'document';
    }
    const alias = input.documentAliases.find(
      (entry) => entry.name === name && isSourceAliasActiveAtIndex(entry, input.bindings, index),
    );
    return alias?.capability;
  }

  const dotDocument = expression.match(/^([A-Za-z_$][\w$]*)\s*(?:\?\.|\.)\s*document$/);
  if (dotDocument) {
    const rootName = dotDocument[1];
    const rootIndex = input.expressionStart + expression.indexOf(rootName);
    const rootCapability = resolveActiveRootCapability(
      rootName,
      rootIndex,
      'window',
      'window',
      input.windowAliases,
      input.bindings,
    );
    return rootCapability ? `${rootCapability}.document` : undefined;
  }

  const bracketDocument = expression.match(/^([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\[\s*(['"])document\2\s*\]$/);
  if (bracketDocument) {
    const rootName = bracketDocument[1];
    const rootIndex = input.expressionStart + expression.indexOf(rootName);
    const rootCapability = resolveActiveRootCapability(
      rootName,
      rootIndex,
      'window',
      'window',
      input.windowAliases,
      input.bindings,
    );
    return rootCapability ? `${rootCapability}["document"]` : undefined;
  }

  return undefined;
}

function resolveActiveRootCapability(
  rootName: string,
  rootIndex: number,
  expectedRootName: string,
  expectedCapability: string,
  aliases: SourceAliasEntry[],
  bindings: SourceBinding[],
) {
  if (rootName === expectedRootName && !isNameBoundAtIndex(bindings, rootName, rootIndex)) {
    return expectedCapability;
  }
  const alias = aliases.find(
    (entry) => entry.name === rootName && isSourceAliasActiveAtIndex(entry, bindings, rootIndex),
  );
  return alias?.capability;
}

function carrierPropertyKey(objectName: string, propertyName: string) {
  return `${objectName}.${propertyName}`;
}

function isDocumentCarrierPropertyActiveAtIndex(
  carrier: DocumentCarrierProperty,
  bindings: SourceBinding[],
  index: number,
) {
  const aliasLike: SourceAliasEntry = {
    capability: carrier.capability,
    declarationStart: carrier.declarationStart,
    end: carrier.end,
    name: carrier.objectName,
    start: carrier.start,
  };
  return isSourceAliasActiveAtIndex(aliasLike, bindings, index);
}

function dedupeDocumentCarrierProperties(entries: DocumentCarrierProperty[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.objectName}:${entry.propertyName}:${entry.declarationStart}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectDocumentAliasesFromWindowRoot(
  commentMasked: string,
  masked: string,
  bindings: SourceBinding[],
  rootName: string,
  rootCapability: string,
  isRootActive: (index: number) => boolean,
  entries: SourceAliasEntry[],
) {
  const rootToken = identifierTokenPattern(rootName);
  const addAlias = (alias: string, declarationIndex: number, capability: string) => {
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, capability);
  };

  collectAliasMatches(
    masked,
    [
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\b`,
        'g',
      ),
      new RegExp(`(?<![.$\\w])([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\b`, 'g'),
    ],
    (match) => {
      const declarationIndex = match.index || 0;
      const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
      if (!isRootActive(rootIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex, `${rootCapability}.document`);
    },
  );

  collectAliasMatches(
    commentMasked,
    [
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]`,
        'g',
      ),
      new RegExp(
        `(?<![.$\\w])([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]`,
        'g',
      ),
    ],
    (match) => {
      const declarationIndex = match.index || 0;
      const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
      if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex, `${rootCapability}["document"]`);
    },
  );

  for (const match of commentMasked.matchAll(
    new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\b(?!\\s*(?:\\.|\\?\\.))`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'document').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.document`);
    });
  }

  for (const match of commentMasked.matchAll(
    new RegExp(`\\(\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\b(?!\\s*(?:\\.|\\?\\.))\\s*\\)`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'document').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.document`);
    });
  }
}

function collectCreateElementAliasesFromDocumentRoot(
  commentMasked: string,
  masked: string,
  bindings: SourceBinding[],
  rootName: string,
  rootCapability: string,
  isRootActive: (index: number) => boolean,
  entries: SourceAliasEntry[],
) {
  const rootToken = identifierTokenPattern(rootName);
  const addAlias = (alias: string, declarationIndex: number, capability: string) => {
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, capability);
  };

  for (const match of commentMasked.matchAll(
    new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}(?![\\w$])`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.createElement`);
    });
  }

  for (const match of commentMasked.matchAll(
    new RegExp(`\\(\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}(?![\\w$])\\s*\\)`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.createElement`);
    });
  }

  for (const match of masked.matchAll(
    new RegExp(
      `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*createElement\\b`,
      'g',
    ),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isRootActive(rootIndex)) {
      continue;
    }
    addAlias(match[1], declarationIndex, `${rootCapability}.createElement`);
  }

  for (const match of commentMasked.matchAll(
    new RegExp(
      `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])createElement\\2\\s*\\]`,
      'g',
    ),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    addAlias(match[1], declarationIndex, `${rootCapability}.createElement`);
  }
}

function collectCreateElementAliasesFromWindowDocumentRoot(
  commentMasked: string,
  masked: string,
  bindings: SourceBinding[],
  rootName: string,
  rootCapability: string,
  isRootActive: (index: number) => boolean,
  entries: SourceAliasEntry[],
) {
  const rootToken = identifierTokenPattern(rootName);
  const addAlias = (alias: string, declarationIndex: number, capability: string) => {
    addSourceAliasEntry(entries, masked, bindings, alias, declarationIndex, capability);
  };

  for (const match of commentMasked.matchAll(
    new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\b`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.document.createElement`);
    });
  }

  for (const match of commentMasked.matchAll(
    new RegExp(
      `\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]`,
      'g',
    ),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}["document"].createElement`);
    });
  }

  for (const match of commentMasked.matchAll(
    new RegExp(`\\(\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\s*\\)`, 'g'),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}.document.createElement`);
    });
  }

  for (const match of commentMasked.matchAll(
    new RegExp(
      `\\(\\s*\\{([^}]*)\\}\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]\\s*\\)`,
      'g',
    ),
  )) {
    const declarationIndex = match.index || 0;
    const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
    if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
      continue;
    }
    collectObjectBindingAliasesForProperty(match[1], 'createElement').forEach((alias) => {
      addAlias(alias, declarationIndex, `${rootCapability}["document"].createElement`);
    });
  }

  collectAliasMatches(
    masked,
    [
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\s*(?:\\?\\.|\\.)\\s*createElement\\b`,
        'g',
      ),
    ],
    (match) => {
      const declarationIndex = match.index || 0;
      const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
      if (!isRootActive(rootIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex, `${rootCapability}.document.createElement`);
    },
  );

  collectAliasMatches(
    commentMasked,
    [
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.|\\.)\\s*document\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])createElement\\2\\s*\\]`,
        'g',
      ),
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]\\s*(?:\\?\\.|\\.)\\s*createElement\\b`,
        'g',
      ),
      new RegExp(
        `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${rootToken}\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])document\\2\\s*\\]\\s*(?:\\?\\.\\s*)?\\[\\s*(['"])createElement\\3\\s*\\]`,
        'g',
      ),
    ],
    (match) => {
      const declarationIndex = match.index || 0;
      const rootIndex = declarationIndex + match[0].lastIndexOf(rootName);
      if (!isCodeTokenAt(masked, rootIndex, rootName) || !isRootActive(rootIndex)) {
        return;
      }
      addAlias(match[1], declarationIndex, `${rootCapability}.document.createElement`);
    },
  );
}

export function collectDirectDomAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1])
      .filter((alias) => alias === 'element')
      .forEach((alias) => {
        entries.push({ alias, index: ctxIndex });
      });
  }
  return dedupeAliasEntries(entries);
}

export function collectCtxAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (alias === 'ctx' || isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, index: ctxIndex });
    });
  }
  return dedupeAliasEntries(entries);
}

function collectAliasMatches(
  masked: string,
  patterns: RegExp[],
  onMatch: (match: RegExpMatchArray & { index?: number }) => void,
) {
  patterns.forEach((pattern) => {
    for (const match of masked.matchAll(pattern)) {
      onMatch(match);
    }
  });
}

function dedupeAliasEntries<T extends { alias: string; index: number }>(entries: T[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.alias}:${entry.index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeSourceAliasEntries(entries: SourceAliasEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.name}:${entry.declarationStart}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function closeSourceAliasCopies(entries: SourceAliasEntry[], masked: string, bindings: SourceBinding[]) {
  const closed = dedupeSourceAliasEntries(entries);
  const seen = new Set(closed.map((entry) => sourceAliasEntryKey(entry)));
  const bindingIndex = createSourceAliasBindingIndex(bindings);
  const copyEdgesBySource = collectSourceAliasCopyEdges(masked);
  for (let cursor = 0; cursor < closed.length; cursor += 1) {
    const sourceAlias = closed[cursor];
    const copyEdges = copyEdgesBySource.get(sourceAlias.name);
    if (!copyEdges) {
      continue;
    }
    copyEdges.forEach((edge) => {
      if (
        !isCodeTokenAt(masked, edge.sourceIndex, sourceAlias.name) ||
        !isSourceAliasActiveAtIndexFromIndex(sourceAlias, bindingIndex, edge.sourceIndex)
      ) {
        return;
      }
      const entry = createSourceAliasEntryFromIndex(
        masked,
        bindingIndex,
        edge.targetName,
        edge.declarationIndex,
        sourceAlias.capability,
      );
      const key = sourceAliasEntryKey(entry);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      closed.push(entry);
    });
  }
  return closed;
}

function collectSourceAliasCopyEdges(masked: string) {
  const edgesBySource = new Map<string, SourceAliasCopyEdge[]>();
  const seen = new Set<string>();
  const addEdge = (match: RegExpMatchArray & { index?: number }, targetName: string, sourceName: string) => {
    const declarationIndex = match.index || 0;
    const sourceOffset = match[0].lastIndexOf(sourceName);
    if (sourceOffset < 0) {
      return;
    }
    const sourceIndex = declarationIndex + sourceOffset;
    if (!isCodeTokenAt(masked, sourceIndex, sourceName)) {
      return;
    }
    const key = `${targetName}:${declarationIndex}:${sourceName}:${sourceIndex}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const edge = {
      declarationIndex,
      sourceIndex,
      sourceName,
      targetName,
    };
    const edges = edgesBySource.get(sourceName);
    if (edges) {
      edges.push(edge);
    } else {
      edgesBySource.set(sourceName, [edge]);
    }
  };

  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)(?!\s*(?:\.|\?\.|\[))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)(?!\s*(?:\.|\?\.|\[))/g,
    ],
    (match) => addEdge(match, match[1], match[2]),
  );

  return edgesBySource;
}

function createSourceAliasBindingIndex(bindings: SourceBinding[]): SourceAliasBindingIndex {
  const byDeclaration = new Map<string, SourceBinding>();
  const byName = new Map<string, SourceBinding[]>();
  bindings.forEach((binding) => {
    byDeclaration.set(sourceBindingDeclarationKey(binding.name, binding.declarationStart ?? binding.start), binding);
    const nameBindings = byName.get(binding.name);
    if (nameBindings) {
      nameBindings.push(binding);
    } else {
      byName.set(binding.name, [binding]);
    }
  });
  return { byDeclaration, byName };
}

function sourceBindingDeclarationKey(name: string, declarationStart: number) {
  return `${name}:${declarationStart}`;
}

function sourceAliasEntryKey(entry: SourceAliasEntry) {
  return sourceBindingDeclarationKey(entry.name, entry.declarationStart);
}

function addSourceAliasEntry(
  entries: SourceAliasEntry[],
  masked: string,
  bindings: SourceBinding[],
  name: string,
  declarationIndex: number,
  capability: string,
) {
  entries.push(createSourceAliasEntry(masked, bindings, name, declarationIndex, capability));
}

function createSourceAliasEntry(
  masked: string,
  bindings: SourceBinding[],
  name: string,
  declarationIndex: number,
  capability: string,
) {
  const binding =
    findSourceBindingByDeclaration(bindings, name, declarationIndex) ||
    findActiveSourceBindingAtIndex(bindings, name, declarationIndex);
  return {
    capability,
    declarationStart: binding?.declarationStart ?? binding?.start ?? declarationIndex,
    end: binding?.end ?? masked.length,
    name,
    start: declarationIndex,
  };
}

function createSourceAliasEntryFromIndex(
  masked: string,
  bindingIndex: SourceAliasBindingIndex,
  name: string,
  declarationIndex: number,
  capability: string,
) {
  const binding =
    bindingIndex.byDeclaration.get(sourceBindingDeclarationKey(name, declarationIndex)) ||
    findActiveSourceBindingAtIndexFromIndex(bindingIndex, name, declarationIndex);
  return {
    capability,
    declarationStart: binding?.declarationStart ?? binding?.start ?? declarationIndex,
    end: binding?.end ?? masked.length,
    name,
    start: declarationIndex,
  };
}

function findActiveSourceBindingAtIndex(bindings: SourceBinding[], name: string, index: number) {
  return bindings
    .filter((binding) => binding.name === name && index >= binding.start && index < binding.end)
    .sort((left, right) => left.end - left.start - (right.end - right.start))[0];
}

function findActiveSourceBindingAtIndexFromIndex(bindingIndex: SourceAliasBindingIndex, name: string, index: number) {
  const bindings = bindingIndex.byName.get(name);
  if (!bindings?.length) {
    return undefined;
  }
  let match: SourceBinding | undefined;
  bindings.forEach((binding) => {
    if (index < binding.start || index >= binding.end) {
      return;
    }
    if (!match || binding.end - binding.start < match.end - match.start) {
      match = binding;
    }
  });
  return match;
}

function identifierTokenPattern(name: string) {
  return `(?<![.$\\w])${escapeRegExp(name)}(?![\\w$])`;
}

function collectObjectBindingAliases(pattern: string) {
  return splitTopLevel(pattern, ',')
    .flatMap((element) => collectObjectBindingElementAliases(element))
    .filter(Boolean);
}

function collectObjectBindingAliasesForProperty(pattern: string, propertyName: string) {
  return splitTopLevel(pattern, ',')
    .flatMap((element) => collectObjectBindingElementAliasesForProperty(element, propertyName))
    .filter(Boolean);
}

function collectObjectBindingElementAliases(element: string): string[] {
  const trimmed = element
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  if (!trimmed || trimmed.startsWith('{')) {
    return [];
  }
  const colon = findTopLevelChar(trimmed, ':');
  if (colon >= 0) {
    const right = trimBindingElement(trimmed.slice(colon + 1));
    const match = right.match(/^([A-Za-z_$][\w$]*)\b/);
    return match ? [match[1]] : [];
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  return match ? [match[1]] : [];
}

function collectObjectBindingElementAliasesForProperty(element: string, propertyName: string): string[] {
  const trimmed = element
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  if (!trimmed || trimmed.startsWith('{')) {
    return [];
  }
  const colon = findTopLevelChar(trimmed, ':');
  if (colon >= 0) {
    const left = normalizeObjectPropertyName(trimmed.slice(0, colon));
    if (left !== propertyName) {
      return [];
    }
    const right = trimBindingElement(trimmed.slice(colon + 1));
    const match = right.match(/^([A-Za-z_$][\w$]*)\b/);
    return match ? [match[1]] : [];
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  return match?.[1] === propertyName ? [match[1]] : [];
}

function isSourceAliasActiveAtIndex(alias: SourceAliasEntry, bindings: SourceBinding[], index: number) {
  return index >= alias.start && index < alias.end && !isSourceAliasShadowedAtIndex(alias, bindings, index);
}

function isSourceAliasActiveAtIndexFromIndex(
  alias: SourceAliasEntry,
  bindingIndex: SourceAliasBindingIndex,
  index: number,
) {
  return (
    index >= alias.start && index < alias.end && !isSourceAliasShadowedAtIndexFromIndex(alias, bindingIndex, index)
  );
}

function isSourceAliasShadowedAtIndexFromIndex(
  alias: SourceAliasEntry,
  bindingIndex: SourceAliasBindingIndex,
  index: number,
) {
  const aliasDeclarationStart = alias.declarationStart ?? alias.start;
  return (bindingIndex.byName.get(alias.name) || []).some(
    (binding) =>
      index >= binding.start &&
      index < binding.end &&
      (binding.declarationStart ?? binding.start) !== aliasDeclarationStart,
  );
}

function isDirectDomMember(member: string) {
  return member === 'innerHTML' || member === 'insertAdjacentHTML';
}

function isCodeTokenAt(masked: string, index: number, token: string) {
  return masked.slice(index, index + token.length) === token;
}

export function collectCtxMemberAccesses(masked: string, bindings: SourceBinding[]) {
  return [...masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => !isNameBoundAtIndex(bindings, 'ctx', match.index || 0))
    .map((match) => ({
      member: match[1],
      index: match.index || 0,
    }));
}

export function isTopLevelFunctionWrapper(
  masked: string,
  functionRanges: SourceRange[],
  topLevelCtxRenderCalls: any[],
) {
  if (topLevelCtxRenderCalls.length || !functionRanges.length) {
    return false;
  }
  return /^\s*(?:async\s+)?function\b/.test(masked) || /^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=/.test(masked);
}

export function isResourceLikeCtxRequest(source: string, masked: string, index: number) {
  const args = getCallArgumentSource(source, masked, index);
  if (!args) {
    return false;
  }
  const firstArg = getCallFirstArgumentSource(source, masked, index);
  const firstArgLiteral = firstArg ? readLeadingStringLiteral(firstArg) : undefined;
  if (firstArgLiteral) {
    return isResourceLikeCtxRequestUrl(firstArgLiteral.value.trim());
  }
  const urlMatch = args.match(/\burl\s*:\s*(['"`])([^'"`]+)\1/i) || args.match(/^\s*(['"`])([^'"`]+)\1\s*$/);
  if (urlMatch) {
    return isResourceLikeCtxRequestUrl(urlMatch[2].trim());
  }
  return /\b(?:resource|collectionName|collection)\s*:/i.test(args);
}

function isResourceLikeCtxRequestUrl(url: string) {
  if (/^(?:https?:)?\/\//i.test(url)) {
    return false;
  }
  const resourceUrl = url.replace(/^\/api\//i, '').replace(/^\//, '');
  return isResourceLikeRequestUrl(resourceUrl);
}

function isResourceLikeRequestUrl(url: string) {
  return /^(?:[A-Za-z_$][\w$.-]*|\$\{[^}]+\}):(?:list|get)(?:\b|[/?#])/i.test(url);
}

export function getResourceLikeCtxRunjsEntrypoint(source: string, masked: string, index: number) {
  const firstArg = getCallFirstArgumentSource(source, masked, index);
  if (!firstArg) {
    return '';
  }
  const literal = readLeadingStringLiteral(firstArg);
  if (literal) {
    const endpoint = literal.value.trim();
    return isResourceLikeRunjsEntrypoint(endpoint) ? endpoint : '';
  }
  const expression = firstArg.trim();
  return isResourceLikeRunjsEntrypointExpression(expression) ? expression : '';
}

function isResourceLikeRunjsEntrypoint(value: string) {
  const trimmed = value.trim();
  const action = RUNJS_RESOURCE_ACTION_PATTERN;
  return (
    new RegExp(`^(?:resource|collection):${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`^[A-Za-z_$][\\w$.-]*:${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`\\$\\{[^}]+\\}\\s*:${action}(?:$|[/?#])`, 'i').test(trimmed)
  );
}

function isResourceLikeRunjsEntrypointExpression(value: string) {
  const withoutComments = maskJavaScriptComments(value);
  return new RegExp(`(['"\`])\\s*:${RUNJS_RESOURCE_ACTION_PATTERN}\\1`).test(withoutComments);
}
