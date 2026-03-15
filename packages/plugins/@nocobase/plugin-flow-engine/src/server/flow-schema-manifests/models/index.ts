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
import { addChildActionModelInternalSchemaManifest } from './AddChildActionModel';
import { addNewActionModelInternalSchemaManifest } from './AddNewActionModel';
import { assignFormItemModelInternalSchemaManifest } from './AssignFormItemModel';
import { assignFormGridModelInternalSchemaManifest } from './AssignFormGridModel';
import { assignFormModelInternalSchemaManifest } from './AssignFormModel';
import { basePageTabModelInternalSchemaManifest } from './BasePageTabModel';
import { blockGridModelInternalSchemaManifest } from './BlockGridModel';
import { bulkDeleteActionModelInternalSchemaManifest } from './BulkDeleteActionModel';
import { createFormModelSchemaManifest } from './CreateFormModel';
import { deleteActionModelInternalSchemaManifest } from './DeleteActionModel';
import { detailsBlockModelSchemaManifest } from './DetailsBlockModel';
import { detailsGridModelInternalSchemaManifest } from './DetailsGridModel';
import { detailsItemModelInternalSchemaManifest } from './DetailsItemModel';
import { editActionModelInternalSchemaManifest } from './EditActionModel';
import { expandCollapseActionModelInternalSchemaManifest } from './ExpandCollapseActionModel';
import { editFormModelSchemaManifest } from './EditFormModel';
import { filterActionModelInternalSchemaManifest } from './FilterActionModel';
import { filterFormBlockModelSchemaManifest } from './FilterFormBlockModel';
import { filterFormCollapseActionModelInternalSchemaManifest } from './FilterFormCollapseActionModel';
import { filterFormCustomFieldModelInternalSchemaManifest } from './FilterFormCustomFieldModel';
import { filterFormGridModelInternalSchemaManifest } from './FilterFormGridModel';
import { filterFormItemModelInternalSchemaManifest } from './FilterFormItemModel';
import { filterFormJsActionModelInternalSchemaManifest } from './FilterFormJSActionModel';
import { filterFormResetActionModelInternalSchemaManifest } from './FilterFormResetActionModel';
import { filterFormSubmitActionModelInternalSchemaManifest } from './FilterFormSubmitActionModel';
import { formBlockModelInternalSchemaManifest } from './FormBlockModel';
import { formAssociationItemModelInternalSchemaManifest } from './FormAssociationItemModel';
import { formGridModelInternalSchemaManifest } from './FormGridModel';
import { jsCollectionActionModelInternalSchemaManifest } from './JSCollectionActionModel';
import { jsFormActionModelInternalSchemaManifest } from './JSFormActionModel';
import { formItemModelInternalSchemaManifest } from './FormItemModel';
import { jsRecordActionModelInternalSchemaManifest } from './JSRecordActionModel';
import { formSubmitActionModelInternalSchemaManifest } from './FormSubmitActionModel';
import { jsColumnModelInternalSchemaManifest } from './JSColumnModel';
import { linkActionModelInternalSchemaManifest } from './LinkActionModel';
import { pageModelSchemaManifest } from './PageModel';
import { pageTabModelInternalSchemaManifest } from './PageTabModel';
import { popupCollectionActionModelInternalSchemaManifest } from './PopupCollectionActionModel';
import { refreshActionModelInternalSchemaManifest } from './RefreshActionModel';
import { rootPageModelSchemaManifest } from './RootPageModel';
import { rootPageTabModelInternalSchemaManifest } from './RootPageTabModel';
import { routeModelSchemaManifest } from './RouteModel';
import { tableActionsColumnModelInternalSchemaManifest } from './TableActionsColumnModel';
import { tableBlockModelSchemaManifest } from './TableBlockModel';
import { tableColumnModelInternalSchemaManifest } from './TableColumnModel';
import { tableCustomColumnModelInternalSchemaManifest } from './TableCustomColumnModel';
import { updateRecordActionModelSchemaManifest } from './UpdateRecordActionModel';
import { viewActionModelInternalSchemaManifest } from './ViewActionModel';

export {
  actionModelSchemaManifest,
  addChildActionModelInternalSchemaManifest,
  addNewActionModelInternalSchemaManifest,
  assignFormItemModelInternalSchemaManifest,
  assignFormGridModelInternalSchemaManifest,
  assignFormModelInternalSchemaManifest,
  basePageTabModelInternalSchemaManifest,
  blockGridModelInternalSchemaManifest,
  bulkDeleteActionModelInternalSchemaManifest,
  createFormModelSchemaManifest,
  deleteActionModelInternalSchemaManifest,
  detailsBlockModelSchemaManifest,
  detailsGridModelInternalSchemaManifest,
  detailsItemModelInternalSchemaManifest,
  editActionModelInternalSchemaManifest,
  expandCollapseActionModelInternalSchemaManifest,
  editFormModelSchemaManifest,
  filterActionModelInternalSchemaManifest,
  filterFormBlockModelSchemaManifest,
  filterFormCollapseActionModelInternalSchemaManifest,
  filterFormCustomFieldModelInternalSchemaManifest,
  filterFormGridModelInternalSchemaManifest,
  filterFormItemModelInternalSchemaManifest,
  filterFormJsActionModelInternalSchemaManifest,
  filterFormResetActionModelInternalSchemaManifest,
  filterFormSubmitActionModelInternalSchemaManifest,
  formBlockModelInternalSchemaManifest,
  formAssociationItemModelInternalSchemaManifest,
  formGridModelInternalSchemaManifest,
  jsCollectionActionModelInternalSchemaManifest,
  jsFormActionModelInternalSchemaManifest,
  formItemModelInternalSchemaManifest,
  jsRecordActionModelInternalSchemaManifest,
  formSubmitActionModelInternalSchemaManifest,
  jsColumnModelInternalSchemaManifest,
  linkActionModelInternalSchemaManifest,
  pageModelSchemaManifest,
  pageTabModelInternalSchemaManifest,
  popupCollectionActionModelInternalSchemaManifest,
  refreshActionModelInternalSchemaManifest,
  rootPageModelSchemaManifest,
  rootPageTabModelInternalSchemaManifest,
  routeModelSchemaManifest,
  tableActionsColumnModelInternalSchemaManifest,
  tableBlockModelSchemaManifest,
  tableColumnModelInternalSchemaManifest,
  tableCustomColumnModelInternalSchemaManifest,
  updateRecordActionModelSchemaManifest,
  viewActionModelInternalSchemaManifest,
};

export const flowSchemaModelManifests: FlowModelSchemaManifest[] = [
  routeModelSchemaManifest,
  actionModelSchemaManifest,
  updateRecordActionModelSchemaManifest,
  addNewActionModelInternalSchemaManifest,
  bulkDeleteActionModelInternalSchemaManifest,
  expandCollapseActionModelInternalSchemaManifest,
  filterActionModelInternalSchemaManifest,
  jsCollectionActionModelInternalSchemaManifest,
  linkActionModelInternalSchemaManifest,
  popupCollectionActionModelInternalSchemaManifest,
  refreshActionModelInternalSchemaManifest,
  addChildActionModelInternalSchemaManifest,
  deleteActionModelInternalSchemaManifest,
  editActionModelInternalSchemaManifest,
  jsRecordActionModelInternalSchemaManifest,
  viewActionModelInternalSchemaManifest,
  formSubmitActionModelInternalSchemaManifest,
  jsFormActionModelInternalSchemaManifest,
  filterFormSubmitActionModelInternalSchemaManifest,
  filterFormResetActionModelInternalSchemaManifest,
  filterFormCollapseActionModelInternalSchemaManifest,
  filterFormJsActionModelInternalSchemaManifest,
  assignFormItemModelInternalSchemaManifest,
  assignFormGridModelInternalSchemaManifest,
  assignFormModelInternalSchemaManifest,
  formItemModelInternalSchemaManifest,
  formAssociationItemModelInternalSchemaManifest,
  formGridModelInternalSchemaManifest,
  createFormModelSchemaManifest,
  editFormModelSchemaManifest,
  basePageTabModelInternalSchemaManifest,
  pageTabModelInternalSchemaManifest,
  rootPageTabModelInternalSchemaManifest,
  rootPageModelSchemaManifest,
  blockGridModelInternalSchemaManifest,
  tableCustomColumnModelInternalSchemaManifest,
  tableColumnModelInternalSchemaManifest,
  tableActionsColumnModelInternalSchemaManifest,
  jsColumnModelInternalSchemaManifest,
  detailsItemModelInternalSchemaManifest,
  detailsGridModelInternalSchemaManifest,
  detailsBlockModelSchemaManifest,
  filterFormItemModelInternalSchemaManifest,
  filterFormCustomFieldModelInternalSchemaManifest,
  filterFormGridModelInternalSchemaManifest,
  filterFormBlockModelSchemaManifest,
  formBlockModelInternalSchemaManifest,
  tableBlockModelSchemaManifest,
  pageModelSchemaManifest,
];
