/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import type { RunJSSourceAdapterContext } from '@nocobase/server';
import { FlowSurfaceBadRequestError } from './errors';

export const JS_PAGE_MODEL_USE = 'JSPageModel';

export const FLOW_SURFACE_RUNJS_HOSTS = {
  JSPageModel: { hostKind: 'js-page', flowKey: 'jsSettings' },
  JSBlockModel: { hostKind: 'js-block', flowKey: 'jsSettings' },
  JSFieldModel: { hostKind: 'js-field', flowKey: 'jsSettings' },
  JSEditableFieldModel: { hostKind: 'js-editable-field', flowKey: 'jsSettings' },
  JSColumnModel: { hostKind: 'js-column', flowKey: 'jsSettings' },
  JSItemModel: { hostKind: 'js-item', flowKey: 'jsSettings' },
  JSItemActionModel: { hostKind: 'js-item-action', flowKey: 'jsSettings' },
  JSActionModel: { hostKind: 'js-action', flowKey: 'clickSettings' },
  JSRecordActionModel: { hostKind: 'js-record-action', flowKey: 'clickSettings' },
  JSCollectionActionModel: { hostKind: 'js-collection-action', flowKey: 'clickSettings' },
  JSFormActionModel: { hostKind: 'js-form-action', flowKey: 'clickSettings' },
  FilterFormJSActionModel: { hostKind: 'filter-form-js-action', flowKey: 'clickSettings' },
} as const;

export type FlowSurfaceRunJSModelUse = keyof typeof FLOW_SURFACE_RUNJS_HOSTS;
export type FlowSurfaceRunJSHostKind = (typeof FLOW_SURFACE_RUNJS_HOSTS)[FlowSurfaceRunJSModelUse]['hostKind'];
export type FlowSurfaceRunJSFlowKey = (typeof FLOW_SURFACE_RUNJS_HOSTS)[FlowSurfaceRunJSModelUse]['flowKey'];

export type FlowSurfaceRunJSLocator = {
  kind: 'flowModel.step';
  modelUid: string;
  flowKey: FlowSurfaceRunJSFlowKey;
  stepKey: 'runJs';
  paramPath: ['code'];
  versionPath: ['version'];
};

export type FlowSurfaceRunJSWorkspaceStatus = 'ready' | 'pending' | 'error';

export type FlowSurfaceRunJSWorkspaceError = {
  code: string;
  message: string;
};

export type FlowSurfaceRunJSWorkspaceBootstrapInput = {
  hostKind: FlowSurfaceRunJSHostKind;
  modelUse: FlowSurfaceRunJSModelUse;
  locator: FlowSurfaceRunJSLocator;
  transaction: Transaction;
  authoringContext: FlowSurfaceRunJSAuthoringContext;
};

export type FlowSurfaceRunJSAuthoringContext = Partial<
  Pick<RunJSSourceAdapterContext, 'userId' | 'request' | 'state' | 'currentUser' | 'timezone' | 'can'>
>;

export type FlowSurfaceRunJSWorkspaceBootstrapResult = {
  status: FlowSurfaceRunJSWorkspaceStatus;
  retryable: boolean;
  error?: FlowSurfaceRunJSWorkspaceError;
};

export type FlowSurfaceRunJSWorkspaceBootstrapPort = (
  input: FlowSurfaceRunJSWorkspaceBootstrapInput,
) => Promise<FlowSurfaceRunJSWorkspaceBootstrapResult>;

export type FlowSurfaceJSPageCapabilities = {
  tabs: false;
  blocks: false;
  compose: false;
  blueprint: false;
  export: false;
  runJSWorkspace: true;
};

const RUNJS_WORKSPACE_BOOTSTRAP_PORT = Symbol.for(
  '@nocobase/plugin-flow-engine/flow-surface-runjs-workspace-bootstrap-port',
);

type FlowSurfaceRunJSWorkspaceBootstrapApp = object & {
  [RUNJS_WORKSPACE_BOOTSTRAP_PORT]?: FlowSurfaceRunJSWorkspaceBootstrapPort;
};

export function resolveFlowSurfaceRunJSHost(modelUse: unknown) {
  const normalizedUse = String(modelUse || '').trim() as FlowSurfaceRunJSModelUse;
  return FLOW_SURFACE_RUNJS_HOSTS[normalizedUse];
}

export function buildFlowSurfaceRunJSLocator(
  modelUid: string,
  modelUse: FlowSurfaceRunJSModelUse = 'JSBlockModel',
): FlowSurfaceRunJSLocator {
  const host = FLOW_SURFACE_RUNJS_HOSTS[modelUse];
  return {
    kind: 'flowModel.step',
    modelUid,
    flowKey: host.flowKey,
    stepKey: 'runJs',
    paramPath: ['code'],
    versionPath: ['version'],
  };
}

export function getFlowSurfaceRunJSWorkspaceProviderStatus(app: object): FlowSurfaceRunJSWorkspaceBootstrapResult {
  const port = (app as FlowSurfaceRunJSWorkspaceBootstrapApp)[RUNJS_WORKSPACE_BOOTSTRAP_PORT];
  if (port) {
    return { status: 'ready', retryable: false };
  }
  return buildProviderUnavailableResult();
}

export function buildFlowSurfaceJSPageCapabilities(): FlowSurfaceJSPageCapabilities {
  return {
    tabs: false,
    blocks: false,
    compose: false,
    blueprint: false,
    export: false,
    runJSWorkspace: true,
  };
}

export function registerFlowSurfaceRunJSWorkspaceBootstrapPort(
  app: object,
  port: FlowSurfaceRunJSWorkspaceBootstrapPort,
) {
  const bootstrapApp = app as FlowSurfaceRunJSWorkspaceBootstrapApp;
  bootstrapApp[RUNJS_WORKSPACE_BOOTSTRAP_PORT] = port;
  return () => {
    if (bootstrapApp[RUNJS_WORKSPACE_BOOTSTRAP_PORT] === port) {
      delete bootstrapApp[RUNJS_WORKSPACE_BOOTSTRAP_PORT];
    }
  };
}

export async function bootstrapFlowSurfaceRunJSWorkspace(
  app: object,
  input: FlowSurfaceRunJSWorkspaceBootstrapInput,
): Promise<FlowSurfaceRunJSWorkspaceBootstrapResult> {
  const port = (app as FlowSurfaceRunJSWorkspaceBootstrapApp)[RUNJS_WORKSPACE_BOOTSTRAP_PORT];
  if (!port) {
    return buildProviderUnavailableResult();
  }
  return port(input);
}

function buildProviderUnavailableResult(): FlowSurfaceRunJSWorkspaceBootstrapResult {
  return {
    status: 'pending',
    retryable: true,
    error: {
      code: 'FLOW_SURFACE_RUNJS_BOOTSTRAP_PROVIDER_UNAVAILABLE',
      message: 'RunJS workspace bootstrap provider is unavailable',
    },
  };
}

export function isRouteBackedPageUse(use?: string) {
  return use === 'RootPageModel' || use === JS_PAGE_MODEL_USE;
}

export function supportsPageTabs(use?: string) {
  return use === 'RootPageModel';
}

export function supportsPageBlockAuthoring(use?: string) {
  return use === 'RootPageModel';
}

export function supportsStandardPageBlueprint(use?: string) {
  return use === 'RootPageModel';
}

export function throwJSPageOperationUnsupported(action: string, use = JS_PAGE_MODEL_USE): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces ${action} does not support JS page surfaces`,
    'FLOW_SURFACE_JS_PAGE_OPERATION_UNSUPPORTED',
    {
      details: {
        action,
        pageUse: use,
      },
    },
  );
}
