/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useApp, useDesignable } from '@nocobase/client';
import { registerMissingKeyHandler } from './i18n-missing-handler';

export const MissingKeyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const app = useApp();
  const { designable } = useDesignable();

  useEffect(() => {
    if (!designable) {
      return;
    }
    const unregister = registerMissingKeyHandler({
      apiClient: app.apiClient,
    });
    return () => {
      unregister?.();
    };
  }, [app, designable]);

  return <>{children}</>;
};
