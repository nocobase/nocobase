/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';
import { flowSchemaContribution as actionBulkEditFlowSchemaContribution } from './ActionBulkEditModel';
import { flowSchemaContribution as actionBulkUpdateFlowSchemaContribution } from './ActionBulkUpdateModel';
import { flowSchemaContribution as actionCustomRequestFlowSchemaContribution } from './ActionCustomRequestModel';
import { actionModelSchemaContribution } from './ActionModel';
import { flowSchemaContribution as actionDuplicateFlowSchemaContribution } from './ActionDuplicateModel';
import { flowSchemaContribution as actionExportFlowSchemaContribution } from './ActionExportModel';
import { flowSchemaContribution as actionImportFlowSchemaContribution } from './ActionImportModel';
import { addChildActionModelInternalSchemaContribution } from './AddChildActionModel';
import { addNewActionModelInternalSchemaContribution } from './AddNewActionModel';
import { assignFormItemModelInternalSchemaContribution } from './AssignFormItemModel';
import { assignFormGridModelInternalSchemaContribution } from './AssignFormGridModel';
import { assignFormModelInternalSchemaContribution } from './AssignFormModel';
import { basePageTabModelInternalSchemaContribution } from './BasePageTabModel';
import { flowSchemaContribution as blockGridCardFlowSchemaContribution } from './BlockGridCardModel';
import { blockGridModelInternalSchemaContribution } from './BlockGridModel';
import { flowSchemaContribution as blockIframeFlowSchemaContribution } from './BlockIframeModel';
import { flowSchemaContribution as blockListFlowSchemaContribution } from './BlockListModel';
import { flowSchemaContribution as blockMarkdownFlowSchemaContribution } from './BlockMarkdownModel';
import { flowSchemaContribution as blockWorkbenchFlowSchemaContribution } from './BlockWorkbenchModel';
import { bulkDeleteActionModelInternalSchemaContribution } from './BulkDeleteActionModel';
import { childPageModelInternalSchemaContribution } from './ChildPageModel';
import { childPageTabModelInternalSchemaContribution } from './ChildPageTabModel';
import { flowSchemaContribution as commentsFlowSchemaContribution } from './CommentsModel';
import { createFormModelSchemaContribution } from './CreateFormModel';
import { flowSchemaContribution as dataVisualizationFlowSchemaContribution } from './DataVisualizationModel';
import { deleteActionModelInternalSchemaContribution } from './DeleteActionModel';
import { detailsBlockModelSchemaContribution } from './DetailsBlockModel';
import { detailsGridModelInternalSchemaContribution } from './DetailsGridModel';
import { detailsItemModelInternalSchemaContribution } from './DetailsItemModel';
import { editActionModelInternalSchemaContribution } from './EditActionModel';
import { expandCollapseActionModelInternalSchemaContribution } from './ExpandCollapseActionModel';
import { editFormModelSchemaContribution } from './EditFormModel';
import { flowSchemaContribution as fieldAttachmentUrlFlowSchemaContribution } from './FieldAttachmentUrlModel';
import { flowSchemaContribution as fieldCodeFlowSchemaContribution } from './FieldCodeModel';
import { flowSchemaContribution as fieldFormulaFlowSchemaContribution } from './FieldFormulaModel';
import { filterActionModelInternalSchemaContribution } from './FilterActionModel';
import { filterFormBlockModelSchemaContribution } from './FilterFormBlockModel';
import { filterFormCollapseActionModelInternalSchemaContribution } from './FilterFormCollapseActionModel';
import { filterFormCustomFieldModelInternalSchemaContribution } from './FilterFormCustomFieldModel';
import { filterFormGridModelInternalSchemaContribution } from './FilterFormGridModel';
import { filterFormItemModelInternalSchemaContribution } from './FilterFormItemModel';
import { filterFormJsActionModelInternalSchemaContribution } from './FilterFormJSActionModel';
import { filterFormResetActionModelInternalSchemaContribution } from './FilterFormResetActionModel';
import { filterFormSubmitActionModelInternalSchemaContribution } from './FilterFormSubmitActionModel';
import { flowSchemaContribution as fieldMarkdownVditorFlowSchemaContribution } from './FieldMarkdownVditorModel';
import { flowSchemaContribution as fieldSequenceFlowSchemaContribution } from './FieldSequenceModel';
import { flowSchemaContribution as fieldSortFlowSchemaContribution } from './FieldSortModel';
import { flowSchemaContribution as fileManagerFlowSchemaContribution } from './FileManagerModel';
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
import { flowSchemaContribution as mapFlowSchemaContribution } from './MapModel';
import { flowSchemaContribution as uiTemplatesFlowSchemaContribution } from './UiTemplatesModel';
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

export type OfficialFlowSchemaContributionEntry = {
  packageName: string;
  contribution: FlowSchemaContribution;
};

export const officialFlowSchemaContributions: OfficialFlowSchemaContributionEntry[] = [
  {
    packageName: '@nocobase/plugin-action-bulk-edit',
    contribution: actionBulkEditFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-action-bulk-update',
    contribution: actionBulkUpdateFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-action-custom-request',
    contribution: actionCustomRequestFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-action-duplicate',
    contribution: actionDuplicateFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-action-export',
    contribution: actionExportFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-action-import',
    contribution: actionImportFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-block-grid-card',
    contribution: blockGridCardFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-block-iframe',
    contribution: blockIframeFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-block-list',
    contribution: blockListFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-block-markdown',
    contribution: blockMarkdownFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-block-workbench',
    contribution: blockWorkbenchFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-comments',
    contribution: commentsFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-data-visualization',
    contribution: dataVisualizationFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-attachment-url',
    contribution: fieldAttachmentUrlFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-code',
    contribution: fieldCodeFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-formula',
    contribution: fieldFormulaFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-markdown-vditor',
    contribution: fieldMarkdownVditorFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-sequence',
    contribution: fieldSequenceFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-field-sort',
    contribution: fieldSortFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-file-manager',
    contribution: fileManagerFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-map',
    contribution: mapFlowSchemaContribution,
  },
  {
    packageName: '@nocobase/plugin-ui-templates',
    contribution: uiTemplatesFlowSchemaContribution,
  },
];
