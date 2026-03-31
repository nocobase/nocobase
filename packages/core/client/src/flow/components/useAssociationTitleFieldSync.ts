/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useDataSourceManager } from '@nocobase/client';
import { message } from 'antd';
import React from 'react';
import type { SyncAssociationTitleFieldParams } from './FieldAssignRulesEditor';
import { isTitleUsableField, syncCollectionTitleField } from '../internal/utils/titleFieldQuickSync';

export function useAssociationTitleFieldSync(t: (key: string) => string) {
  const api = useAPIClient();
  const dataSourceManager = useDataSourceManager();

  const isTitleFieldCandidate = React.useCallback(
    (field: any) => {
      return isTitleUsableField(dataSourceManager, field);
    },
    [dataSourceManager],
  );

  const onSyncAssociationTitleField = React.useCallback(
    async ({ targetCollection, titleField }: SyncAssociationTitleFieldParams) => {
      try {
        await syncCollectionTitleField({
          api,
          dataSourceManager,
          targetCollection,
          titleField,
        });
        message.success(t('Saved successfully'));
      } catch (error: any) {
        const msg = error?.message ? String(error.message) : t('Save failed');
        message.error(msg);
        throw error;
      }
    },
    [api, dataSourceManager, t],
  );

  return {
    isTitleFieldCandidate,
    onSyncAssociationTitleField,
  };
}
