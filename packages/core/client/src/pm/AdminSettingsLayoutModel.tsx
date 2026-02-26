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
import { InternalAdminSettingsLayout } from './PluginSetting';

export class AdminSettingsLayoutModel extends FlowModel {
  render() {
    return <InternalAdminSettingsLayout {...this.props} />;
  }
}
