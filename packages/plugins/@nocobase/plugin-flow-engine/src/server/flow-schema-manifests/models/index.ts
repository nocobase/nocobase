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
import { assignFormGridModelInternalSchemaManifest } from './AssignFormGridModel';
import { assignFormModelInternalSchemaManifest } from './AssignFormModel';
import { blockGridModelInternalSchemaManifest } from './BlockGridModel';
import { createFormModelSchemaManifest } from './CreateFormModel';
import { detailsBlockModelSchemaManifest } from './DetailsBlockModel';
import { detailsGridModelInternalSchemaManifest } from './DetailsGridModel';
import { editFormModelSchemaManifest } from './EditFormModel';
import { filterFormBlockModelSchemaManifest } from './FilterFormBlockModel';
import { filterFormGridModelInternalSchemaManifest } from './FilterFormGridModel';
import { formBlockModelInternalSchemaManifest } from './FormBlockModel';
import { pageModelSchemaManifest } from './PageModel';
import { rootPageModelSchemaManifest } from './RootPageModel';
import { rootPageTabModelInternalSchemaManifest } from './RootPageTabModel';
import { routeModelSchemaManifest } from './RouteModel';
import { tableBlockModelSchemaManifest } from './TableBlockModel';
import { updateRecordActionModelSchemaManifest } from './UpdateRecordActionModel';

export {
  actionModelSchemaManifest,
  assignFormGridModelInternalSchemaManifest,
  assignFormModelInternalSchemaManifest,
  blockGridModelInternalSchemaManifest,
  createFormModelSchemaManifest,
  detailsBlockModelSchemaManifest,
  detailsGridModelInternalSchemaManifest,
  editFormModelSchemaManifest,
  filterFormBlockModelSchemaManifest,
  filterFormGridModelInternalSchemaManifest,
  formBlockModelInternalSchemaManifest,
  pageModelSchemaManifest,
  rootPageModelSchemaManifest,
  rootPageTabModelInternalSchemaManifest,
  routeModelSchemaManifest,
  tableBlockModelSchemaManifest,
  updateRecordActionModelSchemaManifest,
};

export const flowSchemaModelManifests: FlowModelSchemaManifest[] = [
  routeModelSchemaManifest,
  actionModelSchemaManifest,
  updateRecordActionModelSchemaManifest,
  assignFormGridModelInternalSchemaManifest,
  assignFormModelInternalSchemaManifest,
  createFormModelSchemaManifest,
  editFormModelSchemaManifest,
  rootPageTabModelInternalSchemaManifest,
  rootPageModelSchemaManifest,
  blockGridModelInternalSchemaManifest,
  detailsGridModelInternalSchemaManifest,
  detailsBlockModelSchemaManifest,
  filterFormGridModelInternalSchemaManifest,
  filterFormBlockModelSchemaManifest,
  formBlockModelInternalSchemaManifest,
  tableBlockModelSchemaManifest,
  pageModelSchemaManifest,
];
