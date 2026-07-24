/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceErrorItemInput } from '../../errors';
import type { RunJsAuthoringSurfaceStyle } from '../types';
import {
  ALLOWED_CTX_ROOTS,
  BLOCKED_CTX_CAPABILITIES,
  CHART_CTX_ROOTS,
  RUNJS_CTX_NON_FUNCTION_ROOTS_BY_MODEL_USE,
} from '../runtime/constants';
import type { RunJsInspectionRuntime, RunJsInspectionValidator, RunJsScanResult } from '../runtime/types';
import { buildRunJsAuthoringError } from '../runtime/errors';
import { getResourceLikeCtxRunjsEntrypoint, isResourceLikeCtxRequest } from '../scan/source-patterns';

function collectNestedRunJsErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.nestedRunjsCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'nested-runjs-stop',
        ruleId: 'runjs-nested-runjs-forbidden',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}(...) from authored RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
        },
      }),
    );
  });
}

function collectResourceApiErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!scan.nestedRunjsCalls.length) {
    scan.ctxRunjsCalls.forEach((entry) => {
      const endpoint = getResourceLikeCtxRunjsEntrypoint(source, scan.masked, entry.index);
      if (!endpoint) {
        return;
      }
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'switch-to-resource-api',
          message: `flowSurfaces authoring ${path} must use resource APIs for collection access; ctx.runjs(...) executes JavaScript strings, not resource endpoints`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: 'ctx.runjs',
            endpoint,
          },
        }),
      );
    });
  }
  scan.ctxRequestCalls.forEach((entry) => {
    if (!isResourceLikeCtxRequest(source, scan.masked, entry.index)) {
      return;
    }
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        message: `flowSurfaces authoring ${path} must use resource APIs instead of ctx request APIs for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.invalidApiResourceCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        ruleId: 'runjs-api-resource-call-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.match}(...); use resource APIs or ctx.request(...) for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
          method: entry.method,
        },
      }),
    );
  });
}

function collectResourceRuntimeErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (modelUse === 'JSBlockModel') {
    scan.resourceCallsInReactHooks.forEach((entry) => {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'resource-runtime-contract-stop',
          ruleId: 'runjs-jsblock-resource-hook-forbidden',
          message: `flowSurfaces authoring ${path} cannot use ${entry.capability} inside React Hook ${entry.hook}(...) in JSBlock render code; load resource data before ctx.render(...) and pass values into the rendered component`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            hook: entry.hook,
          },
        }),
      );
    });
    scan.sharedCtxResourceCallsInFunctions.forEach((entry) => {
      const functionScope = entry.functionName
        ? ` inside function '${entry.functionName}'`
        : ' inside a nested function';
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'resource-runtime-contract-stop',
          ruleId: 'runjs-jsblock-shared-resource-helper-forbidden',
          message: `flowSurfaces authoring ${path} cannot use ${entry.capability}${functionScope} in JSBlock render code; ctx.initResource reuses ctx.resource across calls and can retain stale request params. Use a local ctx.makeResource(...) resource inside the helper instead`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            functionName: entry.functionName,
          },
        }),
      );
    });
  }
  scan.invalidResourceTypeCalls.forEach((entry) => {
    const message =
      entry.ruleId === 'runjs-make-resource-type-invalid'
        ? `flowSurfaces authoring ${path} ${entry.capability}(...) expects a FlowResource class name, not collection '${entry.resourceType}'`
        : `flowSurfaces authoring ${path} cannot validate dynamic ${entry.capability}(...) resource type '${entry.expression}'`;
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: entry.ruleId,
        message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          expression: entry.expression,
          resourceType: entry.resourceType,
        },
      }),
    );
  });
  scan.invalidFlowResourceMethodCalls.forEach((entry) => {
    const suggestedMethod = entry.suggestedMethod ? `; use ${entry.suggestedMethod}(...) instead` : '';
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-flow-resource-method-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}(...); FlowResource method '${entry.method}' is not supported${suggestedMethod}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          method: entry.method,
          resourceType: entry.resourceType,
          suggestedMethod: entry.suggestedMethod,
        },
      }),
    );
  });
  scan.invalidFlowResourceListCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-flow-resource-list-method-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}; FlowResource instances fetch through refresh() and expose getData()/getMeta()`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          method: 'list',
        },
      }),
    );
  });
  scan.invalidResourceActionCalls.forEach((entry) => {
    const allowedActions = entry.allowedActions?.length
      ? ` Allowed collection actions: ${entry.allowedActions.join(', ')}.`
      : '';
    const suggestion =
      entry.actionName === 'refresh'
        ? ' Use resource.refresh() for UI resource refresh, or use list/get when making a backend resource action request.'
        : entry.suggestedMethod
          ? ` Use ${entry.suggestedMethod}(...) instead.`
          : '';
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-resource-action-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}; collection action '${entry.actionName}' is not supported.${allowedActions}${suggestion}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          actionName: entry.actionName,
          allowedActions: entry.allowedActions,
          capability: entry.capability,
          collectionName: entry.collectionName,
          dataSourceKey: entry.dataSourceKey,
          endpoint: entry.endpoint,
          invalidReason: entry.invalidReason,
          resourceType: entry.resourceType,
          suggestedMethod: entry.suggestedMethod,
        },
      }),
    );
  });
  scan.invalidResourceFilterCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: entry.ruleId,
        message: entry.message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          resourceType: entry.resourceType,
          dataSourceKey: entry.dataSourceKey,
          collectionName: entry.collectionName,
          fieldInterface: entry.fieldInterface,
          fieldPath: entry.fieldPath,
          fieldType: entry.fieldType,
          invalidShape: entry.invalidShape,
          invalidReason: entry.invalidReason,
          invalidValue: entry.invalidValue,
          operator: entry.operator,
          repairExample: entry.repairExample,
          repairHint: entry.repairHint,
          unsupportedKeys: entry.unsupportedKeys,
          suggestedOperator: entry.suggestedOperator,
          suggestedValue: entry.suggestedValue,
          examples: entry.examples,
          availableFields: entry.availableFields,
        },
      }),
    );
  });
}

function collectDirectDomErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.directDomAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} cannot alias ctx.element in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'ctx.element',
          alias: entry.alias,
        },
      }),
    );
  });
  scan.directDomWrites.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} must render through ctx.render(...) instead of direct DOM writes`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
        },
      }),
    );
  });
}

function collectReactRuntimeErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.topLevelReactHookCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-hook-top-level-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React Hook ${entry.hook}(...) from top-level RunJS code`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          hook: entry.hook,
          capability: entry.match,
        },
      }),
    );
  });
  scan.unboundReactCreateElementCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-global-unbound',
        message: `flowSurfaces authoring ${path} cannot use bare React.createElement(...) without binding React from ctx.React`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'React.createElement',
        },
      }),
    );
  });
  scan.invalidReactRuntimeBindings.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: entry.ruleId,
        message: `flowSurfaces authoring ${path} cannot bind ${entry.binding} from ${entry.capability}; bind React with "const React = ctx.React" before using JSX or React.createElement`,
        modelUse,
        surface,
        index: entry.declarationStart ?? entry.start,
        source,
        details: {
          binding: entry.binding,
          capability: entry.capability,
          repairClass: 'react-runtime-contract-stop',
        },
      }),
    );
  });
  scan.reactComponentFunctionCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-call-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React component ${entry.component} as a plain function`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.reactAsyncComponentReferences.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-async-component-forbidden',
        message: `flowSurfaces authoring ${path} cannot render async function ${entry.component} as a React component because React receives a Promise`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.ctxRenderComponentSignatureCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-render-component-signature-invalid',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} directly to ctx.render(...)`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.reactComponentPropReferences.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-prop-node-required',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} as ${entry.prop}; create a React element first`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
          prop: entry.prop,
        },
      }),
    );
  });
}

function collectCtxContractErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.ctxAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-ctx-root-unknown',
        message: `flowSurfaces authoring ${path} cannot alias ctx in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          member: entry.alias,
        },
      }),
    );
  });
  scan.ctxLibMemberCaseMismatches.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-libs-member-mismatch-stop',
        ruleId: 'runjs-ctx-libs-member-case-invalid',
        message: `flowSurfaces authoring ${path} ${entry.capability} is not a valid RunJS library key; use ${entry.expectedCapability} because ctx.libs keys are case-sensitive`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          accessKind: entry.accessKind,
          capability: entry.capability,
          expectedCapability: entry.expectedCapability,
          expectedMember: entry.expectedMember,
          member: entry.member,
        },
      }),
    );
  });
  scan.invalidCtxLibMemberAccesses.forEach((entry) => {
    const importHint = entry.suggestedImport
      ? `; import it with await ctx.importAsync('${entry.suggestedImport}') instead`
      : '';
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-libs-member-mismatch-stop',
        ruleId: entry.ruleId,
        message: `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.libs.${entry.library} member${importHint}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          accessKind: entry.accessKind,
          capability: entry.capability,
          library: entry.library,
          member: entry.member,
          suggestedImport: entry.suggestedImport,
        },
      }),
    );
  });
  scan.invalidCtxApiMemberAccesses.forEach((entry) => {
    const message =
      entry.ruleId === 'runjs-ctx-api-member-dynamic-unresolved'
        ? `flowSurfaces authoring ${path} cannot validate dynamic ${entry.capability} access`
        : entry.ruleId === 'runjs-ctx-api-auth-member-readonly'
          ? `flowSurfaces authoring ${path} cannot write readonly RunJS ${entry.capability}; read ctx.api.auth.locale, role, token, or authenticator without mutating them`
          : entry.ruleId === 'runjs-ctx-api-auth-member-unsupported'
            ? `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.api.auth member; read ctx.api.auth.locale, role, token, or authenticator instead`
            : `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.api member; use ctx.request(...), ctx.api.request(...), ctx.api.resource(...), or readonly ctx.api.auth fields`;
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: entry.ruleId,
        message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          member: entry.member,
        },
      }),
    );
  });
  scan.invalidCtxNonFunctionCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: entry.ruleId,
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}(...); ${entry.capability} is a RunJS ctx value, not a function`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          member: entry.member,
          repairHint: getCtxNonFunctionCallRepairHint(entry.member),
        },
      }),
    );
  });
  scan.dynamicCtxAccesses.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-dynamic-ctx-member-unresolved',
        message: `flowSurfaces authoring ${path} cannot validate dynamic ctx[...] access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.ctxMemberAccesses.forEach((entry) => {
    const blocked = BLOCKED_CTX_CAPABILITIES[entry.member];
    if (blocked) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'blocked-capability-reroute',
          message: `flowSurfaces authoring ${path} ${blocked.capability} must be configured outside RunJS`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: blocked,
        }),
      );
      return;
    }
    if (!isAllowedCtxRoot(entry.member, modelUse)) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'ctx-root-mismatch-stop',
          message: `flowSurfaces authoring ${path} ctx.${entry.member} is not a supported RunJS ctx root`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            member: entry.member,
          },
        }),
      );
    }
  });
}

function getCtxNonFunctionCallRepairHint(member: string) {
  if (member === 'collection') {
    return 'ctx.collection is collection metadata. For collection data, create a resource with ctx.makeResource(...) or use ctx.api.resource(...).';
  }
  if (member === 'record') {
    return "ctx.record is the current record value. Read ctx.record fields directly or use await ctx.getVar('ctx.record.id') for variable resolution.";
  }
  if (member === 'resource') {
    return 'ctx.resource is a resource instance. Call a resource method such as ctx.resource.refresh(...), ctx.resource.getData(), or create a local resource with ctx.makeResource(...).';
  }
  if (member === 'api') {
    return 'ctx.api is the API client object. Use ctx.api.request(...) or ctx.api.resource(...), not ctx.api(...).';
  }
  return `Read ctx.${member} as a value, or call one of its documented methods instead of calling ctx.${member}(...).`;
}

function collectSurfaceStyleErrors(
  path: string,
  source: string,
  scan: RunJsScanResult,
  surfaceStyle: RunJsAuthoringSurfaceStyle,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (surfaceStyle === 'value') {
    const render = scan.ctxRenderCalls[0];
    if (render) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'value-surface-forbids-render',
          message: `flowSurfaces authoring ${path} value RunJS must return a value and cannot call ctx.render(...)`,
          modelUse,
          surface,
          index: render.index,
          source,
        }),
      );
    }
    if (!scan.topLevelReturns.length) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'missing-top-level-return',
          message: `flowSurfaces authoring ${path} value RunJS must include a top-level return`,
          modelUse,
          surface,
          index: 0,
          source,
        }),
      );
    }
    return;
  }

  if (surfaceStyle !== 'render') {
    return;
  }

  if (scan.reactComponentCtxRenderCalls.length) {
    scan.reactComponentCtxRenderCalls.forEach((entry) => {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'react-runtime-contract-stop',
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          message: `flowSurfaces authoring ${path} React component ${entry.component} cannot call ctx.render(...) while React is rendering it; return JSX from ${entry.component} and keep ctx.render(<${entry.component} />) on the directly executed render path`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            component: entry.component,
          },
        }),
      );
    });
    return;
  }

  const firstTopLevelRender = scan.topLevelReachableCtxRenderCalls[0];
  const firstTopLevelReturn = scan.topLevelReturns[0];
  if (firstTopLevelRender && (!firstTopLevelReturn || firstTopLevelRender.index < firstTopLevelReturn.index)) {
    return;
  }
  if (firstTopLevelRender && firstTopLevelReturn && firstTopLevelReturn.index < firstTopLevelRender.index) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be reachable before any top-level return`,
        modelUse,
        surface,
        index: firstTopLevelRender.index,
        source,
      }),
    );
    return;
  }
  if (scan.directDomWrites[0]) {
    return;
  }
  if (scan.isTopLevelFunctionWrapper) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-top-level-function-wrapper',
        message: `flowSurfaces authoring ${path} render code cannot hide all render logic inside an uncalled top-level function`,
        modelUse,
        surface,
        index: scan.functionRanges[0]?.start || 0,
        source,
      }),
    );
    return;
  }
  if (scan.ctxRenderCalls.length) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be on the directly executed top-level path`,
        modelUse,
        surface,
        index: scan.ctxRenderCalls[0].index,
        source,
      }),
    );
    return;
  }
  errors.push(
    buildRunJsAuthoringError({
      path,
      repairClass: 'replace-innerhtml-with-render',
      ruleId: 'runjs-render-required',
      message: `flowSurfaces authoring ${path} render JS surfaces must call ctx.render(...) from reachable top-level code`,
      modelUse,
      surface,
      index: 0,
      source,
    }),
  );
}

function isAllowedCtxRoot(member: string, modelUse: string) {
  return (
    ALLOWED_CTX_ROOTS.has(member) ||
    Boolean(modelUse && RUNJS_CTX_NON_FUNCTION_ROOTS_BY_MODEL_USE[modelUse]?.has(member)) ||
    ((modelUse === 'ChartOptionModel' || modelUse === 'ChartEventsModel') && CHART_CTX_ROOTS.has(member))
  );
}

const createLegacyValidator = (
  id: string,
  collect: (runtime: RunJsInspectionRuntime, errors: FlowSurfaceErrorItemInput[]) => void,
): RunJsInspectionValidator => ({
  id,
  validate(runtime) {
    const errors: FlowSurfaceErrorItemInput[] = [];
    collect(runtime, errors);
    return errors;
  },
});

export const RUNJS_INSPECTION_VALIDATORS: RunJsInspectionValidator[] = [
  createLegacyValidator('nested-runjs', (runtime, errors) =>
    collectNestedRunJsErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
  createLegacyValidator('resource-api', (runtime, errors) =>
    collectResourceApiErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
  createLegacyValidator('resource-runtime', (runtime, errors) =>
    collectResourceRuntimeErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
  createLegacyValidator('dom-global', (runtime, errors) => {
    collectDirectDomErrors(runtime.input.path, runtime.source, runtime.scan, runtime.modelUse, runtime.surface, errors);
  }),
  createLegacyValidator('react-runtime', (runtime, errors) =>
    collectReactRuntimeErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
  createLegacyValidator('ctx-contract', (runtime, errors) =>
    collectCtxContractErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
  createLegacyValidator('surface-style', (runtime, errors) =>
    collectSurfaceStyleErrors(
      runtime.input.path,
      runtime.source,
      runtime.scan,
      runtime.surfaceStyle,
      runtime.modelUse,
      runtime.surface,
      errors,
    ),
  ),
];

export function collectRunJsInspectionErrors(runtime: RunJsInspectionRuntime) {
  return RUNJS_INSPECTION_VALIDATORS.flatMap((validator) => validator.validate(runtime));
}
