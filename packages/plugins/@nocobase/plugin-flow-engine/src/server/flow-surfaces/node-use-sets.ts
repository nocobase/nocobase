/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const COLLECTION_BLOCK_USES = new Set([
  'TableBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'FormBlockModel',
  'DetailsBlockModel',
  'FilterFormBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);

export const STATIC_CONTENT_BLOCK_USES = new Set([
  'MarkdownBlockModel',
  'IframeBlockModel',
  'ChartBlockModel',
  'ActionPanelBlockModel',
  'JSBlockModel',
]);

export const FIELD_WRAPPER_USES = new Set([
  'FormItemModel',
  'FormAssociationItemModel',
  'DetailsItemModel',
  'FilterFormItemModel',
  'TableColumnModel',
]);

export const CREATABLE_STANDALONE_FIELD_USES = new Set(['JSColumnModel', 'JSItemModel']);

export const STANDALONE_FIELD_NODE_USES = new Set([...CREATABLE_STANDALONE_FIELD_USES, 'FormJSFieldItemModel']);

export const ACTION_BUTTON_USES = new Set([
  'AddNewActionModel',
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'DeleteActionModel',
  'BulkDeleteActionModel',
  'BulkEditActionModel',
  'UpdateRecordActionModel',
  'BulkUpdateActionModel',
  'DuplicateActionModel',
  'AddChildActionModel',
  'FilterActionModel',
  'ExpandCollapseActionModel',
  'FormSubmitActionModel',
  'FilterFormSubmitActionModel',
  'FilterFormResetActionModel',
  'FilterFormCollapseActionModel',
  'RefreshActionModel',
  'LinkActionModel',
  'ExportActionModel',
  'ExportAttachmentActionModel',
  'ImportActionModel',
  'UploadActionModel',
  'TemplatePrintCollectionActionModel',
  'TemplatePrintRecordActionModel',
  'CollectionTriggerWorkflowActionModel',
  'RecordTriggerWorkflowActionModel',
  'FormTriggerWorkflowActionModel',
  'WorkbenchTriggerWorkflowActionModel',
  'MailSendActionModel',
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'JSItemActionModel',
  'FilterFormJSActionModel',
  'JSActionModel',
]);

export const JS_BLOCK_USES = new Set(['JSBlockModel']);
