/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSContextContribution } from '@nocobase/flow-engine';

let registered = false;

export function registerMobileJSPageRunJSContext() {
  if (registered) {
    return;
  }
  registered = true;
  registerRunJSContextContribution(({ version, RunJSContextRegistry }) => {
    const pageContext = RunJSContextRegistry.resolve(version, 'JSPageModel');
    if (!pageContext) {
      throw new Error('[plugin-ui-layout] JSPageModel RunJS context is not registered');
    }
    RunJSContextRegistry.register(version, 'MobileJSPageModel', pageContext, { scenes: ['page'] });
  });
}
