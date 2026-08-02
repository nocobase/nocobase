/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionCreateJobSummary, LightExtensionRepoRecord } from '../../../shared/types';

export interface CreateRepoFormValues {
  name: string;
  title: string;
  description?: string;
}

export interface EditRepoFormValues {
  title: string;
  description?: string;
}

export type LightExtensionListRow =
  | { rowType: 'repo'; repo: LightExtensionRepoRecord }
  | { rowType: 'creation-job'; job: LightExtensionCreateJobSummary };

export type LightExtensionListTranslate = (key: string) => string;
export type ToggleLifecycleStatus = 'enabled' | 'disabled';
