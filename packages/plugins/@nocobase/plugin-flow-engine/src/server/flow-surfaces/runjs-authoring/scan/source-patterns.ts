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
  FORBIDDEN_BARE_GLOBALS,
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

export function collectForbiddenBareGlobals(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ name: string; index: number }> = [];
  for (const name of FORBIDDEN_BARE_GLOBALS) {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(name)}\\b`, 'g');
    for (const match of masked.matchAll(pattern)) {
      if (
        !isNameBoundAtIndex(bindings, name, match.index || 0) &&
        !isObjectPropertyKey(masked, match.index || 0, name)
      ) {
        entries.push({ name, index: match.index || 0 });
      }
    }
  }
  return entries.sort((left, right) => left.index - right.index);
}

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
  return value.trim().replace(/^['"]([A-Za-z_$][\w$]*)['"]$/, '$1');
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
  return entries;
}

export function collectWindowDocumentNavigatorUses(source: string, masked: string, bindings: SourceBinding[]) {
  const commentMasked = maskJavaScriptComments(source);
  const entries = [...masked.matchAll(/\b(window|document|navigator)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => !isNameBoundAtIndex(bindings, match[1], match.index || 0))
    .map((match) => ({
      root: match[1],
      member: match[2],
      index: match.index || 0,
    }));
  for (const match of commentMasked.matchAll(
    /\b(window|document|navigator)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const root = match[1];
    if (!isCodeTokenAt(masked, index, root) || isNameBoundAtIndex(bindings, root, index)) {
      continue;
    }
    entries.push({
      root,
      member: match[3] || '[dynamic]',
      index,
    });
  }
  return entries.sort((left, right) => left.index - right.index);
}

export function collectWindowDocumentNavigatorAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; root: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
    ],
    (match) => {
      const alias = match[1];
      const root = match[2];
      const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
      if (alias === root || isNameBoundAtIndex(bindings, root, rootIndex)) {
        return;
      }
      entries.push({ alias, root, index: rootIndex });
    },
  );
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(window|document|navigator)\b(?!\s*(?:\.|\?\.))/g,
  )) {
    const root = match[2];
    const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
    if (isNameBoundAtIndex(bindings, root, rootIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, root, index: rootIndex });
    });
  }
  return dedupeAliasEntries(entries);
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

function collectObjectBindingAliases(pattern: string) {
  return splitTopLevel(pattern, ',')
    .flatMap((element) => collectObjectBindingElementAliases(element))
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
