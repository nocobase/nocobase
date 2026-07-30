/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@testing-library/react';
import type { FormInstance } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesBeforeClose } from '../pages/useUnsavedChangesBeforeClose';

type ConfirmOptions = {
  onCancel?: () => void;
};

type BeforeCloseHandler = () => boolean | void | Promise<boolean | void>;

const mocks = vi.hoisted(() => ({
  contextualConfirm: vi.fn(),
  destroy: vi.fn(),
  staticConfirm: vi.fn(),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ modal: { confirm: mocks.contextualConfirm } }),
    },
    Modal: {
      ...actual.Modal,
      confirm: mocks.staticConfirm,
    },
  };
});

describe('useUnsavedChangesBeforeClose', () => {
  beforeEach(() => {
    mocks.contextualConfirm.mockReset();
    mocks.contextualConfirm.mockReturnValue({ destroy: mocks.destroy });
    mocks.destroy.mockReset();
    mocks.staticConfirm.mockReset();
    mocks.staticConfirm.mockReturnValue({ destroy: mocks.destroy });
  });

  it('uses the contextual modal so the confirmation inherits the dynamic theme', async () => {
    const view: {
      beforeClose?: BeforeCloseHandler;
      close: () => void;
    } = {
      close: vi.fn(),
    };
    const form = {
      getFieldsValue: vi.fn(() => ({ nickname: 'Changed' })),
    } as unknown as FormInstance<{ nickname: string }>;

    const { unmount } = renderHook(() =>
      useUnsavedChangesBeforeClose({
        view,
        form,
        initialValues: { nickname: 'Initial' },
        dirty: true,
        title: 'Unsaved changes',
        content: "Are you sure you don't want to save?",
      }),
    );

    let closeResult: ReturnType<BeforeCloseHandler> = undefined;
    act(() => {
      closeResult = view.beforeClose?.();
    });

    expect(mocks.contextualConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unsaved changes',
        content: "Are you sure you don't want to save?",
      }),
    );
    expect(mocks.staticConfirm).not.toHaveBeenCalled();

    const confirmOptions = mocks.contextualConfirm.mock.calls[0][0] as ConfirmOptions;
    act(() => {
      confirmOptions.onCancel?.();
    });

    await expect(closeResult).resolves.toBe(false);
    unmount();
  });
});
