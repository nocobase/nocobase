/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJsAuthoringContext, RunJsAstInspection, StringLiteralBinding } from '../internal-types';
import {
  collectBraceRanges,
  collectStaticBlockRanges,
  findFunctionRanges,
  findMatches,
  isInsideRanges,
  maskJavaScriptSource,
} from '../ast/source';
import { walkAstSimple } from '../ast/walk';
import { collectSourceBindings, collectStringLiteralBindings, dedupeIndexedEntries } from '../ast/bindings';
import {
  collectCtxAliases,
  collectCtxLibMemberCaseMismatches,
  collectCtxMemberAccesses,
  collectCtxRenderComponentSignatureCalls,
  collectDirectDomAliases,
  collectDirectDomWrites,
  collectFlowResourceAliases,
  collectForbiddenBareGlobals,
  collectInvalidApiResourceCalls,
  collectInvalidFlowResourceListCalls,
  collectInvalidResourceTypeCalls,
  collectReactComponentAliases,
  collectReactComponentFunctionCalls,
  collectReactComponentPropReferences,
  collectReactHookCalls,
  collectResourceCallsInReactHooks,
  collectUnboundReactCreateElementCalls,
  collectWindowDocumentNavigatorAliases,
  collectWindowDocumentNavigatorUses,
  isTopLevelFunctionWrapper,
} from './source-patterns';
import {
  collectAstFunctionBindingsFromAst,
  collectAstIdentifierBindingsFromAst,
  collectStaticFilterValueBindingsFromAst,
  collectStaticStringBindingsFromAst,
} from '../ast/static-bindings';
import { dedupeAstResourceEntries, findUnboundCtxMatches, resolveCtxMethodCall } from '../ast/static-values';
import {
  collectAstInvalidReactRuntimeBindingsFromAst,
  collectAstReactAsyncComponentReferences,
  collectReactAsyncComponentBindingsFromAst,
  collectReactCreateElementAliasesFromAst,
  collectReactDefaultAliasesFromAst,
  collectReactNamespaceAliasesFromAst,
} from './react';
import {
  collectAstReactComponentCtxRenderCallsFromAst,
  collectAstTopLevelReachableCtxRenderCallsFromAst,
} from './react-render';
import {
  collectAstInvalidApiResourceCall,
  collectAstInvalidCtxApiMemberAccess,
  collectAstInvalidCtxApiPatternAccesses,
  collectAstInvalidCtxApiReadonlyWrites,
  collectAstInvalidCtxLibMemberAccess,
  collectAstInvalidCtxLibPatternAccesses,
  collectCtxApiAliasesFromAst,
  collectCtxApiResourceAliasesFromAst,
  collectCtxLibAliasesFromAst,
  collectCtxLibsRootAliasesFromAst,
  collectCtxMethodAliasesFromAst,
  collectCtxRootAliasesFromAst,
  filterInvalidCtxApiMemberAccessesForResourceCalls,
} from './ctx-api';
import {
  collectAstFlowResourceAliasesFromAst,
  collectAstInvalidFlowResourceMethodCall,
  collectAstInvalidResourceActionCalls,
  collectAstInvalidResourceTypeCall,
  collectAstSharedCtxResourceCallsInFunctions,
} from './resource';
import { collectAstInvalidResourceFilterCalls } from './filter';

export function scanJavaScriptSource(source: string, ast?: any, context: RunJsAuthoringContext = {}) {
  const masked = maskJavaScriptSource(source);
  const functionRanges = findFunctionRanges(masked);
  const blockRanges = collectBraceRanges(masked);
  const staticBlockRanges = collectStaticBlockRanges(masked);
  const sourceBindings = collectSourceBindings(masked, functionRanges, blockRanges, staticBlockRanges);
  const stringLiteralBindings = collectStringLiteralBindings(source, masked, sourceBindings);
  const astInspection = ast ? inspectRunJsAst(ast, source, stringLiteralBindings, context) : undefined;
  const ctxRenderCalls = findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g, sourceBindings);
  const topLevelCtxRenderCalls = ctxRenderCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges));
  const topLevelReachableCtxRenderCalls = astInspection
    ? dedupeIndexedEntries(astInspection.topLevelReachableCtxRenderCalls).sort(
        (left, right) => left.index - right.index,
      )
    : topLevelCtxRenderCalls.map((entry) => ({
        capability: 'ctx.render',
        index: entry.index,
      }));
  const topLevelReturns = findMatches(masked, /\breturn\b/g).filter(
    (entry) => !isInsideRanges(entry.index, functionRanges),
  );
  const ctxRunjsCalls = findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.|\.)\s*runjs\s*(?:\?\.)?\(/g, sourceBindings);
  const ctxRequestCalls = findUnboundCtxMatches(
    masked,
    /\bctx\s*(?:\?\.|\.)\s*(?:api\s*(?:\?\.|\.)\s*)?request\s*(?:\?\.)?\(/g,
    sourceBindings,
  );
  const reactHookCalls = collectReactHookCalls(masked, sourceBindings);
  const reactComponentAliases = collectReactComponentAliases(masked, sourceBindings);
  const flowResourceAliases = collectFlowResourceAliases(masked, sourceBindings);
  const directDomWrites = collectDirectDomWrites(source, masked, sourceBindings);
  const directDomAliases = collectDirectDomAliases(masked, sourceBindings);
  const windowDocumentNavigatorUses = collectWindowDocumentNavigatorUses(source, masked, sourceBindings);
  const windowDocumentNavigatorAliases = collectWindowDocumentNavigatorAliases(masked, sourceBindings);
  const ctxAliases = collectCtxAliases(masked, sourceBindings);
  const forbiddenBareGlobals = collectForbiddenBareGlobals(masked, sourceBindings);
  return {
    source,
    masked,
    functionRanges,
    blockRanges,
    sourceBindings,
    ctxRenderCalls,
    topLevelCtxRenderCalls,
    topLevelReachableCtxRenderCalls,
    topLevelReturns,
    ctxRunjsCalls,
    nestedRunjsCalls:
      astInspection?.nestedRunjsCalls ||
      ctxRunjsCalls.map((entry) => ({
        capability: 'ctx.runjs',
        index: entry.index,
      })),
    invalidReactRuntimeBindings: astInspection?.invalidReactRuntimeBindings || [],
    ctxRequestCalls,
    invalidApiResourceCalls: dedupeIndexedEntries([
      ...collectInvalidApiResourceCalls(source, masked, sourceBindings),
      ...(astInspection?.invalidApiResourceCalls || []),
    ]).sort((left, right) => left.index - right.index),
    invalidResourceActionCalls: astInspection?.invalidResourceActionCalls || [],
    invalidResourceTypeCalls:
      astInspection?.invalidResourceTypeCalls ||
      collectInvalidResourceTypeCalls(source, masked, stringLiteralBindings, sourceBindings),
    invalidFlowResourceListCalls: dedupeIndexedEntries([
      ...collectInvalidFlowResourceListCalls(masked, flowResourceAliases, sourceBindings),
      ...(astInspection?.invalidFlowResourceListCalls || []),
    ]).sort((left, right) => left.index - right.index),
    invalidFlowResourceMethodCalls: astInspection?.invalidFlowResourceMethodCalls || [],
    invalidResourceFilterCalls: astInspection?.invalidResourceFilterCalls || [],
    resourceCallsInReactHooks: collectResourceCallsInReactHooks(source, masked, reactHookCalls, sourceBindings),
    topLevelReactHookCalls: reactHookCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges)),
    unboundReactCreateElementCalls: collectUnboundReactCreateElementCalls(masked, sourceBindings),
    reactComponentFunctionCalls: collectReactComponentFunctionCalls(masked, reactComponentAliases, sourceBindings),
    reactAsyncComponentReferences: astInspection?.reactAsyncComponentReferences || [],
    reactComponentCtxRenderCalls: astInspection?.reactComponentCtxRenderCalls || [],
    sharedCtxResourceCallsInFunctions: astInspection?.sharedCtxResourceCallsInFunctions || [],
    ctxRenderComponentSignatureCalls: collectCtxRenderComponentSignatureCalls(
      source,
      masked,
      reactComponentAliases,
      sourceBindings,
    ),
    reactComponentPropReferences: collectReactComponentPropReferences(
      source,
      masked,
      reactComponentAliases,
      sourceBindings,
    ),
    directDomWrites,
    directDomAliases,
    windowDocumentNavigatorUses,
    windowDocumentNavigatorAliases,
    ctxAliases,
    ctxLibMemberCaseMismatches: collectCtxLibMemberCaseMismatches(source, masked, sourceBindings),
    invalidCtxApiMemberAccesses: astInspection?.invalidCtxApiMemberAccesses || [],
    invalidCtxLibMemberAccesses: astInspection?.invalidCtxLibMemberAccesses || [],
    forbiddenBareGlobals,
    ctxMemberAccesses: collectCtxMemberAccesses(masked, sourceBindings),
    dynamicCtxAccesses: findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.\s*)?\[/g, sourceBindings),
    isTopLevelFunctionWrapper: isTopLevelFunctionWrapper(masked, functionRanges, topLevelReachableCtxRenderCalls),
  };
}

function inspectRunJsAst(
  ast: any,
  source: string,
  stringBindings: StringLiteralBinding[],
  context: RunJsAuthoringContext = {},
): RunJsAstInspection {
  const identifierBindings = collectAstIdentifierBindingsFromAst(ast, source);
  const functionBindings = collectAstFunctionBindingsFromAst(ast, source);
  const aliases = collectCtxMethodAliasesFromAst(ast, source, identifierBindings);
  const ctxRootAliases = collectCtxRootAliasesFromAst(ast, source, identifierBindings);
  const ctxApiAliases = collectCtxApiAliasesFromAst(ast, source, identifierBindings);
  const ctxLibsRootAliases = collectCtxLibsRootAliasesFromAst(ast, source, identifierBindings);
  const ctxLibAliases = collectCtxLibAliasesFromAst(ast, source, ctxLibsRootAliases, identifierBindings);
  const staticStringBindings = [
    ...stringBindings,
    ...collectStaticStringBindingsFromAst(ast, source, stringBindings, identifierBindings),
  ];
  const staticFilterValueBindings = collectStaticFilterValueBindingsFromAst(ast, source, identifierBindings);
  const ctxApiResourceAliases = collectCtxApiResourceAliasesFromAst(
    ast,
    source,
    ctxApiAliases,
    staticStringBindings,
    staticFilterValueBindings,
    identifierBindings,
  );
  const reactNamespaceAliases = collectReactNamespaceAliasesFromAst(ast, source, identifierBindings, ctxRootAliases);
  const reactDefaultAliases = collectReactDefaultAliasesFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
  );
  const invalidReactRuntimeBindings = collectAstInvalidReactRuntimeBindingsFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
    reactDefaultAliases,
  );
  const reactCreateElementAliases = collectReactCreateElementAliasesFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
  );
  const asyncComponentBindings = collectReactAsyncComponentBindingsFromAst(ast, source, identifierBindings);
  const flowResourceAliases = collectAstFlowResourceAliasesFromAst(
    ast,
    source,
    aliases,
    staticStringBindings,
    identifierBindings,
  );
  const nestedRunjsCalls: RunJsAstInspection['nestedRunjsCalls'] = [];
  const invalidCtxApiMemberAccesses: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [
    ...collectAstInvalidCtxApiPatternAccesses(ast, ctxApiAliases, identifierBindings),
  ];
  const invalidCtxLibMemberAccesses: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [
    ...collectAstInvalidCtxLibPatternAccesses(ast, ctxLibAliases, ctxLibsRootAliases, identifierBindings, source),
  ];
  const invalidApiResourceCalls: RunJsAstInspection['invalidApiResourceCalls'] = [];
  const invalidResourceActionCalls = collectAstInvalidResourceActionCalls(
    ast,
    source,
    flowResourceAliases,
    identifierBindings,
    aliases,
    ctxApiAliases,
    ctxApiResourceAliases,
    staticStringBindings,
    staticFilterValueBindings,
    context,
  );
  const invalidResourceTypeCalls: RunJsAstInspection['invalidResourceTypeCalls'] = [];
  const invalidFlowResourceListCalls: RunJsAstInspection['invalidFlowResourceListCalls'] = [];
  const invalidFlowResourceMethodCalls: RunJsAstInspection['invalidFlowResourceMethodCalls'] = [];
  const invalidResourceFilterCalls = collectAstInvalidResourceFilterCalls(
    ast,
    source,
    flowResourceAliases,
    identifierBindings,
    aliases,
    staticStringBindings,
    staticFilterValueBindings,
    context,
  );
  const reactAsyncComponentReferences: RunJsAstInspection['reactAsyncComponentReferences'] = [];
  const topLevelReachableCtxRenderCalls = collectAstTopLevelReachableCtxRenderCallsFromAst(
    ast,
    aliases,
    identifierBindings,
    functionBindings,
  );
  const reactComponentCtxRenderCalls = collectAstReactComponentCtxRenderCallsFromAst(
    topLevelReachableCtxRenderCalls,
    aliases,
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
  );
  const sharedCtxResourceCallsInFunctions = collectAstSharedCtxResourceCallsInFunctions(
    ast,
    source,
    aliases,
    identifierBindings,
  );

  walkAstSimple(ast, {
    CallExpression(node: any) {
      const method = resolveCtxMethodCall(node, aliases, identifierBindings);
      if (method) {
        if (method.method === 'runjs') {
          nestedRunjsCalls.push({
            capability: method.capability,
            index: node.start || 0,
          });
          return;
        }
        if (method.method === 'makeResource' || method.method === 'initResource') {
          invalidResourceTypeCalls.push(
            ...collectAstInvalidResourceTypeCall(
              node,
              method.method,
              method.capability,
              source,
              staticStringBindings,
              identifierBindings,
            ),
          );
        }
      }
      const flowResourceMethodCall = collectAstInvalidFlowResourceMethodCall(
        node,
        flowResourceAliases,
        source,
        identifierBindings,
        aliases,
        staticStringBindings,
      );
      flowResourceMethodCall.invalidListCalls.forEach((entry) => invalidFlowResourceListCalls.push(entry));
      flowResourceMethodCall.invalidMethodCalls.forEach((entry) => invalidFlowResourceMethodCalls.push(entry));
      collectAstInvalidApiResourceCall(node, ctxApiAliases, ctxApiResourceAliases, source, identifierBindings).forEach(
        (entry) => invalidApiResourceCalls.push(entry),
      );
      collectAstReactAsyncComponentReferences(
        node,
        asyncComponentBindings,
        reactCreateElementAliases,
        identifierBindings,
      ).forEach((entry) => reactAsyncComponentReferences.push(entry));
    },
    MemberExpression(node: any) {
      const invalidCtxLibAccess = collectAstInvalidCtxLibMemberAccess(
        node,
        ctxLibAliases,
        ctxLibsRootAliases,
        identifierBindings,
        source,
      );
      if (invalidCtxLibAccess) {
        invalidCtxLibMemberAccesses.push(invalidCtxLibAccess);
      }
      const invalidCtxApiAccess = collectAstInvalidCtxApiMemberAccess(node, ctxApiAliases, identifierBindings, source);
      if (invalidCtxApiAccess) {
        invalidCtxApiMemberAccesses.push(invalidCtxApiAccess);
      }
    },
    AssignmentExpression(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    UpdateExpression(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.argument, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    UnaryExpression(node: any) {
      if (node.operator !== 'delete') {
        return;
      }
      collectAstInvalidCtxApiReadonlyWrites(node.argument, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    ForInStatement(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    ForOfStatement(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
  });

  const dedupedInvalidApiResourceCalls = dedupeIndexedEntries(invalidApiResourceCalls).sort(
    (left, right) => left.index - right.index,
  );

  return {
    invalidApiResourceCalls: dedupedInvalidApiResourceCalls,
    invalidResourceActionCalls: dedupeIndexedEntries(invalidResourceActionCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidCtxApiMemberAccesses: filterInvalidCtxApiMemberAccessesForResourceCalls(
      dedupeIndexedEntries(invalidCtxApiMemberAccesses),
      dedupedInvalidApiResourceCalls,
    ).sort((left, right) => left.index - right.index),
    invalidCtxLibMemberAccesses: dedupeIndexedEntries(invalidCtxLibMemberAccesses).sort(
      (left, right) => left.index - right.index,
    ),
    invalidResourceTypeCalls: dedupeAstResourceEntries(invalidResourceTypeCalls),
    invalidFlowResourceListCalls: dedupeIndexedEntries(invalidFlowResourceListCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidFlowResourceMethodCalls: dedupeIndexedEntries(invalidFlowResourceMethodCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidResourceFilterCalls: dedupeIndexedEntries(invalidResourceFilterCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidReactRuntimeBindings: dedupeIndexedEntries(invalidReactRuntimeBindings).sort(
      (left, right) => left.start - right.start,
    ),
    nestedRunjsCalls: dedupeIndexedEntries(nestedRunjsCalls).sort((left, right) => left.index - right.index),
    reactAsyncComponentReferences: dedupeIndexedEntries(reactAsyncComponentReferences).sort(
      (left, right) => left.index - right.index,
    ),
    reactComponentCtxRenderCalls,
    sharedCtxResourceCallsInFunctions,
    topLevelReachableCtxRenderCalls,
  };
}
