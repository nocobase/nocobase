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
import { buildActionTree, buildPopupPageTree, buildStandaloneFieldNode } from '../flow-surfaces/builder';

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
