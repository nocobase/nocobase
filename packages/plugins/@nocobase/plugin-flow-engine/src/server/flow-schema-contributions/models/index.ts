/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { actionModelSchemaContribution } from './ActionModel';
import { addChildActionModelInternalSchemaContribution } from './AddChildActionModel';
import { addNewActionModelInternalSchemaContribution } from './AddNewActionModel';
import { assignFormItemModelInternalSchemaContribution } from './AssignFormItemModel';
import { assignFormGridModelInternalSchemaContribution } from './AssignFormGridModel';
import { assignFormModelInternalSchemaContribution } from './AssignFormModel';
import { basePageTabModelInternalSchemaContribution } from './BasePageTabModel';
import { blockGridModelInternalSchemaContribution } from './BlockGridModel';
import { bulkDeleteActionModelInternalSchemaContribution } from './BulkDeleteActionModel';
import { childPageModelInternalSchemaContribution } from './ChildPageModel';
import { childPageTabModelInternalSchemaContribution } from './ChildPageTabModel';
import { createFormModelSchemaContribution } from './CreateFormModel';
import { deleteActionModelInternalSchemaContribution } from './DeleteActionModel';
import { detailsBlockModelSchemaContribution } from './DetailsBlockModel';
import { detailsGridModelInternalSchemaContribution } from './DetailsGridModel';
import { detailsItemModelInternalSchemaContribution } from './DetailsItemModel';
import { editActionModelInternalSchemaContribution } from './EditActionModel';
import { expandCollapseActionModelInternalSchemaContribution } from './ExpandCollapseActionModel';
import { editFormModelSchemaContribution } from './EditFormModel';
import { filterActionModelInternalSchemaContribution } from './FilterActionModel';
import { filterFormBlockModelSchemaContribution } from './FilterFormBlockModel';
import { filterFormCollapseActionModelInternalSchemaContribution } from './FilterFormCollapseActionModel';
import { filterFormCustomFieldModelInternalSchemaContribution } from './FilterFormCustomFieldModel';
import { filterFormGridModelInternalSchemaContribution } from './FilterFormGridModel';
import { filterFormItemModelInternalSchemaContribution } from './FilterFormItemModel';
import { filterFormJsActionModelInternalSchemaContribution } from './FilterFormJSActionModel';
import { filterFormResetActionModelInternalSchemaContribution } from './FilterFormResetActionModel';
import { filterFormSubmitActionModelInternalSchemaContribution } from './FilterFormSubmitActionModel';
import { formBlockModelInternalSchemaContribution } from './FormBlockModel';
import { formAssociationItemModelInternalSchemaContribution } from './FormAssociationItemModel';
import { formGridModelInternalSchemaContribution } from './FormGridModel';
import { jsActionModelInternalSchemaContribution } from './JSActionModel';
import { jsBlockModelSchemaContribution } from './JSBlockModel';
import { jsCollectionActionModelInternalSchemaContribution } from './JSCollectionActionModel';
import { jsFormActionModelInternalSchemaContribution } from './JSFormActionModel';
import { jsItemModelInternalSchemaContribution } from './JSItemModel';
import { formItemModelInternalSchemaContribution } from './FormItemModel';
import { jsRecordActionModelInternalSchemaContribution } from './JSRecordActionModel';
import { formSubmitActionModelInternalSchemaContribution } from './FormSubmitActionModel';
import { jsColumnModelInternalSchemaContribution } from './JSColumnModel';
import { linkActionModelInternalSchemaContribution } from './LinkActionModel';
import { pageModelSchemaContribution } from './PageModel';
import { pageTabModelInternalSchemaContribution } from './PageTabModel';
import { popupActionModelInternalSchemaContribution } from './PopupActionModel';
import { popupCollectionActionModelInternalSchemaContribution } from './PopupCollectionActionModel';
import { refreshActionModelInternalSchemaContribution } from './RefreshActionModel';
import { rootPageModelSchemaContribution } from './RootPageModel';
import { rootPageTabModelInternalSchemaContribution } from './RootPageTabModel';
import { routeModelSchemaContribution } from './RouteModel';
import { tableActionsColumnModelInternalSchemaContribution } from './TableActionsColumnModel';
import { tableBlockModelSchemaContribution } from './TableBlockModel';
import { tableColumnModelInternalSchemaContribution } from './TableColumnModel';
import { tableCustomColumnModelInternalSchemaContribution } from './TableCustomColumnModel';
import { updateRecordActionModelSchemaContribution } from './UpdateRecordActionModel';
import { viewActionModelInternalSchemaContribution } from './ViewActionModel';

export {
  actionModelSchemaContribution,
  addChildActionModelInternalSchemaContribution,
  addNewActionModelInternalSchemaContribution,
  assignFormItemModelInternalSchemaContribution,
  assignFormGridModelInternalSchemaContribution,
  assignFormModelInternalSchemaContribution,
  basePageTabModelInternalSchemaContribution,
  blockGridModelInternalSchemaContribution,
  bulkDeleteActionModelInternalSchemaContribution,
  childPageModelInternalSchemaContribution,
  childPageTabModelInternalSchemaContribution,
  createFormModelSchemaContribution,
  deleteActionModelInternalSchemaContribution,
  detailsBlockModelSchemaContribution,
  detailsGridModelInternalSchemaContribution,
  detailsItemModelInternalSchemaContribution,
  editActionModelInternalSchemaContribution,
  expandCollapseActionModelInternalSchemaContribution,
  editFormModelSchemaContribution,
  filterActionModelInternalSchemaContribution,
  filterFormBlockModelSchemaContribution,
  filterFormCollapseActionModelInternalSchemaContribution,
  filterFormCustomFieldModelInternalSchemaContribution,
  filterFormGridModelInternalSchemaContribution,
  filterFormItemModelInternalSchemaContribution,
  filterFormJsActionModelInternalSchemaContribution,
  filterFormResetActionModelInternalSchemaContribution,
  filterFormSubmitActionModelInternalSchemaContribution,
  formBlockModelInternalSchemaContribution,
  formAssociationItemModelInternalSchemaContribution,
  formGridModelInternalSchemaContribution,
  jsActionModelInternalSchemaContribution,
  jsBlockModelSchemaContribution,
  jsCollectionActionModelInternalSchemaContribution,
  jsFormActionModelInternalSchemaContribution,
  jsItemModelInternalSchemaContribution,
  formItemModelInternalSchemaContribution,
  jsRecordActionModelInternalSchemaContribution,
  formSubmitActionModelInternalSchemaContribution,
  jsColumnModelInternalSchemaContribution,
  linkActionModelInternalSchemaContribution,
  pageModelSchemaContribution,
  pageTabModelInternalSchemaContribution,
  popupActionModelInternalSchemaContribution,
  popupCollectionActionModelInternalSchemaContribution,
  refreshActionModelInternalSchemaContribution,
  rootPageModelSchemaContribution,
  rootPageTabModelInternalSchemaContribution,
  routeModelSchemaContribution,
  tableActionsColumnModelInternalSchemaContribution,
  tableBlockModelSchemaContribution,
  tableColumnModelInternalSchemaContribution,
  tableCustomColumnModelInternalSchemaContribution,
  updateRecordActionModelSchemaContribution,
  viewActionModelInternalSchemaContribution,
};

export const flowSchemaModelContributions: FlowModelSchemaContribution[] = [
  routeModelSchemaContribution,
  actionModelSchemaContribution,
  updateRecordActionModelSchemaContribution,
  addNewActionModelInternalSchemaContribution,
  bulkDeleteActionModelInternalSchemaContribution,
  expandCollapseActionModelInternalSchemaContribution,
  filterActionModelInternalSchemaContribution,
  jsActionModelInternalSchemaContribution,
  jsCollectionActionModelInternalSchemaContribution,
  linkActionModelInternalSchemaContribution,
  popupActionModelInternalSchemaContribution,
  popupCollectionActionModelInternalSchemaContribution,
  refreshActionModelInternalSchemaContribution,
  addChildActionModelInternalSchemaContribution,
  deleteActionModelInternalSchemaContribution,
  editActionModelInternalSchemaContribution,
  jsRecordActionModelInternalSchemaContribution,
  viewActionModelInternalSchemaContribution,
  formSubmitActionModelInternalSchemaContribution,
  jsFormActionModelInternalSchemaContribution,
  filterFormSubmitActionModelInternalSchemaContribution,
  filterFormResetActionModelInternalSchemaContribution,
  filterFormCollapseActionModelInternalSchemaContribution,
  filterFormJsActionModelInternalSchemaContribution,
  assignFormItemModelInternalSchemaContribution,
  assignFormGridModelInternalSchemaContribution,
  assignFormModelInternalSchemaContribution,
  jsItemModelInternalSchemaContribution,
  formItemModelInternalSchemaContribution,
  formAssociationItemModelInternalSchemaContribution,
  formGridModelInternalSchemaContribution,
  jsBlockModelSchemaContribution,
  createFormModelSchemaContribution,
  editFormModelSchemaContribution,
  basePageTabModelInternalSchemaContribution,
  pageTabModelInternalSchemaContribution,
  rootPageTabModelInternalSchemaContribution,
  rootPageModelSchemaContribution,
  blockGridModelInternalSchemaContribution,
  childPageModelInternalSchemaContribution,
  childPageTabModelInternalSchemaContribution,
  tableCustomColumnModelInternalSchemaContribution,
  tableColumnModelInternalSchemaContribution,
  tableActionsColumnModelInternalSchemaContribution,
  jsColumnModelInternalSchemaContribution,
  detailsItemModelInternalSchemaContribution,
  detailsGridModelInternalSchemaContribution,
  detailsBlockModelSchemaContribution,
  filterFormItemModelInternalSchemaContribution,
  filterFormCustomFieldModelInternalSchemaContribution,
  filterFormGridModelInternalSchemaContribution,
  filterFormBlockModelSchemaContribution,
  formBlockModelInternalSchemaContribution,
  tableBlockModelSchemaContribution,
  pageModelSchemaContribution,
];
