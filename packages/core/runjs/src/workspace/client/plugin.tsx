/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { LegacyRunJSEditorRegistry } from './runjs-studio/contract';
import { legacyRunJSStudioProvider } from './runjs-studio/LegacyRunJSStudioProvider';
import {
  installRunJSWorkspaceAuthoringClientV2,
  installRunJSStudioClientV2,
  installRunJSWorkspaceRuntimeClientV2,
  installRunJSWorkspaceClientV2,
  type RunJSWorkspaceClientApplication,
} from '../client-v2/plugin';

export function installRunJSWorkspaceRuntimeLegacyClient(): () => void {
  return installRunJSWorkspaceRuntimeClientV2();
}

export function installRunJSWorkspaceAuthoringLegacyClient(app: RunJSWorkspaceClientApplication): () => void {
  const disposeClientV2 = installRunJSWorkspaceAuthoringClientV2(app);
  let disposeLegacy: (() => void) | undefined;
  try {
    disposeLegacy = LegacyRunJSEditorRegistry.registerProvider({ ...legacyRunJSStudioProvider });
  } catch (error) {
    disposeClientV2();
    throw error;
  }

  return () => {
    disposeLegacy?.();
    disposeClientV2();
  };
}

export function installLegacyRunJSStudioClient(app?: RunJSWorkspaceClientApplication): () => void {
  const disposeClientV2 = app ? installRunJSWorkspaceClientV2(app) : installRunJSStudioClientV2();
  let disposeLegacy: (() => void) | undefined;
  try {
    disposeLegacy = LegacyRunJSEditorRegistry.registerProvider({ ...legacyRunJSStudioProvider });
  } catch (error) {
    disposeClientV2();
    throw error;
  }

  return () => {
    disposeLegacy?.();
    disposeClientV2();
  };
}

export function installRunJSWorkspaceLegacyClient(app: RunJSWorkspaceClientApplication): () => void {
  const disposeRuntime = installRunJSWorkspaceRuntimeLegacyClient();
  let disposeAuthoring: (() => void) | undefined;
  try {
    disposeAuthoring = installRunJSWorkspaceAuthoringLegacyClient(app);
  } catch (error) {
    disposeRuntime();
    throw error;
  }

  return () => {
    disposeAuthoring?.();
    disposeRuntime();
  };
}
