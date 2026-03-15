/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { actionModelSchemaManifest } from './ActionModel';
import { createFormModelSchemaManifest } from './CreateFormModel';
import { editFormModelSchemaManifest } from './EditFormModel';
import { formBlockModelInternalSchemaManifest } from './FormBlockModel';
import { pageModelSchemaManifest } from './PageModel';
import { tableBlockModelSchemaManifest } from './TableBlockModel';

export {
  actionModelSchemaManifest,
  createFormModelSchemaManifest,
  editFormModelSchemaManifest,
  formBlockModelInternalSchemaManifest,
  pageModelSchemaManifest,
  tableBlockModelSchemaManifest,
};

export const flowSchemaModelManifests: FlowModelSchemaManifest[] = [
  actionModelSchemaManifest,
  createFormModelSchemaManifest,
  editFormModelSchemaManifest,
  formBlockModelInternalSchemaManifest,
  tableBlockModelSchemaManifest,
  pageModelSchemaManifest,
];
