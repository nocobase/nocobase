/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionDataContext, LightExtensionRecord } from '../shared';

export type { LightExtensionDataContext, LightExtensionRecord, LightExtensionSettingsContext } from '../shared';
export { assertSettings, defineSettings } from '../shared';

export interface JSBlockContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> {
  element?: HTMLElement | null;
  render?: (node: unknown) => void;
  i18n?: {
    t: (key: string, options?: Record<string, unknown>) => string;
  };
}

export interface JSPageRuntimeFacade {
  readonly uid: string;
  readonly active: boolean;
  refresh(): Promise<void>;
  setDocumentTitle(title: string): void;
}

export interface JSPageContext<TSettings = unknown> extends JSBlockContext<TSettings> {
  page: JSPageRuntimeFacade;
}

export interface JSFieldContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> {
  value?: TValue;
}

export interface JSActionContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> {
  event?: unknown;
  formValues?: LightExtensionRecord;
}

export interface JSItemContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> {
  value?: TValue;
}

export interface RunJSContext<TSettings = unknown, TInput = unknown> extends LightExtensionDataContext<TSettings> {
  input?: TInput;
  event?: unknown;
  formValues?: LightExtensionRecord;
}
