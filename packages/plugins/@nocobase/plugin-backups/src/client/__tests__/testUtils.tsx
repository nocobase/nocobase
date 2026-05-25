/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClientProvider, Application, ApplicationContext, mockAPIClient } from '@nocobase/client';
import { App as AntdApp } from 'antd';
import React from 'react';

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

export const createMockAppWrapper = () => {
  const { apiClient, mockRequest } = mockAPIClient();
  const app = new Application({
    apiClient,
    router: {
      type: 'memory',
    },
  });

  app.i18n.t = ((key: string) => key) as any;

  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    return (
      <ApplicationContext.Provider value={app}>
        <APIClientProvider apiClient={app.apiClient}>
          <AntdApp>{children}</AntdApp>
        </APIClientProvider>
      </ApplicationContext.Provider>
    );
  };

  return {
    app,
    apiClient: app.apiClient,
    mockRequest,
    Wrapper,
  };
};
