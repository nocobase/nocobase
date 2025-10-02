/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCodeRunner } from '../hooks/useCodeRunner';
import { FlowEngine, FlowModel, FlowStepContext } from '@nocobase/flow-engine';
import React from 'react';

describe('useCodeRunner', () => {
  let engine: FlowEngine;
  let model: FlowModel;

  // 包装器：提供 FlowStepContext（flowKey_stepKey）
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <FlowStepContext.Provider value={{ path: 'testFlow_testStep', params: {} }}>{children}</FlowStepContext.Provider>
  );

  beforeEach(() => {
    engine = new FlowEngine();
    model = engine.createModel<FlowModel>({ use: FlowModel, uid: 'test-model' });

    // 在实例上注册一个真实的 flow，step 使用 ctx.runjs 执行预览代码
    model.registerFlow('testFlow', {
      steps: {
        testStep: {
          // 直接调用 ctx.runjs，使用 applyFlow(inputArgs) 注入的 preview.code / version
          handler: async (ctx) => {
            const code = ctx?.inputArgs?.preview?.code || '';
            const version = ctx?.inputArgs?.preview?.version;
            return ctx.runjs(code, {}, { version });
          },
        },
      },
    });
  });

  it('logs success result', async () => {
    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.run('return 123');
    });

    expect(result.current.logs.some((l) => l.msg?.includes('Execution succeeded'))).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('logs error message on failure', async () => {
    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.run('throw new Error("boom")');
    });

    expect(result.current.logs.some((l) => l.level === 'error' && /boom/i.test(l.msg))).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('captures console.log output', async () => {
    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.run('console.log("test message"); return 42');
    });

    expect(result.current.logs.some((l) => l.level === 'log' && l.msg.includes('test message'))).toBe(true);
  });
});
