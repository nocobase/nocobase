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

export type FlowSurfaceRunJSLocator = {
  kind: 'flowModel.step';
  modelUid: string;
  flowKey: 'jsSettings';
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
  hostKind: 'js-page' | 'js-block';
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

export function buildFlowSurfaceRunJSLocator(modelUid: string): FlowSurfaceRunJSLocator {
  return {
    kind: 'flowModel.step',
    modelUid,
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
    versionPath: ['version'],
  };
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
    return {
      status: 'pending',
      retryable: true,
      error: {
        code: 'FLOW_SURFACE_RUNJS_BOOTSTRAP_PROVIDER_UNAVAILABLE',
        message: 'RunJS workspace bootstrap provider is unavailable',
      },
    };
  }
  return port(input);
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
