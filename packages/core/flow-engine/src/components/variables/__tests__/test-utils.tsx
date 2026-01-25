/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowContext } from '../../../flowContext';
import { FlowContextProvider } from '../../../FlowContextProvider';

/**
 * Test wrapper component that provides FlowContext to child components
 */
export function TestFlowContextWrapper({ context, children }: { context: FlowContext; children: React.ReactNode }) {
  return <FlowContextProvider context={context}>{children}</FlowContextProvider>;
}

/**
 * Create a test FlowContext with consistent data for testing
 */
export function createTestFlowContext() {
  const flowContext = new FlowContext();

  // Mock the translation function
  (flowContext as any).t = (key: string) => key;

  flowContext.defineProperty('user', {
    value: { name: 'John', email: 'john@example.com' },
    meta: {
      title: 'User',
      type: 'object',
      properties: {
        name: { title: 'Name', type: 'string' },
        email: { title: 'Email', type: 'string' },
      },
    },
  });

  flowContext.defineProperty('data', {
    value: { items: [] },
    meta: {
      title: 'Data',
      type: 'object',
      properties: {
        items: { title: 'Items', type: 'array' },
      },
    },
  });

  flowContext.defineProperty('config', {
    value: 'test-config',
    meta: {
      title: 'Config',
      type: 'string',
    },
  });

  return flowContext;
}
