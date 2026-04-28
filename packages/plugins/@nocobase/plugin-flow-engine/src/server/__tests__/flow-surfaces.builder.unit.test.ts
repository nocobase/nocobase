/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildApprovalActionDefaults } from '../flow-surfaces/approval/builder';
import {
  buildActionTree,
  buildFieldTree,
  buildPopupPageTree,
  buildStandaloneFieldNode,
} from '../flow-surfaces/builder';

describe('flowSurfaces builder translation defaults', () => {
  it('should persist translatable core default strings', () => {
    const deleteAction = buildActionTree({
      use: 'DeleteActionModel',
    });
    const bulkUpdateAction = buildActionTree({
      use: 'BulkUpdateActionModel',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const jsColumn = buildStandaloneFieldNode({
      use: 'JSColumnModel',
    });
    const divider = buildStandaloneFieldNode({
      use: 'DividerItemModel',
    });
    const popupPage = buildPopupPageTree({});
    const popupTab = popupPage.subModels?.tabs?.[0];

    expect(deleteAction.props).toMatchObject({
      title: '{{t("Delete")}}',
    });
    expect(deleteAction.stepParams?.deleteSettings?.confirm).toMatchObject({
      title: '{{t("Delete record")}}',
      content: '{{t("Are you sure you want to delete it?")}}',
    });

    expect(bulkUpdateAction.props).toMatchObject({
      title: '{{t("Bulk update")}}',
    });
    expect(bulkUpdateAction.stepParams?.assignSettings?.confirm).toMatchObject({
      title: '{{t("Bulk update")}}',
      content: '{{t("Are you sure you want to perform the Update record action?")}}',
    });

    expect(jsColumn.props).toMatchObject({
      title: '{{t("JS column")}}',
    });
    expect(jsColumn.stepParams?.tableColumnSettings).toMatchObject({
      title: {
        title: '{{t("JS column")}}',
      },
    });

    expect(divider.props).toMatchObject({
      label: '{{t("Divider")}}',
    });

    expect(popupTab?.props).toMatchObject({
      title: '{{t("Details")}}',
    });
    expect(popupTab?.stepParams?.pageTabSettings?.tab?.title).toBe('{{t("Details")}}');
  });

  it('should persist frontend-aligned namespace translations for plugin defaults', () => {
    const triggerAction = buildActionTree({
      use: 'CollectionTriggerWorkflowActionModel',
      containerUse: 'TableBlockModel',
    });
    const mailAction = buildActionTree({
      use: 'MailSendActionModel',
      containerUse: 'TableBlockModel',
    });
    const saveDraftDefaults = buildApprovalActionDefaults('ApplyFormSaveDraftModel');

    expect(triggerAction.props).toMatchObject({
      title: '{{t("Trigger workflow", { ns: "@nocobase/plugin-workflow-custom-action-trigger" })}}',
    });
    expect(mailAction.props).toMatchObject({
      title: '{{t("Compose email", { ns: ["@nocobase/plugin-email-manager", "client"] })}}',
    });
    expect(saveDraftDefaults).toMatchObject({
      props: {
        title: '{{t("Save draft", { ns: "@nocobase/plugin-workflow-approval" })}}',
      },
    });
  });
});

describe('flowSurfaces builder action style defaults', () => {
  it('should align record action button defaults with their container initializers', () => {
    const tableEditAction = buildActionTree({
      use: 'EditActionModel',
      containerUse: 'TableActionsColumnModel',
    });
    const listEditAction = buildActionTree({
      use: 'EditActionModel',
      containerUse: 'ListItemModel',
    });
    const gridCardEditAction = buildActionTree({
      use: 'EditActionModel',
      containerUse: 'GridCardItemModel',
    });
    const detailsEditAction = buildActionTree({
      use: 'EditActionModel',
      containerUse: 'DetailsBlockModel',
    });

    expect(tableEditAction.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'link',
      icon: null,
    });
    expect(listEditAction.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'link',
      icon: null,
    });
    expect(gridCardEditAction.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'link',
      icon: null,
    });
    expect(detailsEditAction.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'default',
      icon: 'EditOutlined',
    });
  });
});

describe('flowSurfaces builder relation field defaults', () => {
  it('should create PopupSubTableFieldModel with default actions column and edit/remove actions', () => {
    const fieldTree = buildFieldTree({
      wrapperUse: 'FormItemModel',
      fieldUse: 'PopupSubTableFieldModel',
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });

    expect(fieldTree.model).toMatchObject({
      use: 'FormItemModel',
      subModels: {
        field: {
          use: 'PopupSubTableFieldModel',
          subModels: {
            subTableColumns: [
              {
                use: 'PopupSubTableActionsColumnModel',
                subModels: {
                  actions: [{ use: 'PopupSubTableEditActionModel' }, { use: 'PopupSubTableRemoveActionModel' }],
                },
              },
            ],
          },
        },
      },
    });
  });
});
