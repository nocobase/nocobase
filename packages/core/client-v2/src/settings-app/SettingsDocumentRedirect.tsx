/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { resolveStandaloneSettingsPath } from './runtimePaths';

export function SettingsDocumentRedirect() {
  const app = useApp();
  const location = useLocation();
  const sourcePath = `${location.pathname}${location.search}${location.hash}`;
  const targetPath = resolveStandaloneSettingsPath(app, sourcePath, location.pathname);

  useEffect(() => {
    window.location.replace(targetPath);
  }, [targetPath]);

  return app.renderComponent('AppSpin');
}
