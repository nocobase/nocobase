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

const { create, update, save, findOne, createModelAsync, submit, close, success } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  save: vi.fn(),
  findOne: vi.fn(),
  createModelAsync: vi.fn(),
  submit: vi.fn(),
  close: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  class MockFormModel {
    props = {};
    decoratorProps = {};
    subModels = { grid: {} };
    resource = {
      loading: false,
      getMeta: () => 0,
    };
    context = {
      themeToken: {},
    };

    onInit() {}

    setDecoratorProps(props: Record<string, unknown>) {
      this.decoratorProps = props;
    }

    hasAvailableData() {
      return true;
    }

    isMultiRecordResource() {
      return false;
    }

    translate(value: string) {
      return value;
    }
  }

  return {
    CreateFormModel: MockFormModel,
    EditFormModel: MockFormModel,
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
            try {
              await onSubmit?.();
              await close();
            } catch {
              // Keep the drawer open when validation or submit flow interrupts submission.
            }
          }}
        >
          {submitText ?? 'Submit'}
        </button>
        <button onClick={() => close()}>{cancelText ?? 'Cancel'}</button>
      </div>
    ),
    FormBlockContent: () => <div data-testid="form-block-content" />,
    SkeletonFallback: () => <div data-testid="flow-skeleton" />,
    dispatchEventDeep: vi.fn(),
  };
});

vi.mock('@nocobase/flow-engine', () => {
  const flowEngine = {
    modelRepository: {
      findOne,
    },
    createModelAsync,
  };
  const flowContext = {
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
  };
  const flowViewContext = {};

  return {
    FlowModelRenderer: () => <div data-testid="flow-model-renderer" />,
    MultiRecordResource: class MultiRecordResource {},
    useFlowEngine: () => flowEngine,
    useFlowContext: () => flowContext,
    useFlowViewContext: () => flowViewContext,
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getByPath(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isRecord(current)) {
      return;
    }
    current = current[key];
  }
  return current;
}

function findPasswordItem(source: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(source)) {
    for (const item of source) {
      const matched = findPasswordItem(item);
      if (matched) {
        return matched;
      }
    }
    return;
  }

  if (!isRecord(source)) {
    return;
  }

  if (getByPath(source, ['stepParams', 'fieldSettings', 'init', 'fieldPath']) === 'password') {
    return source;
  }

  return findPasswordItem(Object.values(source));
}

describe('UserFormDrawer', () => {
  beforeEach(() => {
    const model = {
      submit,
      context: {
        addDelegate: vi.fn(),
      },
    };
    submit.mockReset();
    create.mockReset();
    update.mockReset();
    findOne.mockReset();
    findOne.mockResolvedValue({
      uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
      use: 'UserCreateFormModel',
    });
    createModelAsync.mockReset();
    createModelAsync.mockResolvedValue(model);
    save.mockReset();
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
      expect(findOne).toHaveBeenCalledWith({ uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID });
    });

    await waitFor(() => {
      expect(createModelAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
          use: expect.any(Function),
        }),
      );
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
    findOne.mockResolvedValue({
      uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
      use: 'UserEditFormModel',
    });
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
      expect(findOne).toHaveBeenCalledWith({ uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID });
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

  it('should keep the drawer open and avoid refresh when the submit flow does not save values', async () => {
    submit.mockResolvedValue(undefined);
    const onSubmitted = vi.fn();

    render(<UserFormDrawer onSubmitted={onSubmitted} />);

    await waitFor(() => {
      expect(createModelAsync).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(submit).toHaveBeenCalled();
    });

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('should persist the create form model without password defaults', async () => {
    findOne.mockResolvedValueOnce(null);

    render(<UserFormDrawer onSubmitted={() => undefined} />);

    await waitFor(() => {
      expect(save).toHaveBeenCalled();
    });

    const savedValues = getByPath(save.mock.calls[0]?.[0], ['values']);
    expect(savedValues).toEqual(
      expect.objectContaining({
        uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
        use: 'UserCreateFormModel',
      }),
    );
    const passwordItem = findPasswordItem(savedValues);
    expect(passwordItem).toBeTruthy();
    expect(getByPath(passwordItem, ['stepParams', 'editItemSettings', 'initialValue'])).toBeUndefined();
    expect(getByPath(passwordItem, ['subModels', 'field', 'props'])).toEqual(
      expect.objectContaining({
        checkStrength: false,
      }),
    );
    expect(getByPath(passwordItem, ['subModels', 'field', 'props', 'initialValue'])).toBeUndefined();

    expect(createModelAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
        use: expect.any(Function),
      }),
    );
  });

  it('should remove legacy password defaults from a persisted create form model', async () => {
    findOne.mockResolvedValueOnce({
      uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
      use: 'UserCreateFormModel',
      subModels: {
        grid: {
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      fieldPath: 'password',
                    },
                  },
                  editItemSettings: {
                    initialValue: {
                      defaultValue: 'admin123',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'UserPasswordFieldModel',
                    props: {
                      checkStrength: false,
                      initialValue: 'admin123',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    render(<UserFormDrawer onSubmitted={() => undefined} />);

    await waitFor(() => {
      expect(createModelAsync).toHaveBeenCalled();
    });

    const createdModelTree = createModelAsync.mock.calls[0]?.[0];
    const passwordItem = findPasswordItem(createdModelTree);
    expect(passwordItem).toBeTruthy();
    expect(getByPath(passwordItem, ['stepParams', 'editItemSettings', 'initialValue'])).toBeUndefined();
    expect(getByPath(passwordItem, ['subModels', 'field', 'props', 'initialValue'])).toBeUndefined();
  });
});
