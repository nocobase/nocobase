/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { App, ConfigProvider, theme } from 'antd';
import { FlowEngine } from '../flowEngine';
import { FlowEngineGlobalsContextProvider, FlowEngineProvider, useFlowEngine } from '../provider';

describe('FlowEngineProvider/useFlowEngine', () => {
  it('returns engine within provider', () => {
    const engine = new FlowEngine();
    const wrapper = ({ children }: any) => <FlowEngineProvider engine={engine}>{children}</FlowEngineProvider>;
    const { result } = renderHook(() => useFlowEngine(), { wrapper });
    expect(result.current).toBe(engine);
  });

  it('registers isDarkTheme within globals provider before first child render', () => {
    const engine = new FlowEngine();
    const reads: boolean[] = [];
    const Reader = () => {
      reads.push(engine.context.isDarkTheme);
      return null;
    };
    const wrapper = ({ children }: any) => (
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowEngineGlobalsContextProvider>{children}</FlowEngineGlobalsContextProvider>
          </FlowEngineProvider>
        </App>
      </ConfigProvider>
    );
    render(<Reader />, { wrapper });
    expect(reads[0]).toBe(true);
    expect(engine.context.isDarkTheme).toBe(true);
  });
});
