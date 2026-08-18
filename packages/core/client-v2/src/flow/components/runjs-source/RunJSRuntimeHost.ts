/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSRuntimeHostPort } from '@nocobase/runjs/client';

export type {
  NormalizeJsTemplateSelectionInput,
  RunJSSettingsDescriptorLike,
  RunJSSettingsRecord,
  RunJSSettingsValidationIssue,
  RunJSSettingsValidationMode,
  RunJSSettingsValidationResult,
} from '@nocobase/runjs/client';
export type { RunJSRuntimeErrorInfo as RunJSRuntimeError } from '@nocobase/runjs/client';

export type RunJSRuntimeHost = RunJSRuntimeHostPort;

const hosts: RunJSRuntimeHost[] = [];

export function registerRunJSRuntimeHost(host: RunJSRuntimeHost): () => void {
  hosts.push(host);
  let registered = true;
  return () => {
    if (!registered) {
      return;
    }
    registered = false;
    const index = hosts.lastIndexOf(host);
    if (index >= 0) {
      hosts.splice(index, 1);
    }
  };
}

export function getRunJSRuntimeHost(): RunJSRuntimeHost {
  const host = hosts.at(-1);
  if (!host) {
    throw new Error('RunJS client runtime is not installed');
  }
  return host;
}

export function clearRunJSRuntimeHosts(): void {
  hosts.length = 0;
}

export const getCanonicalRunJSSettings: RunJSRuntimeHost['getCanonicalRunJSSettings'] = (...args) =>
  getRunJSRuntimeHost().getCanonicalRunJSSettings(...args);

export const getJsTemplateId: RunJSRuntimeHost['getJsTemplateId'] = (...args) =>
  getRunJSRuntimeHost().getJsTemplateId(...args);

export const getJsTemplateSettingStepKey: RunJSRuntimeHost['getJsTemplateSettingStepKey'] = (...args) =>
  getRunJSRuntimeHost().getJsTemplateSettingStepKey(...args);

export const isSettingsFieldVisible: RunJSRuntimeHost['isSettingsFieldVisible'] = (...args) =>
  getRunJSRuntimeHost().isSettingsFieldVisible(...args);

export const normalizeJsTemplateSelection: RunJSRuntimeHost['normalizeJsTemplateSelection'] = (...args) =>
  getRunJSRuntimeHost().normalizeJsTemplateSelection(...args);

export const normalizeJsTemplateSettings: RunJSRuntimeHost['normalizeJsTemplateSettings'] = (...args) =>
  getRunJSRuntimeHost().normalizeJsTemplateSettings(...args);

export const setJsTemplateTopLevelSetting: RunJSRuntimeHost['setJsTemplateTopLevelSetting'] = (...args) =>
  getRunJSRuntimeHost().setJsTemplateTopLevelSetting(...args);
