/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateCreateJobSummary, JsTemplateProject } from '../../../shared/types';

export interface CreateProjectFormValues {
  name: string;
  title: string;
  description?: string;
}

export interface EditProjectFormValues {
  title: string;
  description?: string;
}

export type JsTemplateListRow =
  | { rowType: 'project'; project: JsTemplateProject }
  | { rowType: 'creation-job'; job: JsTemplateCreateJobSummary };

export type JsTemplateListTranslate = (key: string) => string;
export type ToggleLifecycleStatus = 'enabled' | 'disabled';
