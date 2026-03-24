/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { confirmUnsavedChangesHandler } from '../closeGuard';

const { registerFlowMock } = vi.hoisted(() => ({
  registerFlowMock: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<any>();

  class MockFlowModel extends actual.FlowModel {
    static registerFlow(flow: any) {
      registerFlowMock(flow);
    }

    static registerEvents() {}
  }

  return {
    ...actual,
    FlowModel: MockFlowModel,
  };
});

vi.mock('../../../components/ConditionBuilder', () => ({
  ConditionBuilder: () => null,
  commonConditionHandler: vi.fn(),
}));

vi.mock('../../../components/TextAreaWithContextSelector', () => ({
  TextAreaWithContextSelector: () => null,
}));

vi.mock('../PageTabModel', () => ({
  BasePageTabModel: class {},
}));

vi.mock('../index', () => ({}));
vi.mock('../../../../index', () => ({}));

describe('PageModel closeGuard flow', () => {
  it('registers closeGuard flow on PageModel', async () => {
    vi.resetModules();
    registerFlowMock.mockClear();
    const { confirmUnsavedChangesHandler: registeredHandler } = await import('../closeGuard');
    await import('../PageModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'closeGuard')?.[0];
    const step = flow?.steps?.confirmUnsavedChanges;

    expect(flow).toBeTruthy();
    expect(step).toBeTruthy();
    expect(step?.handler).toBe(registeredHandler);
  });

  it('skips confirmation when there are no dirty forms', async () => {
    const modalConfirm = vi.fn();

    await confirmUnsavedChangesHandler({
      inputArgs: {
        dirty: {
          hasDirtyForms: false,
          formModelUids: [],
        },
      },
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
      exitAll: vi.fn(),
    });

    expect(modalConfirm).not.toHaveBeenCalled();
  });

  it('prevents close and exits remaining flows when confirmation is cancelled', async () => {
    const prevent = vi.fn();
    const exitAll = vi.fn();
    const modalConfirm = vi.fn().mockResolvedValue(false);

    await confirmUnsavedChangesHandler({
      inputArgs: {
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['form-1'],
        },
        controller: {
          prevent,
        },
      },
      modal: { confirm: modalConfirm },
      t: (value: string) => value,
      exitAll,
    });

    expect(modalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unsaved changes',
        content: "Are you sure you don't want to save?",
      }),
    );
    expect(prevent).toHaveBeenCalledTimes(1);
    expect(exitAll).toHaveBeenCalledTimes(1);
  });
});
