/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import React from 'react';
import ThemeRuntime from './ThemeRuntime';

const THEME_RUNTIME_INSTALLED_KEY = Symbol.for('nocobase.theme-editor.runtime.installed');

export function installThemeRuntime(app: Application) {
  const router = app.router as any;
  if (router[THEME_RUNTIME_INSTALLED_KEY]) {
    return;
  }

  const getRouterComponent = router.getRouterComponent.bind(router);
  router.getRouterComponent = (children?: React.ReactNode) => {
    return getRouterComponent(
      <>
        <ThemeRuntime />
        {children}
      </>,
    );
  };
  router[THEME_RUNTIME_INSTALLED_KEY] = true;
}
