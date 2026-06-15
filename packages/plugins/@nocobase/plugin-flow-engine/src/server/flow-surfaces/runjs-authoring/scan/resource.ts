/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import { getCollectionName, resolveFieldFromCollection, resolveFieldTargetCollection } from '../../service-helpers';
import {
  FLOW_RESOURCE_CLASS_NAMES,
  FLOW_RESOURCE_METHODS_BY_TYPE,
  FLOW_RESOURCE_METHOD_SUGGESTIONS,
  INIT_RESOURCE_CLASS_NAMES,
  RUNJS_COLLECTION_RESOURCE_ACTION_ALIASES,
  RUNJS_COLLECTION_RESOURCE_ACTIONS,
  RUNJS_RESOURCE_CHAINABLE_STATE_METHODS,
  RUNJS_RESOURCE_ENDPOINT_ACTION_PATTERN,
  UNKNOWN_FLOW_RESOURCE_METHODS,
} from '../runtime/constants';
import { normalizeText } from '../runtime/surface';
import type {
  AstFlowResourceAlias,
  AstFlowResourceSource,
  AstIdentifierBinding,
  AstRunJsResourceState,
  CtxApiAlias,
  CtxApiResourceAliases,
  CtxMethodAlias,
  FlowResourceInstanceType,
  RunJsAstInspection,
  RunJsAuthoringContext,
  SharedCtxResourceCallInFunction,
  SourceRange,
  StaticFilterValueBinding,
  StaticStringBinding,
} from '../internal-types';
import { getAstSource } from '../ast/source';
import { walkAstAncestor } from '../ast/walk';
import {
  findAstAncestor,
  getAstBindingScopeRange,
  getAstExecutionScopeRange,
  isAstAlwaysExecutedInCurrentExecutionScope,
  isAstFunctionLike,
  isSameAstRange,
  unwrapAstChainExpression,
} from '../ast/bindings';
import { collectAstIdentifierWritesFromAst } from '../ast/execution';
import {
  collectAstObjectPatternAliases,
  getAstStaticPropertyName,
  hasAstShadowBinding,
  isAstCtxApiAliasAssignmentOperator,
  isUnshadowedCtxIdentifier,
  resolveAstAliasBinding,
  resolveAstResourceTypeExpression,
  resolveCtxMethodCall,
  resolveRunJsStaticString,
  trimAstAliasesAfterWrites,
  getRunJsObjectProperty,
} from '../ast/static-values';
import {
  getRunJsApiResourceCallDataSourceKey,
  getRunJsStaticRequestConfigObjectFromAst,
  getRunJsStaticRequestDataSourceKeyFromAst,
} from '../ast/request-config';
import {
  collectMaybeCtxApiResourceCallsFromAst,
  getCtxApiCapabilityFromAst,
  getCtxApiResourceCallFromAst,
  getMaybeCtxApiCapabilityFromAst,
  getMaybeCtxApiResourceHandleAliasFromAst,
} from './ctx-api';

export function collectAstInvalidResourceTypeCall(
  node: any,
  method: string,
  capability: string,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidResourceTypeCalls'] {
  const firstArg = node.arguments?.[0];
  if (!firstArg) {
    return [
      {
        capability,
        expression: '',
        index: node.start || 0,
        ruleId: 'runjs-make-resource-type-unresolved',
      },
    ];
  }
  const resolved = resolveAstResourceTypeExpression(firstArg, source, stringBindings, identifierBindings);
  if (resolved.status === 'unresolved') {
    return [
      {
        capability,
        expression: resolved.expression,
        index: node.start || 0,
        ruleId: 'runjs-make-resource-type-unresolved',
      },
    ];
  }
  const allowedResourceTypes = method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
  if (!allowedResourceTypes.has(resolved.value)) {
    return [
      {
        capability,
        expression: source.slice(firstArg.start || 0, firstArg.end || firstArg.start || 0).trim(),
        index: node.start || 0,
        resourceType: resolved.value,
        ruleId: 'runjs-make-resource-type-invalid',
      },
    ];
  }
  return [];
}

export function collectAstFlowResourceAliasesFromAst(
  ast: any,
  source: string,
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): AstFlowResourceAlias[] {
  const aliases: AstFlowResourceAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
  const addAlias = (name: string, resource: AstFlowResourceSource, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: resource.capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      resourceType: resource.resourceType,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const collectCtxResourcePatternAliases = (pattern: any, ctxNode: any, ancestors: any[], isVar = false) => {
    if (!isUnshadowedCtxIdentifier(ctxNode, identifierBindings)) {
      return;
    }
    collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
      if (member === 'resource') {
        addAlias(
          name,
          {
            capability: 'ctx.resource',
            index: typeof ctxNode?.start === 'number' ? ctxNode.start : 0,
            resourceType: 'unknown',
          },
          aliasNode || pattern,
          ancestors,
          isVar,
        );
      }
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (isAstCtxApiAliasAssignmentOperator(node.operator) && node.left?.type === 'Identifier') {
        const resource = getMaybeAstFlowResourceSourceFromAst(
          node.right,
          getActiveAliases(),
          source,
          identifierBindings,
          ctxMethodAliases,
          stringBindings,
        );
        if (resource) {
          addAlias(node.left.name, resource, node, ancestors);
        }
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxResourcePatternAliases(node.left, node.right, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const resource = getMaybeAstFlowResourceSourceFromAst(
          node.init,
          getActiveAliases(),
          source,
          identifierBindings,
          ctxMethodAliases,
          stringBindings,
        );
        if (resource) {
          addAlias(node.id.name, resource, node, ancestors, isVar);
        }
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxResourcePatternAliases(node.id, node.init, ancestors, isVar);
      }
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

export function collectAstInvalidFlowResourceMethodCall(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): {
  invalidListCalls: RunJsAstInspection['invalidFlowResourceListCalls'];
  invalidMethodCalls: RunJsAstInspection['invalidFlowResourceMethodCalls'];
} {
  const callee = unwrapAstChainExpression(node.callee);
  if (!callee || callee.type !== 'MemberExpression') {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const method = getAstStaticPropertyName(callee);
  if (!method) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const resource = getMaybeAstFlowResourceSourceFromAst(
    callee.object,
    aliases,
    source,
    identifierBindings,
    ctxMethodAliases,
    stringBindings,
  );
  if (!resource) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const capability = getAstSource(callee, source);
  if (method === 'list') {
    return {
      invalidListCalls: [
        {
          capability,
          index: typeof callee.start === 'number' ? callee.start : node.start || 0,
        },
      ],
      invalidMethodCalls: [],
    };
  }
  if (getFlowResourceAllowedMethods(resource.resourceType).has(method)) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  return {
    invalidListCalls: [],
    invalidMethodCalls: [
      {
        capability,
        index:
          typeof callee.property?.start === 'number'
            ? callee.property.start
            : typeof callee.start === 'number'
              ? callee.start
              : node.start || 0,
        method,
        resourceType: resource.resourceType,
        suggestedMethod: getSuggestedFlowResourceMethod(method),
      },
    ],
  };
}

export function collectAstInvalidResourceActionCalls(
  ast: any,
  source: string,
  aliases: AstFlowResourceAlias[],
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  ctxApiAliases: CtxApiAlias[],
  ctxApiResourceAliases: CtxApiResourceAliases,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  context: RunJsAuthoringContext,
): RunJsAstInspection['invalidResourceActionCalls'] {
  const entries: RunJsAstInspection['invalidResourceActionCalls'] = [];
  const ctxResourceStates = new Map<string, { scope: SourceRange; state: AstRunJsResourceState }>();
  const aliasStates = new Map<string, AstRunJsResourceState>();
  type ResourceActionEvent =
    | {
        type: 'aliasBind';
        aliasName: string;
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        sourceNode: any;
      }
    | {
        type: 'ctxResourceAliasBind';
        aliasName: string;
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
      }
    | {
        type: 'initResource';
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        resourceType: FlowResourceInstanceType;
      }
    | {
        type: 'resourceCall';
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        node: any;
      };
  type ResourceExpressionTarget = {
    capability: string;
    state: AstRunJsResourceState;
    updateState: (state: AstRunJsResourceState) => void;
  };
  type CtxApiResourceActionAlias = SourceRange & {
    actionName: string;
    capability: string;
    collectionName?: string;
    dataSourceKey: string;
    declarationStart?: number;
    executionScope: SourceRange;
    name: string;
  };
  type CtxApiResourceActionSource = Omit<
    CtxApiResourceActionAlias,
    'declarationStart' | 'end' | 'executionScope' | 'name' | 'start'
  >;
  const events: ResourceActionEvent[] = [];
  const actionAliases: CtxApiResourceActionAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const scopeKey = (scope: SourceRange) => `${scope.start}:${scope.end}`;
  const aliasKey = (alias: AstFlowResourceAlias) => `${alias.name}:${alias.declarationStart ?? alias.start}`;
  const defaultDataSourceKey = getRunJsDefaultDataSourceKey(context);
  const defaultCtxState = (): AstRunJsResourceState => ({
    capability: 'ctx.resource',
    collectionName: normalizeText(context.currentCollectionName || context.hostCollectionName) || undefined,
    dataSourceKey: defaultDataSourceKey,
    resourceType: 'unknown',
  });
  const mergeResourceState = (
    state: AstRunJsResourceState,
    nextState: AstRunJsResourceState,
  ): AstRunJsResourceState => {
    state.capability = nextState.capability;
    state.dataSourceKey = nextState.dataSourceKey;
    state.resourceType = nextState.resourceType;
    state.collectionName = nextState.collectionName;
    return state;
  };
  const getAliasState = (alias: AstFlowResourceAlias): AstRunJsResourceState => {
    const key = aliasKey(alias);
    const current = aliasStates.get(key);
    if (current) {
      return current;
    }
    const initial =
      alias.capability === 'ctx.resource'
        ? {
            ...defaultCtxState(),
            resourceType: alias.resourceType === 'unknown' ? defaultCtxState().resourceType : alias.resourceType,
          }
        : {
            capability: alias.capability,
            dataSourceKey: defaultDataSourceKey,
            resourceType: alias.resourceType,
          };
    aliasStates.set(key, initial);
    return initial;
  };
  const setAliasState = (alias: AstFlowResourceAlias, state: AstRunJsResourceState) => {
    if (alias.resourceType !== 'unknown') {
      state.resourceType = alias.resourceType;
    }
    aliasStates.set(aliasKey(alias), state);
    return state;
  };
  const setCtxState = (executionScope: SourceRange, state: AstRunJsResourceState) => {
    const nextState = {
      ...state,
      capability: 'ctx.resource',
    };
    ctxResourceStates.set(scopeKey(executionScope), {
      scope: executionScope,
      state: nextState,
    });
    return nextState;
  };
  const getCtxState = (executionScope: SourceRange) => {
    const exact = ctxResourceStates.get(scopeKey(executionScope))?.state;
    if (exact) {
      return exact;
    }
    const inherited = Array.from(ctxResourceStates.values())
      .filter(({ scope }) => scope.start <= executionScope.start && scope.end >= executionScope.end)
      .sort(
        (left, right) =>
          left.scope.end - left.scope.start - (right.scope.end - right.scope.start) ||
          right.scope.start - left.scope.start,
      )[0]?.state;
    if (inherited) {
      return inherited;
    }
    return setCtxState(executionScope, defaultCtxState());
  };
  const findDeclaredAlias = (aliasName: string, index: number) =>
    aliases
      .filter((alias) => alias.name === aliasName && (alias.declarationStart ?? alias.start) <= index)
      .sort((left, right) => (right.declarationStart ?? right.start) - (left.declarationStart ?? left.start))[0];
  const resolveStaticStringArg = (node: any) => {
    const resolved = resolveAstResourceTypeExpression(node, source, stringBindings, identifierBindings);
    return resolved.status === 'resolved' ? resolved.value : undefined;
  };
  const applyStaticResourceStateMethod = (
    state: AstRunJsResourceState,
    method: string,
    node: any,
  ): AstRunJsResourceState => {
    if (method === 'setDataSourceKey') {
      const dataSourceKey = resolveStaticStringArg(node.arguments?.[0]);
      return {
        ...state,
        dataSourceKey: dataSourceKey || '',
      };
    }
    if (method === 'setResourceName') {
      const collectionName = resolveStaticStringArg(node.arguments?.[0]);
      return {
        ...state,
        collectionName,
      };
    }
    return state;
  };
  const getAliasResourceTarget = (
    alias: AstFlowResourceAlias,
    executionScope: SourceRange,
  ): ResourceExpressionTarget => ({
    capability: alias.capability,
    state: getAliasState(alias),
    updateState: (nextState) => {
      mergeResourceState(getAliasState(alias), nextState);
    },
  });
  const resolveResourceExpressionTarget = (
    node: any,
    executionScope: SourceRange,
  ): ResourceExpressionTarget | undefined => {
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return undefined;
    }
    if (isAstCtxResourceMember(unwrapped, identifierBindings)) {
      return {
        capability: 'ctx.resource',
        state: getCtxState(executionScope),
        updateState: (nextState) => mergeResourceState(getCtxState(executionScope), nextState),
      };
    }
    if (unwrapped.type === 'Identifier') {
      const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
      return alias ? getAliasResourceTarget(alias, executionScope) : undefined;
    }
    const factory = getAstFlowResourceFactoryCallFromAst(
      unwrapped,
      ctxMethodAliases,
      source,
      stringBindings,
      identifierBindings,
    );
    if (factory) {
      return {
        capability: factory.capability,
        state: {
          capability: factory.capability,
          dataSourceKey: defaultDataSourceKey,
          resourceType: factory.resourceType,
        },
        updateState: _.noop,
      };
    }
    if (unwrapped.type === 'CallExpression') {
      const callTarget = getResourceCallTarget(unwrapped, executionScope);
      if (!callTarget || !RUNJS_RESOURCE_CHAINABLE_STATE_METHODS.has(callTarget.method)) {
        return undefined;
      }
      return {
        ...callTarget,
        state: applyStaticResourceStateMethod(callTarget.state, callTarget.method, unwrapped),
      };
    }
    return undefined;
  };
  const resolveExpressionState = (node: any, executionScope: SourceRange): AstRunJsResourceState | undefined =>
    resolveResourceExpressionTarget(node, executionScope)?.state;
  const getResourceCallTarget = (
    node: any,
    executionScope: SourceRange,
  ):
    | {
        capability: string;
        method: string;
        state: AstRunJsResourceState;
        updateState: (state: AstRunJsResourceState) => void;
      }
    | undefined => {
    const callee = unwrapAstChainExpression(node.callee);
    if (!callee || callee.type !== 'MemberExpression') {
      return undefined;
    }
    const method = getAstStaticPropertyName(callee);
    if (!method) {
      return undefined;
    }
    const objectTarget = resolveResourceExpressionTarget(callee.object, executionScope);
    if (objectTarget) {
      return {
        ...objectTarget,
        capability: getAstSource(callee, source),
        method,
      };
    }
    return undefined;
  };
  const addInvalidAction = (input: {
    actionName: string | undefined;
    capability: string;
    collectionName?: string;
    dataSourceKey?: string;
    endpoint?: string;
    index: number;
    resourceType?: FlowResourceInstanceType;
    strictCollectionEndpoint?: boolean;
  }) => {
    const validation = validateRunJsCollectionResourceAction({
      actionName: input.actionName,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      context,
      resourceType: input.resourceType,
      strictCollectionEndpoint: input.strictCollectionEndpoint,
    });
    if (!validation) {
      return;
    }
    entries.push({
      actionName: validation.actionName,
      allowedActions: validation.allowedActions,
      capability: input.capability,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      endpoint: input.endpoint,
      index: input.index,
      invalidReason: validation.invalidReason,
      resourceType: input.resourceType,
      suggestedMethod: input.actionName === 'refresh' ? 'refresh' : undefined,
    });
  };
  const getActiveActionAliases = () => trimAstAliasesAfterWrites(actionAliases, writes, identifierBindings);
  const resolveApiResourceCollectionName = (resourceName: string | undefined, dataSourceKey: string | undefined) =>
    resolveRunJsCollectionNameFromDottedResourceName(resourceName, context, dataSourceKey ?? defaultDataSourceKey) ||
    resourceName;
  const getUniqueApiResourceCallSource = (node: any) =>
    getUniqueApiResourceCallSourceFromCalls(
      collectMaybeCtxApiResourceCallsFromAst(node, ctxApiAliases, source, identifierBindings),
    );
  const getUniqueApiResourceCallSourceFromCalls = (
    resourceFactoryCalls: Array<{ args: any[]; calleeSource: string; index: number }>,
  ) => {
    if (resourceFactoryCalls.length <= 1) {
      return resourceFactoryCalls[0];
    }
    const firstIdentity = getApiResourceCallSourceIdentity(resourceFactoryCalls[0]);
    if (
      !firstIdentity ||
      resourceFactoryCalls.some((entry) => getApiResourceCallSourceIdentity(entry) !== firstIdentity)
    ) {
      return undefined;
    }
    return resourceFactoryCalls[0];
  };
  const getApiResourceCallSourceIdentity = (resourceFactoryCall: {
    args: any[];
    calleeSource: string;
    index: number;
  }) => {
    const dataSourceKey = getRunJsApiResourceCallDataSourceKey(
      resourceFactoryCall.args,
      source,
      stringBindings,
      staticFilterValueBindings,
      identifierBindings,
    );
    const resourceName = resolveRunJsStaticString(
      resourceFactoryCall.args?.[0],
      source,
      stringBindings,
      identifierBindings,
    );
    const collectionName = resolveApiResourceCollectionName(resourceName, dataSourceKey);
    if (typeof collectionName !== 'string' && typeof dataSourceKey !== 'string') {
      return '';
    }
    return `${dataSourceKey ?? defaultDataSourceKey}:${collectionName ?? ''}`;
  };
  const addActionAlias = (
    name: string,
    actionSource: CtxApiResourceActionSource,
    node: any,
    ancestors: any[],
    isVar = false,
  ) => {
    if (!name) {
      return;
    }
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    actionAliases.push({
      ...actionSource,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getApiResourceHandleSource = (
    node: any,
  ): { calleeSource: string; dataSourceKey?: string; index: number; resourceName?: string } | undefined => {
    const resourceFactoryCall = getUniqueApiResourceCallSource(node);
    if (resourceFactoryCall) {
      const dataSourceKey = getRunJsApiResourceCallDataSourceKey(
        resourceFactoryCall.args,
        source,
        stringBindings,
        staticFilterValueBindings,
        identifierBindings,
      );
      const resourceName = resolveRunJsStaticString(
        resourceFactoryCall.args?.[0],
        source,
        stringBindings,
        identifierBindings,
      );
      return {
        calleeSource: resourceFactoryCall.calleeSource,
        dataSourceKey,
        index: resourceFactoryCall.index,
        resourceName: resolveApiResourceCollectionName(resourceName, dataSourceKey),
      };
    }
    const handleAlias = getMaybeCtxApiResourceHandleAliasFromAst(
      node,
      ctxApiResourceAliases.handles,
      identifierBindings,
    );
    return handleAlias
      ? {
          calleeSource: handleAlias.calleeSource,
          dataSourceKey: handleAlias.dataSourceKey,
          index: handleAlias.start,
          resourceName: resolveApiResourceCollectionName(handleAlias.resourceName, handleAlias.dataSourceKey),
        }
      : undefined;
  };
  const dedupeApiResourceActionSources = (sources: CtxApiResourceActionSource[]) => {
    const seen = new Set<string>();
    return sources.filter((entry) => {
      const key = `${entry.actionName}:${entry.capability}:${entry.collectionName || ''}:${entry.dataSourceKey}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };
  const getConsistentApiResourceActionSources = (sources: CtxApiResourceActionSource[]) => {
    const dedupedSources = dedupeApiResourceActionSources(sources);
    if (dedupedSources.length <= 1) {
      return dedupedSources;
    }
    const firstIdentity = getApiResourceActionSourceIdentity(dedupedSources[0]);
    if (!firstIdentity || dedupedSources.some((entry) => getApiResourceActionSourceIdentity(entry) !== firstIdentity)) {
      return [];
    }
    return [dedupedSources[0]];
  };
  const getApiResourceActionSourceIdentity = (actionSource: CtxApiResourceActionSource) => {
    if (!actionSource.actionName) {
      return '';
    }
    return `${actionSource.actionName}:${actionSource.collectionName ?? ''}:${actionSource.dataSourceKey ?? ''}`;
  };
  const resolveApiResourceActionAliasSources = (name: string, index: number) => {
    const candidates = getActiveActionAliases()
      .filter(
        (entry) =>
          entry.name === name &&
          index >= entry.start &&
          index < entry.end &&
          !hasAstShadowBinding(name, index, entry, identifierBindings),
      )
      .sort((left, right) => right.start - left.start);
    const latestStart = candidates[0]?.start;
    return candidates
      .filter((entry) => entry.start === latestStart)
      .map((alias) => ({
        actionName: alias.actionName,
        capability: alias.capability,
        collectionName: alias.collectionName,
        dataSourceKey: alias.dataSourceKey,
      }));
  };
  const getApiResourceActionSourcesFromAst = (node: any): CtxApiResourceActionSource[] => {
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return [];
    }
    if (unwrapped.type === 'Identifier') {
      return resolveApiResourceActionAliasSources(unwrapped.name, unwrapped.start || 0);
    }
    if (unwrapped.type === 'MemberExpression') {
      const invocationMember = getAstStaticPropertyName(unwrapped);
      if (invocationMember === 'call' || invocationMember === 'apply' || invocationMember === 'bind') {
        return getApiResourceActionSourcesFromAst(unwrapped.object).map((wrapped) => ({
          ...wrapped,
          capability: getAstSource(unwrapped, source) || wrapped.capability,
        }));
      }
      const actionName = invocationMember;
      if (!actionName) {
        return [];
      }
      const handleSource = getApiResourceHandleSource(unwrapped.object);
      if (!handleSource) {
        return [];
      }
      return [
        {
          actionName,
          capability: handleSource.resourceName
            ? `${handleSource.calleeSource}('${handleSource.resourceName}').${actionName}`
            : `${handleSource.calleeSource}(...).${actionName}`,
          collectionName: handleSource.resourceName,
          dataSourceKey: handleSource.dataSourceKey ?? defaultDataSourceKey,
        },
      ];
    }
    if (unwrapped.type === 'ConditionalExpression') {
      return getConsistentApiResourceActionSources([
        ...getApiResourceActionSourcesFromAst(unwrapped.consequent),
        ...getApiResourceActionSourcesFromAst(unwrapped.alternate),
      ]);
    }
    if (unwrapped.type === 'LogicalExpression') {
      const leftSources = getApiResourceActionSourcesFromAst(unwrapped.left);
      return getConsistentApiResourceActionSources([
        ...leftSources,
        ...getApiResourceActionSourcesFromAst(unwrapped.right),
      ]);
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      return getApiResourceActionSourcesFromAst(expressions[expressions.length - 1]);
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      return getApiResourceActionSourcesFromAst(unwrapped.right);
    }
    return [];
  };
  const getRunJsStaticRequestResourceActionFromAst = (
    node: any,
    dataSourceKey: string,
  ): { actionName?: string; collectionName?: string } | undefined => {
    const objectArg = getRunJsStaticRequestConfigObjectFromAst(node, identifierBindings, staticFilterValueBindings);
    if (!objectArg) {
      return undefined;
    }
    const resourceProperty = getRunJsObjectProperty(
      objectArg,
      ['collection', 'collectionName', 'resource'],
      identifierBindings,
      staticFilterValueBindings,
    );
    const actionProperty = getRunJsObjectProperty(objectArg, ['action'], identifierBindings, staticFilterValueBindings);
    const actionName = resolveRunJsStaticString(actionProperty?.value, source, stringBindings, identifierBindings);
    if (!actionName) {
      return undefined;
    }
    const resourceName = resolveRunJsStaticString(resourceProperty?.value, source, stringBindings, identifierBindings);
    return {
      actionName,
      collectionName:
        resolveRunJsCollectionNameFromDottedResourceName(resourceName, context, dataSourceKey) || resourceName,
    };
  };
  const collectApiResourceActionPatternAliases = (pattern: any, handleNode: any, ancestors: any[], isVar = false) => {
    const handleSource = getApiResourceHandleSource(handleNode);
    if (!handleSource) {
      return;
    }
    collectAstObjectPatternAliases(pattern, (name, actionName, aliasNode) => {
      addActionAlias(
        name,
        {
          actionName,
          capability: handleSource.resourceName
            ? `${handleSource.calleeSource}('${handleSource.resourceName}').${actionName}`
            : `${handleSource.calleeSource}(...).${actionName}`,
          collectionName: handleSource.resourceName,
          dataSourceKey: handleSource.dataSourceKey ?? defaultDataSourceKey,
        },
        aliasNode || pattern,
        ancestors,
        isVar,
      );
    });
  };
  const collectApiResourceActions = (node: any) => {
    const resourceFactoryCall = getCtxApiResourceCallFromAst(node, ctxApiAliases, source, identifierBindings);
    if (resourceFactoryCall) {
      const rawResourceName = resolveRunJsStaticString(node.arguments?.[0], source, stringBindings, identifierBindings);
      const actionName = resolveStaticStringArg(node.arguments?.[1]);
      const dataSourceKey =
        getRunJsApiResourceCallDataSourceKey(
          resourceFactoryCall.args,
          source,
          stringBindings,
          staticFilterValueBindings,
          identifierBindings,
        ) ?? defaultDataSourceKey;
      const resourceName = resolveApiResourceCollectionName(rawResourceName, dataSourceKey);
      addInvalidAction({
        actionName,
        capability: resourceName
          ? `${resourceFactoryCall.calleeSource}('${resourceName}', '${actionName || ''}')`
          : `${resourceFactoryCall.calleeSource}(..., '${actionName || ''}')`,
        collectionName: resourceName,
        dataSourceKey,
        index: resourceFactoryCall.index,
      });
    }

    const callee = unwrapAstChainExpression(node.callee);
    if (!callee || callee.type !== 'MemberExpression') {
      return;
    }
    const actionName = getAstStaticPropertyName(callee);
    if (!actionName) {
      return;
    }
    const resourceFactory = getUniqueApiResourceCallSource(callee.object);
    if (resourceFactory) {
      const rawResourceName = resolveRunJsStaticString(
        resourceFactory.args?.[0],
        source,
        stringBindings,
        identifierBindings,
      );
      const dataSourceKey =
        getRunJsApiResourceCallDataSourceKey(
          resourceFactory.args,
          source,
          stringBindings,
          staticFilterValueBindings,
          identifierBindings,
        ) ?? defaultDataSourceKey;
      const resourceName = resolveApiResourceCollectionName(rawResourceName, dataSourceKey);
      addInvalidAction({
        actionName,
        capability: resourceName
          ? `${resourceFactory.calleeSource}('${resourceName}').${actionName}`
          : `${resourceFactory.calleeSource}(...).${actionName}`,
        collectionName: resourceName,
        dataSourceKey,
        index: resourceFactory.index,
      });
      return;
    }
    const resourceHandleAlias = getMaybeCtxApiResourceHandleAliasFromAst(
      callee.object,
      ctxApiResourceAliases.handles,
      identifierBindings,
    );
    if (resourceHandleAlias) {
      const dataSourceKey = resourceHandleAlias.dataSourceKey ?? defaultDataSourceKey;
      const collectionName = resolveApiResourceCollectionName(resourceHandleAlias.resourceName, dataSourceKey);
      addInvalidAction({
        actionName,
        capability: getAstSource(callee, source),
        collectionName,
        dataSourceKey,
        index: typeof callee.start === 'number' ? callee.start : node.start || 0,
      });
    }
  };
  const collectRequestEndpointAction = (node: any) => {
    const requestCapability = getRunJsCtxRequestCallCapabilityFromAst(
      node,
      ctxMethodAliases,
      ctxApiAliases,
      identifierBindings,
      source,
    );
    if (!requestCapability) {
      return;
    }
    const dataSourceKey =
      getRunJsStaticRequestDataSourceKeyFromAst(
        node,
        source,
        stringBindings,
        staticFilterValueBindings,
        identifierBindings,
      ) ?? defaultDataSourceKey;
    const endpoint = getRunJsStaticRequestEndpointFromAst(
      node,
      source,
      stringBindings,
      staticFilterValueBindings,
      identifierBindings,
    );
    if (endpoint) {
      const parsed = parseRunJsResourceEndpoint(endpoint, context, dataSourceKey);
      if (parsed) {
        addInvalidAction({
          actionName: parsed.actionName,
          capability: requestCapability,
          collectionName: parsed.collectionName,
          dataSourceKey,
          endpoint: parsed.endpoint,
          index: node.start || 0,
          strictCollectionEndpoint: parsed.explicitCollectionPrefix,
        });
      }
    }

    const requestResourceAction = getRunJsStaticRequestResourceActionFromAst(node, dataSourceKey);
    if (!requestResourceAction) {
      return;
    }
    addInvalidAction({
      actionName: requestResourceAction.actionName,
      capability: requestCapability,
      collectionName: requestResourceAction.collectionName,
      dataSourceKey,
      index: node.start || 0,
    });
  };
  const collectRunjsEndpointAction = (node: any, method: CtxMethodAlias | { capability: string; method: string }) => {
    if (method.method !== 'runjs') {
      return;
    }
    const endpoint = resolveStaticStringArg(node.arguments?.[0]);
    if (!endpoint) {
      return;
    }
    const parsed = parseRunJsResourceEndpoint(endpoint, context, defaultDataSourceKey);
    if (!parsed) {
      return;
    }
    addInvalidAction({
      actionName: parsed.actionName,
      capability: method.capability,
      collectionName: parsed.collectionName,
      dataSourceKey: defaultDataSourceKey,
      endpoint: parsed.endpoint,
      index: node.start || 0,
      strictCollectionEndpoint: parsed.explicitCollectionPrefix,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      if (node.left?.type === 'Identifier') {
        getApiResourceActionSourcesFromAst(node.right).forEach((actionSource) =>
          addActionAlias(node.left.name, actionSource, node, ancestors),
        );
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectApiResourceActionPatternAliases(node.left, node.right, ancestors);
      }
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      if (node.left?.type === 'Identifier') {
        events.push({
          type: 'aliasBind',
          aliasName: node.left.name,
          alwaysRuns,
          end: typeof node.end === 'number' ? node.end : node.start || 0,
          executionScope,
          index: node.start || 0,
          sourceNode: node.right,
        });
        return;
      }
      if (node.left?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.right, identifierBindings)) {
        collectAstObjectPatternAliases(node.left, (aliasName, member, aliasNode) => {
          if (member !== 'resource') {
            return;
          }
          events.push({
            type: 'ctxResourceAliasBind',
            aliasName,
            alwaysRuns,
            end: typeof aliasNode?.end === 'number' ? aliasNode.end : node.end || node.start || 0,
            executionScope,
            index: typeof aliasNode?.start === 'number' ? aliasNode.start : node.start || 0,
          });
        });
      }
    },
    CallExpression(node: any, ancestors: any[]) {
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const ctxMethod = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (ctxMethod) {
        if (ctxMethod.method === 'initResource') {
          const resolved = node.arguments?.[0]
            ? resolveAstResourceTypeExpression(node.arguments[0], source, stringBindings, identifierBindings)
            : undefined;
          events.push({
            type: 'initResource',
            alwaysRuns,
            end: typeof node.end === 'number' ? node.end : node.start || 0,
            executionScope,
            index: node.start || 0,
            resourceType:
              resolved?.status === 'resolved' && INIT_RESOURCE_CLASS_NAMES.has(resolved.value)
                ? (resolved.value as FlowResourceInstanceType)
                : 'unknown',
          });
        }
        collectRunjsEndpointAction(node, ctxMethod);
      }
      getApiResourceActionSourcesFromAst(node.callee).forEach((apiResourceAction) => {
        addInvalidAction({
          actionName: apiResourceAction.actionName,
          capability: apiResourceAction.capability,
          collectionName: apiResourceAction.collectionName,
          dataSourceKey: apiResourceAction.dataSourceKey,
          index: node.start || 0,
        });
      });
      collectApiResourceActions(node);
      collectRequestEndpointAction(node);
      if (!getResourceCallTarget(node, executionScope)) {
        return;
      }
      events.push({
        type: 'resourceCall',
        alwaysRuns,
        end: typeof node.end === 'number' ? node.end : node.start || 0,
        executionScope,
        index: node.start || 0,
        node,
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      if (node.id?.type === 'Identifier') {
        const actionSources = getApiResourceActionSourcesFromAst(node.init);
        if (actionSources.length) {
          const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
          actionSources.forEach((actionSource) =>
            addActionAlias(node.id.name, actionSource, node, ancestors, declaration?.kind === 'var'),
          );
        }
        events.push({
          type: 'aliasBind',
          aliasName: node.id.name,
          alwaysRuns,
          end: typeof node.end === 'number' ? node.end : node.start || 0,
          executionScope,
          index: node.start || 0,
          sourceNode: node.init,
        });
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.init, identifierBindings)) {
        collectAstObjectPatternAliases(node.id, (aliasName, member, aliasNode) => {
          if (member !== 'resource') {
            return;
          }
          events.push({
            type: 'ctxResourceAliasBind',
            aliasName,
            alwaysRuns,
            end: typeof aliasNode?.end === 'number' ? aliasNode.end : node.end || node.start || 0,
            executionScope,
            index: typeof aliasNode?.start === 'number' ? aliasNode.start : node.start || 0,
          });
        });
      }
      if (node.id?.type === 'ObjectPattern') {
        const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
        collectApiResourceActionPatternAliases(node.id, node.init, ancestors, declaration?.kind === 'var');
      }
    },
  });

  ctxResourceStates.clear();
  aliasStates.clear();

  const actionScopes = Array.from(
    new Map(events.map((event) => [scopeKey(event.executionScope), event.executionScope])).values(),
  );
  const actionScopeDepth = (scope: SourceRange) =>
    actionScopes.filter(
      (candidate) => candidate.start < scope.start && candidate.end >= scope.end && !isSameAstRange(candidate, scope),
    ).length;

  events
    .sort(
      (left, right) =>
        actionScopeDepth(left.executionScope) - actionScopeDepth(right.executionScope) ||
        left.executionScope.start - right.executionScope.start ||
        left.index - right.index ||
        left.end - right.end,
    )
    .forEach((event) => {
      if (event.type === 'initResource') {
        if (!event.alwaysRuns) {
          return;
        }
        setCtxState(event.executionScope, {
          capability: 'ctx.resource',
          dataSourceKey: defaultDataSourceKey,
          resourceType: event.resourceType,
        });
        return;
      }
      if (event.type === 'aliasBind') {
        if (!event.alwaysRuns) {
          return;
        }
        const alias = findDeclaredAlias(event.aliasName, event.index);
        const state = resolveExpressionState(event.sourceNode, event.executionScope);
        if (alias && state) {
          setAliasState(alias, state);
        }
        return;
      }
      if (event.type === 'ctxResourceAliasBind') {
        if (!event.alwaysRuns) {
          return;
        }
        const alias = findDeclaredAlias(event.aliasName, event.index);
        if (alias) {
          setAliasState(alias, getCtxState(event.executionScope));
        }
        return;
      }
      const target = getResourceCallTarget(event.node, event.executionScope);
      if (!target) {
        return;
      }
      if (target.method === 'setDataSourceKey' || target.method === 'setResourceName') {
        if (!event.alwaysRuns) {
          return;
        }
        target.updateState(applyStaticResourceStateMethod(target.state, target.method, event.node));
        return;
      }
      if (target.method !== 'runAction' && target.method !== 'setRefreshAction') {
        return;
      }
      const actionName = resolveStaticStringArg(event.node.arguments?.[0]);
      addInvalidAction({
        actionName,
        capability: target.capability,
        collectionName: target.state.collectionName,
        dataSourceKey: target.state.dataSourceKey,
        index:
          typeof event.node.arguments?.[0]?.start === 'number'
            ? event.node.arguments[0].start
            : typeof event.node.callee?.property?.start === 'number'
              ? event.node.callee.property.start
              : event.index,
        resourceType: target.state.resourceType,
        strictCollectionEndpoint: true,
      });
    });

  return entries;
}

function validateRunJsCollectionResourceAction(input: {
  actionName: string | undefined;
  collectionName?: string;
  context: RunJsAuthoringContext;
  dataSourceKey?: string;
  resourceType?: FlowResourceInstanceType;
  strictCollectionEndpoint?: boolean;
}):
  | {
      actionName: string;
      allowedActions: string[];
      invalidReason: string;
    }
  | undefined {
  const actionName = normalizeText(input.actionName);
  if (!actionName || input.resourceType === 'SQLResource') {
    return undefined;
  }

  const hasUnknownDataSource = input.dataSourceKey === '';
  const actionPolicy = getRunJsCollectionActionPolicy(
    input.context,
    hasUnknownDataSource ? undefined : input.dataSourceKey || getRunJsDefaultDataSourceKey(input.context),
    input.collectionName,
  );
  if (!actionPolicy.collectionResolved && !input.strictCollectionEndpoint && !hasUnknownDataSource) {
    return undefined;
  }

  if (!RUNJS_COLLECTION_RESOURCE_ACTIONS.has(actionName)) {
    return {
      actionName,
      allowedActions: actionPolicy.allowedActions,
      invalidReason: actionName === 'refresh' ? 'refresh-is-flow-resource-method' : 'unknown-collection-action',
    };
  }

  if (!hasUnknownDataSource && !actionPolicy.allowedActionSet.has(actionName)) {
    return {
      actionName,
      allowedActions: actionPolicy.allowedActions,
      invalidReason: 'collection-action-unavailable',
    };
  }

  return undefined;
}

export function getRunJsDefaultDataSourceKey(context: RunJsAuthoringContext) {
  return normalizeText(context.currentDataSourceKey || context.hostDataSourceKey) || 'main';
}

function getRunJsCollectionActionPolicy(
  context: RunJsAuthoringContext,
  dataSourceKey: string | undefined,
  collectionName?: string,
) {
  let collection: any;
  if (context.getCollection && collectionName && dataSourceKey) {
    collection = context.getCollection(dataSourceKey || getRunJsDefaultDataSourceKey(context), collectionName);
  }
  const availableActions = getRunJsCollectionActionOptionList(collection, 'availableActions');
  const unavailableActions = getRunJsCollectionActionOptionList(collection, 'unavailableActions');
  const allowedActionSet = new Set(RUNJS_COLLECTION_RESOURCE_ACTIONS);

  if (availableActions?.length) {
    [...allowedActionSet].forEach((actionName) => {
      if (
        !availableActions.some((capabilityName) =>
          isRunJsCollectionActionCoveredByCapability(actionName, capabilityName),
        )
      ) {
        allowedActionSet.delete(actionName);
      }
    });
  }
  if (unavailableActions?.length) {
    [...allowedActionSet].forEach((actionName) => {
      if (
        unavailableActions.some((capabilityName) =>
          isRunJsCollectionActionCoveredByCapability(actionName, capabilityName),
        )
      ) {
        allowedActionSet.delete(actionName);
      }
    });
  }

  const allowedActions = [...allowedActionSet].sort((left, right) => left.localeCompare(right));
  return {
    allowedActionSet,
    allowedActions,
    collectionResolved: Boolean(collection),
  };
}

function getRunJsCollectionActionOptionList(collection: any, key: 'availableActions' | 'unavailableActions') {
  const directValue = collection?.[key];
  const optionsValue = collection?.options?.[key];
  const value = typeof directValue === 'function' ? directValue.call(collection) : directValue || optionsValue;
  return Array.isArray(value) ? value.map((item) => normalizeText(item)).filter(Boolean) : undefined;
}

function isRunJsCollectionActionCoveredByCapability(actionName: string, capabilityName: string) {
  if (actionName === capabilityName) {
    return true;
  }
  return RUNJS_COLLECTION_RESOURCE_ACTION_ALIASES.get(capabilityName)?.includes(actionName) || false;
}

function getRunJsCtxRequestCallCapabilityFromAst(
  node: any,
  ctxMethodAliases: CtxMethodAlias[],
  ctxApiAliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
) {
  const ctxMethod = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
  if (ctxMethod?.method === 'request') {
    return ctxMethod.capability;
  }
  const callee = unwrapAstChainExpression(node.callee);
  const capability =
    getCtxApiCapabilityFromAst(callee, ctxApiAliases, identifierBindings) ||
    getMaybeCtxApiCapabilityFromAst(callee, ctxApiAliases, identifierBindings);
  return capability === 'ctx.api.request' ? getAstSource(callee, source) || 'ctx.api.request' : '';
}

function getRunJsStaticRequestEndpointFromAst(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  const firstArg = node.arguments?.[0];
  const firstArgUrl = resolveRunJsStaticString(firstArg, source, stringBindings, identifierBindings);
  if (firstArgUrl) {
    return firstArgUrl;
  }
  const objectArg = getRunJsStaticRequestConfigObjectFromAst(node, identifierBindings, staticFilterValueBindings);
  if (!objectArg) {
    return '';
  }
  const urlProperty = getRunJsObjectProperty(objectArg, ['url'], identifierBindings, staticFilterValueBindings);
  return resolveRunJsStaticString(urlProperty?.value, source, stringBindings, identifierBindings) || '';
}

function parseRunJsResourceEndpoint(
  value: string,
  context: RunJsAuthoringContext,
  dataSourceKey: string,
):
  | {
      actionName: string;
      collectionName?: string;
      endpoint: string;
      explicitCollectionPrefix: boolean;
    }
  | undefined {
  const endpoint = normalizeText(value);
  if (!endpoint || /^(?:https?:)?\/\//i.test(endpoint)) {
    return undefined;
  }
  const resourceUrl = endpoint.replace(/^\/api\//i, '').replace(/^\//, '');
  const match = resourceUrl.match(new RegExp(`^(.+?):(${RUNJS_RESOURCE_ENDPOINT_ACTION_PATTERN})(?:$|[/?#])`));
  if (!match) {
    return undefined;
  }
  const resourcePathSegments = normalizeText(match[1]).split('/').filter(Boolean);
  const resourceName = normalizeText(resourcePathSegments[resourcePathSegments.length - 1]);
  const actionName = normalizeText(match[2]);
  const explicitCollectionPrefix = resourceName === 'collection' || resourceName === 'resource';
  const collectionName = explicitCollectionPrefix
    ? undefined
    : resolveRunJsCollectionNameFromEndpointResourcePath(resourcePathSegments, context, dataSourceKey) || resourceName;
  return {
    actionName,
    collectionName,
    endpoint,
    explicitCollectionPrefix,
  };
}

function resolveRunJsCollectionNameFromEndpointResourcePath(
  resourcePathSegments: string[],
  context: RunJsAuthoringContext,
  dataSourceKey: string,
) {
  if (!context.getCollection || resourcePathSegments.length < 3) {
    return '';
  }
  const sourceCollectionName = normalizeText(resourcePathSegments[0]);
  const associationFieldName = normalizeText(resourcePathSegments[resourcePathSegments.length - 1]);
  if (!sourceCollectionName || !associationFieldName) {
    return '';
  }
  const sourceCollection = context.getCollection(
    dataSourceKey || getRunJsDefaultDataSourceKey(context),
    sourceCollectionName,
  );
  const associationField = resolveFieldFromCollection(sourceCollection, associationFieldName);
  const targetCollection = associationField
    ? resolveFieldTargetCollection(
        associationField,
        dataSourceKey || getRunJsDefaultDataSourceKey(context),
        context.getCollection,
      )
    : null;
  return normalizeText(getCollectionName(targetCollection));
}

function resolveRunJsCollectionNameFromDottedResourceName(
  resourceName: string | undefined,
  context: RunJsAuthoringContext,
  dataSourceKey: string,
) {
  const parts = normalizeText(resourceName).split('.').filter(Boolean);
  if (!context.getCollection || !dataSourceKey || parts.length < 2) {
    return '';
  }
  let currentDataSourceKey = dataSourceKey;
  let currentCollection = context.getCollection(currentDataSourceKey, parts[0]);
  for (let index = 1; index < parts.length; index += 1) {
    const associationFieldName = parts[index];
    if (!currentCollection || !associationFieldName) {
      return '';
    }
    const associationField = resolveFieldFromCollection(currentCollection, associationFieldName);
    const targetCollection = associationField
      ? resolveFieldTargetCollection(
          associationField,
          currentCollection?.dataSourceKey || currentDataSourceKey,
          context.getCollection,
        )
      : null;
    if (!targetCollection) {
      return '';
    }
    currentCollection = targetCollection;
    currentDataSourceKey = targetCollection?.dataSourceKey || currentDataSourceKey;
  }
  return normalizeText(getCollectionName(currentCollection));
}

export function getMaybeAstFlowResourceSourceFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource | undefined {
  return selectAstFlowResourceSource(
    collectPossibleAstFlowResourceSourcesFromAst(
      node,
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    ),
  );
}

export function collectPossibleAstFlowResourceSourcesFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource[] {
  const direct = getDirectAstFlowResourceSourceFromAst(
    node,
    aliases,
    source,
    identifierBindings,
    ctxMethodAliases,
    stringBindings,
  );
  if (direct) {
    return [direct];
  }

  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return [
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.consequent,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.alternate,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
    ];
  }
  if (unwrapped.type === 'LogicalExpression') {
    return [
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.left,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.right,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
    ];
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectPossibleAstFlowResourceSourcesFromAst(
      expressions[expressions.length - 1],
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectPossibleAstFlowResourceSourcesFromAst(
      unwrapped.right,
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    );
  }
  return [];
}

export function getDirectAstFlowResourceSourceFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    return alias
      ? {
          capability: alias.capability,
          index: typeof unwrapped.start === 'number' ? unwrapped.start : alias.start,
          resourceType: alias.resourceType,
        }
      : undefined;
  }
  if (isAstCtxResourceMember(unwrapped, identifierBindings)) {
    return {
      capability: 'ctx.resource',
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      resourceType: 'unknown',
    };
  }
  return getAstFlowResourceFactoryCallFromAst(unwrapped, ctxMethodAliases, source, stringBindings, identifierBindings);
}

export function getAstFlowResourceFactoryCallFromAst(
  node: any,
  ctxMethodAliases: CtxMethodAlias[],
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): AstFlowResourceSource | undefined {
  const call = unwrapAstChainExpression(node);
  if (!call || call.type !== 'CallExpression') {
    return undefined;
  }
  const method = resolveCtxMethodCall(call, ctxMethodAliases, identifierBindings);
  if (!method || (method.method !== 'makeResource' && method.method !== 'initResource')) {
    return undefined;
  }
  const firstArg = call.arguments?.[0];
  if (!firstArg) {
    return undefined;
  }
  const resolved = resolveAstResourceTypeExpression(firstArg, source, stringBindings, identifierBindings);
  if (resolved.status !== 'resolved') {
    return undefined;
  }
  const allowedResourceTypes = method.method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
  if (!allowedResourceTypes.has(resolved.value) || !isKnownFlowResourceInstanceType(resolved.value)) {
    return undefined;
  }
  return {
    capability: method.capability,
    index: typeof call.start === 'number' ? call.start : 0,
    resourceType: resolved.value,
  };
}

export function isAstCtxResourceMember(node: any, identifierBindings: AstIdentifierBinding[]) {
  const member = unwrapAstChainExpression(node);
  return (
    member?.type === 'MemberExpression' &&
    getAstStaticPropertyName(member) === 'resource' &&
    isUnshadowedCtxIdentifier(member.object, identifierBindings)
  );
}

export function collectAstSharedCtxResourceCallsInFunctions(
  ast: any,
  source: string,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): SharedCtxResourceCallInFunction[] {
  const entries: SharedCtxResourceCallInFunction[] = [];
  const seen = new Set<string>();

  const addEntry = (capability: string, index: number, ancestors: any[]) => {
    const functionNode = getNearestAstFunctionAncestor(ancestors);
    if (!functionNode) {
      return;
    }
    const functionName = getAstFunctionDisplayName(functionNode, ancestors);
    const key = `${capability}:${functionNode.start || 0}:${functionNode.end || source.length}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push({
      capability,
      functionName,
      index,
    });
  };

  walkAstAncestor(ast, {
    CallExpression(node: any, ancestors: any[]) {
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'initResource') {
        addEntry(method.capability, node.start || 0, ancestors);
      }
    },
    MemberExpression(node: any, ancestors: any[]) {
      if (isAstCtxResourceMember(node, identifierBindings)) {
        addEntry('ctx.resource', node.start || 0, ancestors);
      }
    },
  });

  return entries.sort((left, right) => left.index - right.index);
}

function getNearestAstFunctionAncestor(ancestors: any[]) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (isAstFunctionLike(ancestor)) {
      return ancestor;
    }
  }
  return undefined;
}

function getAstFunctionDisplayName(functionNode: any, ancestors: any[]) {
  if (functionNode?.id?.type === 'Identifier') {
    return functionNode.id.name;
  }
  const functionIndex = ancestors.findIndex((ancestor) => ancestor === functionNode);
  const parent = functionIndex >= 0 ? ancestors[functionIndex - 1] : undefined;
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent?.type === 'Property') {
    const key = getAstStaticPropertyName(parent);
    if (key) {
      return key;
    }
  }
  return undefined;
}

function selectAstFlowResourceSource(sources: AstFlowResourceSource[]): AstFlowResourceSource | undefined {
  if (!sources.length) {
    return undefined;
  }
  const resourceTypes = [...new Set(sources.map((entry) => entry.resourceType))];
  if (resourceTypes.length === 1) {
    return sources[0];
  }
  return {
    capability: sources.map((entry) => entry.capability).join('|'),
    index: Math.min(...sources.map((entry) => entry.index)),
    resourceType: 'unknown',
  };
}

function getFlowResourceAllowedMethods(resourceType: FlowResourceInstanceType | undefined) {
  if (!resourceType || resourceType === 'unknown') {
    return UNKNOWN_FLOW_RESOURCE_METHODS;
  }
  return FLOW_RESOURCE_METHODS_BY_TYPE[resourceType] || UNKNOWN_FLOW_RESOURCE_METHODS;
}

function getSuggestedFlowResourceMethod(method: string) {
  const exactSuggestion = FLOW_RESOURCE_METHOD_SUGGESTIONS.get(method);
  if (exactSuggestion) {
    return exactSuggestion;
  }
  if (method.endsWith('s')) {
    const singular = method.slice(0, -1);
    if (UNKNOWN_FLOW_RESOURCE_METHODS.has(singular)) {
      return singular;
    }
  }
  return undefined;
}

function isKnownFlowResourceInstanceType(value: string): value is Exclude<FlowResourceInstanceType, 'unknown'> {
  return value in FLOW_RESOURCE_METHODS_BY_TYPE;
}
