/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineFlow, escapeT, FlowModel } from '@nocobase/flow-engine';

export const openViewFlow = defineFlow({
  key: 'popupSettings',
  title: escapeT('Popup settings'),
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
    },
  },
});

export const updateOpenViewStepParams = async (
  params: { collectionName: string; associationName: string; dataSourceKey: string },
  model: FlowModel,
) => {
  const settingsParams = model.getStepParams('popupSettings', 'openView');

  if (
    settingsParams?.collectionName !== params.collectionName ||
    settingsParams?.associationName !== params.associationName ||
    settingsParams?.dataSourceKey !== params.dataSourceKey
  ) {
    model.setStepParams('popupSettings', 'openView', params);
    await model.saveStepParams();
  }
};
