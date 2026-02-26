/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';

const LazyInternalAdminSettingsLayout = React.lazy(async () => {
  const module = await import('./PluginSetting');
  return { default: module.InternalAdminSettingsLayout };
});

export class AdminSettingsLayoutModel extends FlowModel {
  render() {
    return (
      <React.Suspense fallback={null}>
        <LazyInternalAdminSettingsLayout {...this.props} />
      </React.Suspense>
    );
  }
}
