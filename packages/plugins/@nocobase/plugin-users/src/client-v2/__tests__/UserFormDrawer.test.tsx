/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UserFormDrawer from '../pages/UserFormDrawer';
import {
  ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
  ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
} from '../shared/adminProfileFormModels';

const { create, update, save, destroy, loadModel, createModelAsync, removeModelWithSubModels, submit, close, success } =
  vi.hoisted(() => ({
    create: vi.fn(),
    update: vi.fn(),
    save: vi.fn(),
    destroy: vi.fn(),
    loadModel: vi.fn(),
    createModelAsync: vi.fn(),
    removeModelWithSubModels: vi.fn(),
    submit: vi.fn(),
    close: vi.fn(),
    success: vi.fn(),
  }));

vi.mock('@nocobase/client-v2', async () => {
  return {
    DrawerFormLayout: ({
      title,
      children,
      onSubmit,
      submitText,
      cancelText,
    }: {
      title?: React.ReactNode;
      children?: React.ReactNode;
      onSubmit?: () => void | Promise<void>;
      submitText?: React.ReactNode;
      cancelText?: React.ReactNode;
    }) => (
      <div>
        <div>{title}</div>
        {children}
        <button
          onClick={async () => {
            await onSubmit?.();
            await close();
          }}
        >
          {submitText ?? 'Submit'}
        </button>
        <button onClick={() => close()}>{cancelText ?? 'Cancel'}</button>
      </div>
    ),
    SkeletonFallback: () => <div data-testid="flow-skeleton" />,
  };
});

vi.mock('@nocobase/flow-engine', () => {
  return {
    FlowModelRenderer: () => <div data-testid="flow-model-renderer" />,
    useFlowEngine: () => ({
      loadModel,
      createModelAsync,
      removeModelWithSubModels,
    }),
    useFlowContext: () => ({
      api: {
        resource: (name: string) =>
          name === 'users'
            ? {
                create,
                update,
              }
            : name === 'flowModels'
              ? {
                  save,
                  destroy,
                }
              : {},
      },
      message: {
        success,
      },
      view: {
        close,
        Header: ({ title }: { title: React.ReactNode }) => <div>{title}</div>,
      },
      themeToken: {
        paddingLG: 24,
        colorBorderSecondary: '#f0f0f0',
      },
      flowSettingsEnabled: false,
    }),
    useFlowViewContext: () => ({}),
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('UserFormDrawer', () => {
  beforeEach(() => {
    const model = {
      submit,
      context: {
        addDelegate: vi.fn(),
      },
    };
    loadModel.mockResolvedValue(model);
    createModelAsync.mockResolvedValue(model);
    submit.mockReset();
    create.mockReset();
    update.mockReset();
    createModelAsync.mockReset();
    createModelAsync.mockResolvedValue(model);
    removeModelWithSubModels.mockReset();
    save.mockReset();
    destroy.mockReset();
    close.mockReset();
    success.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load the persisted create form model and submit normalized role values', async () => {
    submit.mockImplementation(async (_params, cb) => {
      await cb?.({
        username: 'alice',
        roles: [{ name: 'admin', title: 'Admin' }, { value: 'member' }],
      });
    });

    const onSubmitted = vi.fn();
    render(<UserFormDrawer onSubmitted={onSubmitted} />);

    await waitFor(() => {
      expect(loadModel).toHaveBeenCalledWith({ uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        values: {
          username: 'alice',
          roles: [{ name: 'admin' }, { name: 'member' }],
        },
      });
    });

    expect(success).toHaveBeenCalledWith('Saved successfully');
    expect(onSubmitted).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('should load the persisted edit form model and submit update by user id', async () => {
    submit.mockImplementation(async (_params, cb) => {
      await cb?.({
        email: 'alice@example.com',
        roles: ['member'],
      });
    });

    render(
      <UserFormDrawer
        user={{
          id: 18,
          username: 'alice',
        }}
        onSubmitted={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(loadModel).toHaveBeenCalledWith({ uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        filterByTk: 18,
        values: {
          email: 'alice@example.com',
          roles: [{ name: 'member' }],
        },
      });
    });
  });

  it('should cleanup stale tree path rows and retry save when flowModels save hits duplicate ancestor/descendant', async () => {
    loadModel.mockResolvedValueOnce(null).mockResolvedValueOnce({
      use: 'CreateFormModel',
      serialize: () => ({
        uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
        use: 'CreateFormModel',
      }),
      context: {
        addDelegate: vi.fn(),
      },
      submit,
    });
    save.mockRejectedValueOnce({
      response: {
        data: {
          errors: [{ message: 'ancestor 字段值已存在' }, { message: 'descendant 字段值已存在' }],
        },
      },
    });

    render(<UserFormDrawer onSubmitted={() => undefined} />);

    await waitFor(() => {
      expect(destroy).toHaveBeenCalledWith({
        filterByTk: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
      });
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(removeModelWithSubModels).toHaveBeenCalledWith(ADMIN_PROFILE_CREATE_FORM_MODEL_UID);
    expect(createModelAsync).toHaveBeenCalledWith({
      uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
      use: 'UserCreateFormModel',
    });
  });

  it('should rebuild persisted edit form model when username settings are outdated', async () => {
    loadModel.mockResolvedValueOnce({
      uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
      use: 'EditFormModel',
      serialize: () => ({
        uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
        use: 'EditFormModel',
        subModels: {
          grid: {
            subModels: {
              items: [
                {
                  use: 'FormItemModel',
                  props: {
                    disabled: true,
                  },
                  stepParams: {
                    fieldSettings: {
                      init: {
                        fieldPath: 'username',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      }),
      context: {
        addDelegate: vi.fn(),
      },
      submit,
    });

    render(
      <UserFormDrawer
        user={{
          id: 18,
          username: 'alice',
        }}
        onSubmitted={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(removeModelWithSubModels).toHaveBeenCalledWith(ADMIN_PROFILE_EDIT_FORM_MODEL_UID);
    });

    expect(createModelAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
        use: 'UserEditFormModel',
        subModels: {
          grid: {
            subModels: {
              items: [
                expect.objectContaining({
                  stepParams: {
                    fieldSettings: {
                      init: {
                        fieldPath: 'username',
                      },
                    },
                    editItemSettings: {
                      required: {
                        required: true,
                      },
                    },
                  },
                }),
              ],
            },
          },
        },
      }),
    );
  });
});
