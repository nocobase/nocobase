/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateKind } from '../constants';
import type { JsTemplateSaveSourceResult, SaveAsJsTemplateDestination } from './types';

export interface JsTemplateCatalogAddTemplateInput {
  destination: Extract<SaveAsJsTemplateDestination, { type: 'existing' }>;
  expectedHeadCommitId: string | null;
  kind: JsTemplateKind;
  templateName: string;
  title: string;
  description?: string | null;
}

export type JsTemplateCatalogAddTemplateResult = JsTemplateSaveSourceResult;
