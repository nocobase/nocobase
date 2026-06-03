/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import { FlowSurfaceBadRequestError } from '../../errors';
import {
  getCollectionFields,
  getCollectionName,
  getFieldInterface,
  getFieldName,
  getFieldType,
  isAssociationField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from '../../service-helpers';
import { normalizeFlowSurfaceStrictFilterDateValue } from '../../filter-group';
import {
  INIT_RESOURCE_CLASS_NAMES,
  RUNJS_DATE_FILTER_OPERATORS,
  RUNJS_RESOURCE_CHAINABLE_STATE_METHODS,
  RUNJS_SUPPORTED_FILTER_OPERATORS,
  RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS,
} from '../runtime/constants';
import { normalizeText } from '../runtime/surface';
import type {
  AstFlowResourceAlias,
  AstFlowResourceSource,
  AstIdentifierBinding,
  AstRunJsResourceState,
  CtxMethodAlias,
  FlowResourceInstanceType,
  RunJsAstInspection,
  RunJsAuthoringContext,
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
import {
  collectAstObjectPatternAliases,
  getAstBindingIdentifierName,
  getAstStaticPropertyName,
  hasAstActiveBinding,
  isAstCtxApiAliasAssignmentOperator,
  isUnshadowedCtxIdentifier,
  resolveAstAliasBinding,
  resolveAstResourceTypeExpression,
  resolveAstStaticStringValue,
  resolveCtxMethodCall,
} from '../ast/static-values';
import { getAstFlowResourceFactoryCallFromAst, isAstCtxResourceMember } from './resource';

export function collectAstInvalidResourceFilterCalls(
  ast: any,
  source: string,
  aliases: AstFlowResourceAlias[],
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  context: RunJsAuthoringContext,
): RunJsAstInspection['invalidResourceFilterCalls'] {
  const entries: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  const ctxResourceStates = new Map<string, { scope: SourceRange; state: AstRunJsResourceState }>();
  const aliasStates = new Map<string, AstRunJsResourceState>();
  type ResourceFilterEvent =
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
  const events: ResourceFilterEvent[] = [];
  const scopeKey = (scope: SourceRange) => `${scope.start}:${scope.end}`;
  const aliasKey = (alias: AstFlowResourceAlias) => `${alias.name}:${alias.declarationStart ?? alias.start}`;
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
  const defaultCtxState = (): AstRunJsResourceState => ({
    capability: 'ctx.resource',
    collectionName: normalizeText(context.currentCollectionName || context.hostCollectionName) || undefined,
    dataSourceKey: normalizeText(context.currentDataSourceKey || context.hostDataSourceKey) || 'main',
    resourceType: 'unknown',
  });
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
            dataSourceKey: 'main',
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
          dataSourceKey: 'main',
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
  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
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
      if (ctxMethod?.method === 'initResource') {
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
    },
  });

  // Candidate discovery can touch state through getResourceCallTarget().
  // Replay from a clean state so nested functions inherit the outer ctx.resource
  // configuration that is in effect when they are called.
  ctxResourceStates.clear();
  aliasStates.clear();

  const resourceFilterScopes = Array.from(
    new Map(events.map((event) => [scopeKey(event.executionScope), event.executionScope])).values(),
  );
  const resourceFilterScopeDepth = (scope: SourceRange) =>
    resourceFilterScopes.filter(
      (candidate) => candidate.start < scope.start && candidate.end >= scope.end && !isSameAstRange(candidate, scope),
    ).length;

  events
    .sort(
      (left, right) =>
        resourceFilterScopeDepth(left.executionScope) - resourceFilterScopeDepth(right.executionScope) ||
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
          dataSourceKey: 'main',
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
      if (target.method === 'setDataSourceKey') {
        if (!event.alwaysRuns) {
          return;
        }
        target.updateState(applyStaticResourceStateMethod(target.state, target.method, event.node));
        return;
      }
      if (target.method === 'setResourceName') {
        if (!event.alwaysRuns) {
          return;
        }
        target.updateState(applyStaticResourceStateMethod(target.state, target.method, event.node));
        return;
      }
      const filterArgumentIndex =
        target.method === 'setFilter' ? 0 : target.method === 'addFilterGroup' ? 1 : undefined;
      if (typeof filterArgumentIndex !== 'number') {
        return;
      }
      const filterArg = resolveRunJsStaticFilterRootNode(
        event.node.arguments?.[filterArgumentIndex],
        identifierBindings,
        staticFilterValueBindings,
      );
      if (!filterArg) {
        return;
      }
      entries.push(
        ...collectAstResourceFilterRootErrors({
          source,
          path: '',
          capability: target.capability,
          dataSourceKey: target.state.dataSourceKey,
          collectionName: target.state.collectionName,
          resourceType: target.state.resourceType,
          filterNode: filterArg,
          context,
          identifierBindings,
          staticFilterValueBindings,
          index: typeof filterArg.node.start === 'number' ? filterArg.node.start : event.node.start || 0,
        }),
      );
    });

  entries.push(
    ...collectAstForwardedResourceFilterArgumentErrors({
      ast,
      source,
      identifierBindings,
      stringBindings,
      staticFilterValueBindings,
      context,
    }),
  );

  return entries;
}

function collectAstForwardedResourceFilterArgumentErrors(input: {
  ast: any;
  source: string;
  identifierBindings: AstIdentifierBinding[];
  stringBindings: StaticStringBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  context: RunJsAuthoringContext;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const helpers = collectAstResourceFilterHelpers(input.ast, input.source, input.identifierBindings);
  if (!helpers.length) {
    return [];
  }

  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  walkAstAncestor(input.ast, {
    CallExpression(node: any) {
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstAliasBinding(callee.name, node.start || 0, helpers, input.identifierBindings);
      if (!helper) {
        return;
      }

      const filterArg = resolveRunJsStaticFilterRootNode(
        node.arguments?.[helper.filterParamIndex],
        input.identifierBindings,
        input.staticFilterValueBindings,
      );
      if (!filterArg) {
        return;
      }

      const collectionName =
        helper.collectionName ||
        resolveAstResourceFilterHelperCollectionName(
          helper,
          node.arguments,
          input.source,
          input.stringBindings,
          input.identifierBindings,
        );
      if (!collectionName) {
        return;
      }

      errors.push(
        ...collectAstResourceFilterRootErrors({
          source: input.source,
          path: '',
          capability: `${helper.name}.setFilter`,
          dataSourceKey: helper.dataSourceKey || 'main',
          collectionName,
          resourceType: helper.resourceType || 'unknown',
          filterNode: filterArg,
          context: input.context,
          identifierBindings: input.identifierBindings,
          staticFilterValueBindings: input.staticFilterValueBindings,
          index: typeof filterArg.node.start === 'number' ? filterArg.node.start : node.start || 0,
        }),
      );
    },
  });
  return errors;
}

type RunJsStaticFilterRootNode =
  | {
      kind: 'object';
      node: any;
    }
  | {
      kind: 'array';
      node: any;
    };

type AstResourceFilterHelper = SourceRange & {
  collectionName?: string;
  collectionParamIndex?: number;
  dataSourceKey?: string;
  declarationStart?: number;
  filterParamIndex: number;
  name: string;
  resourceType?: FlowResourceInstanceType;
};

type AstResourceFilterHelperResourceState = {
  collectionName: string;
  collectionParamNames: Set<string>;
  dataSourceKey: string;
  filterParamNames: Set<string>;
  resourceType?: FlowResourceInstanceType;
};

function collectAstResourceFilterHelpers(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): AstResourceFilterHelper[] {
  const helpers: AstResourceFilterHelper[] = [];
  const addHelper = (name: string, functionNode: any, bindingNode: any, scope: SourceRange) => {
    if (!name || !functionNode?.params?.length) {
      return;
    }
    const paramNames = functionNode.params.map(getAstBindingIdentifierName);
    const resourceStates = new Map<string, AstResourceFilterHelperResourceState>();
    const isInsideNestedFunction = (ancestors: any[]) =>
      ancestors.some((ancestor) => ancestor !== functionNode.body && isAstFunctionLike(ancestor));
    const ensureResourceState = (
      name: string,
      factory?: AstFlowResourceSource,
    ): AstResourceFilterHelperResourceState | undefined => {
      if (!name) {
        return undefined;
      }
      const existing = resourceStates.get(name);
      if (existing) {
        if (factory?.resourceType) {
          existing.resourceType = factory.resourceType;
        }
        return existing;
      }
      const state: AstResourceFilterHelperResourceState = {
        collectionName: '',
        collectionParamNames: new Set(),
        dataSourceKey: 'main',
        filterParamNames: new Set(),
        resourceType: factory?.resourceType,
      };
      resourceStates.set(name, state);
      return state;
    };
    const getResourceStateForMember = (memberExpression: any): AstResourceFilterHelperResourceState | undefined => {
      const object = unwrapAstChainExpression(memberExpression?.object);
      if (object?.type !== 'Identifier') {
        return undefined;
      }
      return resourceStates.get(object.name);
    };
    const collectResourceAlias = (aliasName: string, sourceNode: any) => {
      const factory = getAstFlowResourceFactoryCallFromAst(sourceNode, [], source, [], identifierBindings);
      if (factory) {
        ensureResourceState(aliasName, factory);
      }
    };

    walkAstAncestor(functionNode.body || functionNode, {
      AssignmentExpression(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors) || node.left?.type !== 'Identifier') {
          return;
        }
        collectResourceAlias(node.left.name, node.right);
      },
      CallExpression(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors)) {
          return;
        }
        const callee = unwrapAstChainExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const resourceState = getResourceStateForMember(callee);
        if (!resourceState) {
          return;
        }
        const method = getAstStaticPropertyName(callee);
        if (method === 'setFilter' || method === 'addFilterGroup') {
          const arg = unwrapAstChainExpression(node.arguments?.[method === 'addFilterGroup' ? 1 : 0]);
          if (arg?.type === 'Identifier' && paramNames.includes(arg.name)) {
            resourceState.filterParamNames.add(arg.name);
          }
          return;
        }
        if (method === 'setResourceName') {
          const arg = unwrapAstChainExpression(node.arguments?.[0]);
          if (arg?.type === 'Identifier' && paramNames.includes(arg.name)) {
            resourceState.collectionParamNames.add(arg.name);
            return;
          }
          const resolved = resolveAstStaticStringValue(arg, source);
          if (typeof resolved === 'string') {
            resourceState.collectionName = resolved;
          }
          return;
        }
        if (method === 'setDataSourceKey') {
          const resolved = resolveAstStaticStringValue(node.arguments?.[0], source);
          if (typeof resolved === 'string') {
            resourceState.dataSourceKey = resolved;
          }
        }
      },
      VariableDeclarator(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors) || node.id?.type !== 'Identifier') {
          return;
        }
        collectResourceAlias(node.id.name, node.init);
      },
    });

    for (const state of resourceStates.values()) {
      state.filterParamNames.forEach((filterParamName) => {
        const filterParamIndex = paramNames.indexOf(filterParamName);
        if (filterParamIndex < 0) {
          return;
        }
        const collectionParamIndex = Array.from(state.collectionParamNames)
          .map((paramName) => paramNames.indexOf(paramName))
          .find((index) => index >= 0);
        helpers.push({
          collectionName: state.collectionName,
          collectionParamIndex,
          dataSourceKey: state.dataSourceKey,
          declarationStart: typeof bindingNode?.start === 'number' ? bindingNode.start : scope.start,
          filterParamIndex,
          name,
          resourceType: state.resourceType,
          start: scope.start,
          end: scope.end,
        });
      });
    }
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      addHelper(node.id.name, node, node.id, getAstBindingScopeRange(ancestors.slice(0, -1), source.length));
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isAstFunctionLike(unwrapAstChainExpression(node.init))) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addHelper(
        node.id.name,
        unwrapAstChainExpression(node.init),
        node.id,
        getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var'),
      );
    },
  });

  return helpers;
}

function resolveAstResourceFilterHelperCollectionName(
  helper: AstResourceFilterHelper,
  args: any[],
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  if (typeof helper.collectionParamIndex !== 'number') {
    return '';
  }
  const arg = args?.[helper.collectionParamIndex];
  if (!arg) {
    return '';
  }
  const resolved = resolveAstResourceTypeExpression(arg, source, stringBindings, identifierBindings);
  return resolved.status === 'resolved' ? resolved.value : '';
}

function collectAstResourceFilterRootErrors(input: {
  source: string;
  path: string;
  capability: string;
  dataSourceKey?: string;
  collectionName?: string;
  resourceType: FlowResourceInstanceType;
  filterNode: RunJsStaticFilterRootNode;
  context: RunJsAuthoringContext;
  identifierBindings: AstIdentifierBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  index: number;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (!isRunJsRecordFilterResourceType(input.resourceType)) {
    return [];
  }
  if (input.filterNode.kind === 'array') {
    return [buildRunJsResourceFilterShapeError({ ...input, invalidShape: 'array' })];
  }
  if (isRunJsFilterGroupObjectNode(input.filterNode.node, input.identifierBindings, input.staticFilterValueBindings)) {
    return [buildRunJsResourceFilterShapeError({ ...input, invalidShape: 'filter-group' })];
  }
  return collectAstResourceFilterObjectErrors({
    ...input,
    filterObject: input.filterNode.node,
  });
}

function collectAstResourceFilterObjectErrors(input: {
  source: string;
  path: string;
  capability: string;
  dataSourceKey?: string;
  collectionName?: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  identifierBindings: AstIdentifierBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  index: number;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (!isRunJsRecordFilterResourceType(input.resourceType)) {
    return [];
  }
  if (!input.dataSourceKey || !input.collectionName || !input.context.getCollection) {
    return [];
  }
  const dataSourceKey = input.dataSourceKey;
  const collectionName = input.collectionName;
  const collection = input.context.getCollection(dataSourceKey, collectionName);
  if (!collection) {
    return [
      {
        capability: input.capability,
        collectionName,
        dataSourceKey,
        index: input.index,
        message: `flowSurfaces authoring ${input.capability}(...) references unknown collection '${dataSourceKey}.${collectionName}' while validating setFilter(...)`,
        resourceType: input.resourceType,
        ruleId: 'runjs-resource-collection-unknown',
      },
    ];
  }
  return collectAstResourceFilterProperties({
    ...input,
    collectionName,
    dataSourceKey,
    collection,
    rootCollection: collection,
  });
}

function isRunJsRecordFilterResourceType(resourceType: FlowResourceInstanceType) {
  return (
    resourceType === 'unknown' || resourceType === 'MultiRecordResource' || resourceType === 'SingleRecordResource'
  );
}

function collectAstResourceFilterProperties(input: {
  source: string;
  path: string;
  capability: string;
  dataSourceKey: string;
  collectionName: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  identifierBindings: AstIdentifierBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  collection: any;
  rootCollection: any;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  for (const property of input.filterObject.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!key) {
      continue;
    }
    const keyIndex = typeof property.key?.start === 'number' ? property.key.start : property.start || 0;
    if (key === '$not') {
      const value = resolveRunJsStaticFilterObjectNode(
        property.value,
        input.identifierBindings,
        input.staticFilterValueBindings,
      );
      if (value) {
        errors.push(
          ...collectAstResourceFilterProperties({
            ...input,
            filterObject: value,
          }),
        );
      }
      continue;
    }
    if (key === '$and' || key === '$or') {
      const value = resolveRunJsStaticFilterArrayNode(
        property.value,
        input.identifierBindings,
        input.staticFilterValueBindings,
      );
      if (value) {
        for (const element of value.elements || []) {
          const child = resolveRunJsStaticFilterObjectNode(
            element,
            input.identifierBindings,
            input.staticFilterValueBindings,
          );
          if (child) {
            errors.push(
              ...collectAstResourceFilterProperties({
                ...input,
                filterObject: child,
              }),
            );
          }
        }
      }
      continue;
    }
    if (key.startsWith('$')) {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      continue;
    }
    const fieldPath = input.path ? `${input.path}.${key}` : key;
    const resolved = resolveRunJsResourceFilterFieldPath(
      input.rootCollection,
      input.dataSourceKey,
      fieldPath,
      input.context,
    );
    if (!resolved.field) {
      errors.push(
        buildRunJsResourceFilterFieldError({
          ...input,
          collection: resolved.collection || input.collection,
          fieldPath,
          index: keyIndex,
        }),
      );
      continue;
    }
    const value = resolveRunJsStaticFilterObjectNode(
      property.value,
      input.identifierBindings,
      input.staticFilterValueBindings,
    );
    if (value) {
      errors.push(
        ...collectAstResourceFilterValueObjectErrors({
          ...input,
          field: resolved.field,
          fieldPath,
          filterObject: value,
          collection: resolved.collection || input.collection,
        }),
      );
    }
  }
  return errors;
}

function collectAstResourceFilterValueObjectErrors(input: {
  source: string;
  capability: string;
  dataSourceKey: string;
  collectionName: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  identifierBindings: AstIdentifierBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  collection: any;
  rootCollection: any;
  field: any;
  fieldPath: string;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  if (isRunJsJsonLikeField(input.field)) {
    return errors;
  }
  for (const property of input.filterObject.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!key) {
      continue;
    }
    const keyIndex = typeof property.key?.start === 'number' ? property.key.start : property.start || 0;
    if (key === '$not') {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      const value = resolveRunJsStaticFilterObjectNode(
        property.value,
        input.identifierBindings,
        input.staticFilterValueBindings,
      );
      if (value) {
        errors.push(
          ...collectAstResourceFilterValueObjectErrors({
            ...input,
            filterObject: value,
          }),
        );
      }
      continue;
    }
    if (key.startsWith('$')) {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      const invalidDateValue = buildRunJsResourceDateFilterValueError(key, keyIndex, property.value, input);
      if (invalidDateValue) {
        errors.push(invalidDateValue);
      }
      continue;
    }
    if (!isAssociationField(input.field)) {
      errors.push(buildRunJsResourceFilterOperatorError(key, keyIndex, input));
      continue;
    }
    const nestedFieldPath = `${input.fieldPath}.${key}`;
    const resolved = resolveRunJsResourceFilterFieldPath(
      input.rootCollection,
      input.dataSourceKey,
      nestedFieldPath,
      input.context,
    );
    if (!resolved.field) {
      errors.push(
        buildRunJsResourceFilterFieldError({
          ...input,
          collection: resolved.collection || input.collection,
          fieldPath: nestedFieldPath,
          index: keyIndex,
        }),
      );
      continue;
    }
    const value = resolveRunJsStaticFilterObjectNode(
      property.value,
      input.identifierBindings,
      input.staticFilterValueBindings,
    );
    if (value) {
      errors.push(
        ...collectAstResourceFilterValueObjectErrors({
          ...input,
          collection: resolved.collection || input.collection,
          field: resolved.field,
          fieldPath: nestedFieldPath,
          filterObject: value,
        }),
      );
    }
  }
  return errors;
}

function collectAstResourceFilterOperatorErrors(
  operator: string,
  index: number,
  input: {
    capability: string;
    dataSourceKey: string;
    collectionName: string;
    fieldPath?: string;
    resourceType: FlowResourceInstanceType;
  },
): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (isRunJsSupportedFilterOperator(operator)) {
    return [];
  }
  const suggestedOperator = getSuggestedRunJsFilterOperator(operator);
  return [
    {
      capability: input.capability,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      fieldPath: input.fieldPath,
      index,
      message: suggestedOperator
        ? `flowSurfaces authoring ${input.capability}(...) uses unsupported filter operator '${operator}'${
            input.fieldPath ? ` for field '${input.fieldPath}'` : ''
          }; use '${suggestedOperator}'`
        : `flowSurfaces authoring ${input.capability}(...) uses unsupported filter operator '${operator}'`,
      operator,
      resourceType: input.resourceType,
      ruleId: 'runjs-resource-filter-operator-invalid',
      suggestedOperator,
    },
  ];
}

function buildRunJsResourceFilterOperatorError(
  operator: string,
  index: number,
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    fieldPath: string;
    resourceType: FlowResourceInstanceType;
  },
): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const suggestedOperator = getSuggestedRunJsFilterOperator(operator);
  if (suggestedOperator) {
    return {
      capability: input.capability,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      fieldPath: input.fieldPath,
      index,
      message: `flowSurfaces authoring ${input.capability}(...) uses filter operator '${operator}' without '$' for field '${input.fieldPath}'; use '${suggestedOperator}'`,
      operator,
      resourceType: input.resourceType,
      ruleId: 'runjs-resource-filter-operator-missing-dollar',
      suggestedOperator,
    };
  }
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    fieldPath: input.fieldPath,
    index,
    message: `flowSurfaces authoring ${input.capability}(...) uses unsupported filter operator '${operator}' for field '${input.fieldPath}'`,
    operator,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-operator-invalid',
  };
}

function buildRunJsResourceDateFilterValueError(
  operator: string,
  index: number,
  valueNode: any,
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    field: any;
    fieldPath: string;
    identifierBindings: AstIdentifierBinding[];
    resourceType: FlowResourceInstanceType;
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
): RunJsAstInspection['invalidResourceFilterCalls'][number] | null {
  if (!isRunJsDateFilterOperator(operator)) {
    return null;
  }

  const valueObject = resolveRunJsStaticFilterObjectNode(
    valueNode,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  if (valueObject) {
    const unsupportedKeys = collectRunJsUnsupportedDateRangeValueKeys(valueObject);
    if (unsupportedKeys.length) {
      return buildRunJsUnsupportedDateRangeValueError(operator, index, valueObject, unsupportedKeys, input);
    }
  }

  const resolvedValue = resolveRunJsStaticFilterValue(
    valueNode,
    input.source,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  if (resolvedValue.status !== 'resolved') {
    return null;
  }

  try {
    normalizeFlowSurfaceStrictFilterDateValue(operator, resolvedValue.value, `${input.fieldPath}.${operator}`);
    return null;
  } catch (error) {
    return buildRunJsStrictDateFilterValueError(operator, index, resolvedValue.value, input, error);
  }
}

function buildRunJsUnsupportedDateRangeValueError(
  operator: string,
  index: number,
  valueObject: any,
  unsupportedKeys: string[],
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    field: any;
    fieldPath: string;
    resourceType: FlowResourceInstanceType;
    source: string;
  },
): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const suggestedValue = buildSuggestedRunJsDateRangeValue(valueObject, input.source);
  const relativeExample = suggestedValue || { type: 'past', number: 7, unit: 'day' };
  const examples = {
    relativePeriod: {
      [input.fieldPath]: {
        [operator]: relativeExample,
      },
    },
    explicitRange: {
      [input.fieldPath]: {
        $dateBetween: ['YYYY-MM-DD', 'YYYY-MM-DD'],
      },
    },
  };
  const suggestedText = suggestedValue
    ? `use ${operator}: ${JSON.stringify(suggestedValue)} for this relative period`
    : `use a frontend relative period object such as ${JSON.stringify(relativeExample)}`;
  const fieldType = String(getFieldType(input.field) || '').trim();
  const fieldInterface = String(getFieldInterface(input.field) || '').trim();
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    examples,
    fieldPath: input.fieldPath,
    index,
    message: `flowSurfaces authoring ${input.capability}(...) uses invalid date filter value for field '${
      input.fieldPath
    }' with operator '${operator}': ${unsupportedKeys.join(
      ', ',
    )} are not supported FlowResource date filter keys. ${suggestedText}, or use $dateBetween with ["YYYY-MM-DD", "YYYY-MM-DD"].`,
    operator,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-date-range-object-invalid',
    suggestedOperator: operator === '$dateBetween' ? '$dateBetween' : operator,
    suggestedValue: relativeExample,
    unsupportedKeys,
    fieldType,
    fieldInterface,
  };
}

function buildRunJsStrictDateFilterValueError(
  operator: string,
  index: number,
  invalidValue: unknown,
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    field: any;
    fieldPath: string;
    resourceType: FlowResourceInstanceType;
  },
  error: unknown,
): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const details =
    error instanceof FlowSurfaceBadRequestError && _.isPlainObject(error.options?.details) ? error.options.details : {};
  const invalidReason =
    typeof details.invalidReason === 'string' && details.invalidReason
      ? details.invalidReason
      : 'date filter value is invalid';
  const fieldType = String(getFieldType(input.field) || '').trim();
  const fieldInterface = String(getFieldInterface(input.field) || '').trim();
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    fieldPath: input.fieldPath,
    index,
    invalidReason,
    invalidValue: Object.prototype.hasOwnProperty.call(details, 'invalidValue') ? details.invalidValue : invalidValue,
    message: `flowSurfaces authoring ${input.capability}(...) uses invalid date filter value for field '${input.fieldPath}' with operator '${operator}': ${invalidReason}`,
    operator,
    repairExample: _.isPlainObject(details.repairExample) ? details.repairExample : undefined,
    repairHint: typeof details.repairHint === 'string' ? details.repairHint : undefined,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-date-value-invalid',
    suggestedOperator: operator,
    fieldType,
    fieldInterface,
  };
}

function resolveRunJsStaticFilterRootNode(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
): RunJsStaticFilterRootNode | undefined {
  const objectNode = resolveRunJsStaticFilterObjectNode(node, identifierBindings, staticFilterValueBindings);
  if (objectNode) {
    return {
      kind: 'object',
      node: objectNode,
    };
  }
  const arrayNode = resolveRunJsStaticFilterArrayNode(node, identifierBindings, staticFilterValueBindings);
  if (arrayNode) {
    return {
      kind: 'array',
      node: arrayNode,
    };
  }
  return undefined;
}

function resolveRunJsStaticFilterObjectNode(
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
  if (unwrapped.type !== 'Identifier') {
    return undefined;
  }
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
  return resolveRunJsStaticFilterObjectNode(binding.valueNode, identifierBindings, staticFilterValueBindings, nextSeen);
}

function resolveRunJsStaticFilterArrayNode(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  seen: Set<StaticFilterValueBinding> = new Set<StaticFilterValueBinding>(),
): any | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ArrayExpression') {
    return unwrapped;
  }
  if (unwrapped.type !== 'Identifier') {
    return undefined;
  }
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
  return resolveRunJsStaticFilterArrayNode(binding.valueNode, identifierBindings, staticFilterValueBindings, nextSeen);
}

function resolveRunJsStaticFilterValue(
  node: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
  seen: Set<StaticFilterValueBinding> = new Set<StaticFilterValueBinding>(),
): { status: 'resolved'; value: unknown } | { status: 'unresolved' } {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return { status: 'unresolved' };
  }
  if (unwrapped.type === 'Identifier') {
    const index = unwrapped.start || 0;
    if (unwrapped.name === 'undefined' && !hasAstActiveBinding('undefined', index, identifierBindings)) {
      return { status: 'resolved', value: undefined };
    }
    const binding = resolveAstAliasBinding(unwrapped.name, index, staticFilterValueBindings, identifierBindings);
    if (!binding || seen.has(binding)) {
      return { status: 'unresolved' };
    }
    const nextSeen = new Set(seen);
    nextSeen.add(binding);
    return resolveRunJsStaticFilterValue(
      binding.valueNode,
      source,
      identifierBindings,
      staticFilterValueBindings,
      nextSeen,
    );
  }
  if (unwrapped.type === 'Literal') {
    const value = unwrapped.value;
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      return { status: 'resolved', value };
    }
    return { status: 'unresolved' };
  }
  if (unwrapped.type === 'TemplateLiteral' && !unwrapped.expressions?.length) {
    return {
      status: 'resolved',
      value: unwrapped.quasis?.[0]?.value?.cooked ?? source.slice(unwrapped.start + 1, unwrapped.end - 1),
    };
  }
  if (unwrapped.type === 'UnaryExpression') {
    const argument = resolveRunJsStaticFilterValue(
      unwrapped.argument,
      source,
      identifierBindings,
      staticFilterValueBindings,
      seen,
    );
    if (argument.status !== 'resolved') {
      return argument;
    }
    if (unwrapped.operator === '-') {
      return typeof argument.value === 'number'
        ? { status: 'resolved', value: -argument.value }
        : { status: 'unresolved' };
    }
    if (unwrapped.operator === '+') {
      return typeof argument.value === 'number'
        ? { status: 'resolved', value: argument.value }
        : { status: 'unresolved' };
    }
    if (unwrapped.operator === '!') {
      return { status: 'resolved', value: !argument.value };
    }
    if (unwrapped.operator === 'void') {
      return { status: 'resolved', value: undefined };
    }
    return { status: 'unresolved' };
  }
  if (unwrapped.type === 'ArrayExpression') {
    const values: unknown[] = [];
    for (const element of unwrapped.elements || []) {
      if (!element) {
        values.push(undefined);
        continue;
      }
      if (element.type === 'SpreadElement') {
        return { status: 'unresolved' };
      }
      const item = resolveRunJsStaticFilterValue(element, source, identifierBindings, staticFilterValueBindings, seen);
      if (item.status !== 'resolved') {
        return item;
      }
      values.push(item.value);
    }
    return { status: 'resolved', value: values };
  }
  if (unwrapped.type === 'ObjectExpression') {
    const value: Record<string, unknown> = {};
    for (const property of unwrapped.properties || []) {
      if (!property || property.type === 'SpreadElement') {
        return { status: 'unresolved' };
      }
      const key = getAstStaticPropertyName(property);
      if (!key) {
        return { status: 'unresolved' };
      }
      const propertyValue = resolveRunJsStaticFilterValue(
        property.value,
        source,
        identifierBindings,
        staticFilterValueBindings,
        seen,
      );
      if (propertyValue.status !== 'resolved') {
        return propertyValue;
      }
      value[key] = propertyValue.value;
    }
    return { status: 'resolved', value };
  }
  return { status: 'unresolved' };
}

function isRunJsFilterGroupObjectNode(
  objectExpression: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
) {
  let hasLogic = false;
  for (const property of objectExpression?.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      return false;
    }
    const key = getAstStaticPropertyName(property);
    if (!key) {
      return false;
    }
    if (key === 'logic') {
      hasLogic = true;
    }
  }
  return (
    hasLogic && !!resolveRunJsFilterGroupItemsArrayNode(objectExpression, identifierBindings, staticFilterValueBindings)
  );
}

function buildRunJsResourceFilterShapeError(input: {
  source: string;
  capability: string;
  dataSourceKey?: string;
  collectionName?: string;
  resourceType: FlowResourceInstanceType;
  filterNode: RunJsStaticFilterRootNode;
  context: RunJsAuthoringContext;
  identifierBindings: AstIdentifierBinding[];
  staticFilterValueBindings: StaticFilterValueBinding[];
  index: number;
  invalidShape: 'array' | 'filter-group';
}): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const invalidValue = resolveRunJsStaticFilterValue(
    input.filterNode.node,
    input.source,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  const resolvedInvalidValue = invalidValue.status === 'resolved' ? invalidValue.value : undefined;
  const shapeData = getRunJsResourceFilterShapeData(input, resolvedInvalidValue);
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    index: input.index,
    invalidShape: input.invalidShape,
    invalidValue: resolvedInvalidValue,
    message: `flowSurfaces authoring ${input.capability}(...) received ${
      input.invalidShape === 'filter-group' ? 'a FlowSurface FilterGroup' : 'an array'
    }, but FlowResource filters must be backend query filter objects such as { stage: { $eq: '新线索' } }`,
    repairExample: buildRunJsResourceFilterShapeRepairExample(shapeData),
    repairHint:
      'FlowResource setFilter/addFilterGroup does not accept FlowSurface FilterGroup items. Convert { field/path, operator, value } items to backend query filter object syntax and prefix operators with "$".',
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-shape-invalid',
    suggestedOperator: getSuggestedRunJsResourceFilterShapeOperator(shapeData),
  };
}

type RunJsResourceFilterShapeItem = {
  fieldPath: string;
  hasValue: boolean;
  operator?: string;
  value?: unknown;
};

function buildRunJsResourceFilterShapeRepairExample(source: {
  items: RunJsResourceFilterShapeItem[];
  logic?: string;
}): Record<string, any> {
  const items = source.items.map((item) => buildRunJsResourceFilterConditionFromItem(item)).filter(Boolean) as Record<
    string,
    any
  >[];
  if (items.length === 1) {
    return items[0];
  }
  if (items.length > 1) {
    return {
      [source.logic === '$or' ? '$or' : '$and']: items,
    };
  }
  return {
    stage: {
      $eq: '新线索',
    },
  };
}

function getRunJsResourceFilterShapeData(
  input: {
    filterNode: RunJsStaticFilterRootNode;
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
  resolvedValue: unknown,
): {
  items: RunJsResourceFilterShapeItem[];
  logic?: string;
} {
  const astShapeData = getRunJsResourceFilterAstShapeData(input);
  if (astShapeData.items.length) {
    return astShapeData;
  }
  return getRunJsResourceFilterResolvedShapeData(resolvedValue);
}

function getRunJsResourceFilterAstShapeData(input: {
  filterNode: RunJsStaticFilterRootNode;
  identifierBindings: AstIdentifierBinding[];
  source: string;
  staticFilterValueBindings: StaticFilterValueBinding[];
}): {
  items: RunJsResourceFilterShapeItem[];
  logic?: string;
} {
  if (input.filterNode.kind === 'array') {
    return {
      items: getRunJsResourceFilterShapeItemsFromArrayNode(input.filterNode.node, input),
    };
  }

  const itemsNode = resolveRunJsFilterGroupItemsArrayNode(
    input.filterNode.node,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  if (itemsNode) {
    return {
      items: getRunJsResourceFilterShapeItemsFromArrayNode(itemsNode, input),
      logic: resolveRunJsFilterGroupLogic(input.filterNode.node, input),
    };
  }

  return {
    items: [],
  };
}

function getRunJsResourceFilterResolvedShapeData(value: unknown): {
  items: RunJsResourceFilterShapeItem[];
  logic?: string;
} {
  if (Array.isArray(value)) {
    return {
      items: value.map((item) => buildRunJsResourceFilterShapeItemFromValue(item)).filter(Boolean),
    };
  }
  if (_.isPlainObject(value)) {
    const valueObject = value as Record<string, unknown>;
    if (Array.isArray(valueObject.items)) {
      return {
        items: valueObject.items.map((item) => buildRunJsResourceFilterShapeItemFromValue(item)).filter(Boolean),
        logic: typeof valueObject.logic === 'string' ? valueObject.logic : undefined,
      };
    }
  }
  return {
    items: [],
  };
}

function getRunJsResourceFilterShapeItemsFromArrayNode(
  arrayNode: any,
  input: {
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
) {
  return (arrayNode?.elements || [])
    .map((element: any) => buildRunJsResourceFilterShapeItemFromNode(element, input))
    .filter(Boolean);
}

function buildRunJsResourceFilterShapeItemFromNode(
  node: any,
  input: {
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
): RunJsResourceFilterShapeItem | null {
  const objectNode = resolveRunJsStaticFilterObjectNode(
    node,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  if (!objectNode) {
    return null;
  }
  const fieldPath =
    resolveRunJsFilterShapeItemStringProperty(objectNode, 'path', input) ||
    resolveRunJsFilterShapeItemStringProperty(objectNode, 'field', input);
  if (!fieldPath) {
    return null;
  }
  const operator = resolveRunJsFilterShapeItemStringProperty(objectNode, 'operator', input);
  const value = resolveRunJsFilterShapeItemValue(objectNode, input);
  return {
    fieldPath,
    operator,
    ...value,
  };
}

function buildRunJsResourceFilterShapeItemFromValue(value: unknown): RunJsResourceFilterShapeItem | null {
  if (!_.isPlainObject(value)) {
    return null;
  }
  const input = value as Record<string, unknown>;
  const fieldPath = String(input.path || input.field || '').trim();
  if (!fieldPath) {
    return null;
  }
  return {
    fieldPath,
    hasValue: Object.prototype.hasOwnProperty.call(input, 'value'),
    operator: typeof input.operator === 'string' ? input.operator : undefined,
    value: input.value,
  };
}

function buildRunJsResourceFilterConditionFromItem(item: RunJsResourceFilterShapeItem): Record<string, any> | null {
  if (!item.fieldPath) {
    return null;
  }
  const operator = normalizeRunJsResourceFilterShapeOperator(item.operator);
  return {
    [item.fieldPath]: {
      [operator]: item.hasValue ? item.value : '<value>',
    },
  };
}

function resolveRunJsFilterShapeItemStringProperty(
  objectExpression: any,
  key: string,
  input: {
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
) {
  const property = getRunJsFilterShapeObjectProperty(objectExpression, key);
  if (!property) {
    return '';
  }
  const resolved = resolveRunJsStaticFilterValue(
    property.value,
    input.source,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  return resolved.status === 'resolved' && typeof resolved.value === 'string' ? resolved.value.trim() : '';
}

function resolveRunJsFilterShapeItemValue(
  objectExpression: any,
  input: {
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
): Pick<RunJsResourceFilterShapeItem, 'hasValue' | 'value'> {
  const property = getRunJsFilterShapeObjectProperty(objectExpression, 'value');
  if (!property) {
    return {
      hasValue: false,
    };
  }
  const resolved = resolveRunJsStaticFilterValue(
    property.value,
    input.source,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  return {
    hasValue: true,
    value: resolved.status === 'resolved' ? resolved.value : '<value>',
  };
}

function resolveRunJsFilterGroupItemsArrayNode(
  objectExpression: any,
  identifierBindings: AstIdentifierBinding[],
  staticFilterValueBindings: StaticFilterValueBinding[],
) {
  const property = getRunJsFilterShapeObjectProperty(objectExpression, 'items');
  return property
    ? resolveRunJsStaticFilterArrayNode(property.value, identifierBindings, staticFilterValueBindings)
    : undefined;
}

function resolveRunJsFilterGroupLogic(
  objectExpression: any,
  input: {
    identifierBindings: AstIdentifierBinding[];
    source: string;
    staticFilterValueBindings: StaticFilterValueBinding[];
  },
) {
  const property = getRunJsFilterShapeObjectProperty(objectExpression, 'logic');
  if (!property) {
    return undefined;
  }
  const resolved = resolveRunJsStaticFilterValue(
    property.value,
    input.source,
    input.identifierBindings,
    input.staticFilterValueBindings,
  );
  return resolved.status === 'resolved' && typeof resolved.value === 'string' ? resolved.value : undefined;
}

function getRunJsFilterShapeObjectProperty(objectExpression: any, name: string) {
  return (objectExpression?.properties || []).find((property: any) => {
    if (!property || property.type === 'SpreadElement') {
      return false;
    }
    return getAstStaticPropertyName(property) === name;
  });
}

function normalizeRunJsResourceFilterShapeOperator(operator: unknown) {
  const normalized = String(operator || '').trim();
  if (!normalized) {
    return '$eq';
  }
  return getSuggestedRunJsFilterOperator(normalized) || normalized;
}

function getSuggestedRunJsResourceFilterShapeOperator(input: { items: RunJsResourceFilterShapeItem[] }) {
  const operator = input.items.find((item) => typeof item.operator === 'string')?.operator;
  if (!operator) {
    return undefined;
  }
  return getSuggestedRunJsFilterOperator(operator) || undefined;
}

function isRunJsDateFilterOperator(operator: string) {
  return RUNJS_DATE_FILTER_OPERATORS.has(String(operator || '').trim());
}

function collectRunJsUnsupportedDateRangeValueKeys(objectExpression: any) {
  const keys: string[] = [];
  for (const property of objectExpression.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS.has(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function buildSuggestedRunJsDateRangeValue(objectExpression: any, source: string) {
  const values: Record<string, string> = {};
  for (const property of objectExpression.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS.has(key)) {
      continue;
    }
    const value = resolveAstStaticStringValue(property.value, source);
    if (typeof value === 'string') {
      values[key] = value.trim();
    }
  }

  const from = values.$dateFrom;
  const to = values.$dateTo;
  const fromOffset = parseRunJsRelativeDateOffset(from);
  const toOffset = parseRunJsRelativeDateOffset(to);
  if (to === 'now' && fromOffset?.direction === 'past') {
    return {
      type: 'past',
      number: fromOffset.number,
      unit: fromOffset.unit,
    };
  }
  if (from === 'now' && toOffset?.direction === 'next') {
    return {
      type: 'next',
      number: toOffset.number,
      unit: toOffset.unit,
    };
  }
  return undefined;
}

function parseRunJsRelativeDateOffset(value: string | undefined) {
  const match = String(value || '')
    .trim()
    .match(/^([+-])\s*(\d+)\s*(d|day|days|w|week|weeks|m|mo|month|months|q|quarter|quarters|y|year|years)$/i);
  if (!match) {
    return null;
  }
  const unit = normalizeRunJsRelativeDateUnit(match[3]);
  if (!unit) {
    return null;
  }
  return {
    direction: match[1] === '-' ? 'past' : 'next',
    number: Number(match[2]),
    unit,
  };
}

function normalizeRunJsRelativeDateUnit(value: string): 'day' | 'week' | 'month' | 'quarter' | 'year' | '' {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'd' || normalized === 'day' || normalized === 'days') {
    return 'day';
  }
  if (normalized === 'w' || normalized === 'week' || normalized === 'weeks') {
    return 'week';
  }
  if (normalized === 'm' || normalized === 'mo' || normalized === 'month' || normalized === 'months') {
    return 'month';
  }
  if (normalized === 'q' || normalized === 'quarter' || normalized === 'quarters') {
    return 'quarter';
  }
  if (normalized === 'y' || normalized === 'year' || normalized === 'years') {
    return 'year';
  }
  return '';
}

function buildRunJsResourceFilterFieldError(input: {
  capability: string;
  collection: any;
  collectionName: string;
  dataSourceKey: string;
  fieldPath: string;
  index: number;
  resourceType: FlowResourceInstanceType;
}): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const collectionName = getCollectionName(input.collection) || input.collectionName;
  return {
    availableFields: getCollectionFields(input.collection)
      .map((field) => String(getFieldName(field) || '').trim())
      .filter(Boolean),
    capability: input.capability,
    collectionName,
    dataSourceKey: input.dataSourceKey,
    fieldPath: input.fieldPath,
    index: input.index,
    message: `flowSurfaces authoring ${input.capability}(...) references unknown filter field '${input.fieldPath}' on collection '${collectionName}'`,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-field-unknown',
  };
}

function resolveRunJsResourceFilterFieldPath(
  collection: any,
  dataSourceKey: string,
  fieldPath: string,
  context: RunJsAuthoringContext,
): { collection: any; field: any } {
  if (typeof collection?.getFieldByPath === 'function') {
    const direct = collection.getFieldByPath(fieldPath);
    if (direct) {
      return { collection, field: direct };
    }
  }
  const direct = resolveFieldFromCollection(collection, fieldPath);
  if (direct) {
    return { collection, field: direct };
  }
  let currentCollection = collection;
  let currentDataSourceKey = dataSourceKey || collection?.dataSourceKey || 'main';
  const parts = String(fieldPath || '')
    .split('.')
    .filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const field = getRunJsCollectionField(currentCollection, part);
    if (!field) {
      return { collection: currentCollection, field: null };
    }
    if (index === parts.length - 1) {
      return { collection: currentCollection, field };
    }
    if (!isAssociationField(field)) {
      return { collection: currentCollection, field: null };
    }
    const targetCollection = resolveFieldTargetCollection(
      field,
      currentCollection?.dataSourceKey || currentDataSourceKey,
      (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
    );
    if (!targetCollection) {
      return { collection: currentCollection, field: null };
    }
    currentCollection = targetCollection;
    currentDataSourceKey = targetCollection?.dataSourceKey || currentDataSourceKey;
  }
  return { collection: currentCollection, field: null };
}

function getRunJsCollectionField(collection: any, fieldName: string) {
  const normalized = String(fieldName || '').trim();
  if (!normalized) {
    return null;
  }
  const field = collection?.getField?.(normalized) || collection?.fields?.get?.(normalized);
  if (field) {
    return field;
  }
  const modelAttributes =
    (typeof collection?.model?.getAttributes === 'function' ? collection.model.getAttributes() : null) ||
    collection?.model?.rawAttributes ||
    collection?.model?.attributes ||
    {};
  const modelAttribute = modelAttributes?.[normalized];
  if (modelAttribute) {
    return {
      name: normalized,
      type: modelAttribute.type?.key || modelAttribute.type,
      interface: modelAttribute.interface,
    };
  }
  if (normalized === 'id') {
    return {
      name: 'id',
      type: 'bigInt',
      interface: 'id',
    };
  }
  return null;
}

function isRunJsJsonLikeField(field: any) {
  const type = String(getFieldType(field) || '')
    .trim()
    .toLowerCase();
  return type === 'json' || type === 'jsonb' || type === 'array';
}

function isRunJsSupportedFilterOperator(operator: string) {
  return RUNJS_SUPPORTED_FILTER_OPERATORS.has(String(operator || '').trim());
}

function getSuggestedRunJsFilterOperator(operator: string) {
  const normalized = String(operator || '').trim();
  if (normalized === '$dataOn' || normalized === 'dataOn') {
    return '$dateOn';
  }
  if (!normalized || normalized.startsWith('$')) {
    return '';
  }
  const suggested = `$${normalized}`;
  return isRunJsSupportedFilterOperator(suggested) ? suggested : '';
}
