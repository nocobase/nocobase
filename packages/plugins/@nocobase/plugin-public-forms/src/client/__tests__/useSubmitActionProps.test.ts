/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook } from '@nocobase/test/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubmitActionProps } from '../hooks/useSubmitActionProps';

const testState = vi.hoisted(() => ({
  apiResource: vi.fn(),
  ensurePublicFormFlowModel: vi.fn(),
  flowEngine: { uid: 'flow-engine' },
  form: {
    submit: vi.fn(),
    reset: vi.fn(),
    values: {} as Record<string, unknown>,
  },
  messageSuccess: vi.fn(),
  resource: {
    create: vi.fn(),
    update: vi.fn(),
  },
  serviceRefresh: vi.fn(),
  setVisible: vi.fn(),
  uiSchemasInsert: vi.fn(),
}));

vi.mock('..', () => ({
  default: class PluginPublicFormsClient {},
}));

vi.mock('@formily/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/react')>();

  return {
    ...actual,
    useForm: () => testState.form,
  };
});

vi.mock('@formily/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/shared')>();

  return {
    ...actual,
    uid: () => 'generated-public-form-key',
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();

  return {
    ...actual,
    useFlowEngine: () => testState.flowEngine,
  };
});

vi.mock('@nocobase/client', () => ({
  useActionContext: () => ({
    setVisible: testState.setVisible,
  }),
  useAPIClient: () => ({
    resource: testState.apiResource,
  }),
  useBlockRequestContext: () => ({
    service: {
      refresh: testState.serviceRefresh,
    },
  }),
  useCollection: () => ({
    filterTargetKey: 'key',
  }),
  useDataBlockResource: () => testState.resource,
  usePlugin: () => ({
    getFormSchemaByType: () => () => ({}),
    t: (key: string) => key,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          success: testState.messageSuccess,
        },
      }),
    },
  };
});

vi.mock('../../client-v2/modelTree', () => ({
  ensurePublicFormFlowModel: testState.ensurePublicFormFlowModel,
}));

describe('useSubmitActionProps', () => {
  beforeEach(() => {
    testState.apiResource.mockReset();
    testState.ensurePublicFormFlowModel.mockReset();
    testState.form.submit.mockReset();
    testState.form.reset.mockReset();
    testState.form.values = {};
    testState.messageSuccess.mockReset();
    testState.resource.create.mockReset();
    testState.resource.update.mockReset();
    testState.serviceRefresh.mockReset();
    testState.setVisible.mockReset();
    testState.uiSchemasInsert.mockReset();
    testState.apiResource.mockReturnValue({
      insert: testState.uiSchemasInsert,
    });
  });

  it('creates v2 public forms from the v1 settings list without inserting a legacy uiSchema', async () => {
    testState.form.values = {
      collection: 'main:users',
      enabled: true,
      title: 'Public form',
      type: 'form',
    };

    const { result } = renderHook(() => useSubmitActionProps());

    await act(async () => {
      await result.current.onClick();
    });

    expect(testState.resource.create).toHaveBeenCalledWith({
      values: {
        collection: 'main:users',
        enabled: true,
        key: 'generated-public-form-key',
        title: 'Public form',
        type: 'form',
        version: 'v2',
      },
    });
    expect(testState.ensurePublicFormFlowModel).toHaveBeenCalledWith(
      testState.flowEngine,
      expect.objectContaining({
        key: 'generated-public-form-key',
        version: 'v2',
      }),
      expect.any(Function),
    );
    expect(testState.uiSchemasInsert).not.toHaveBeenCalled();
    expect(testState.form.reset).toHaveBeenCalled();
    expect(testState.serviceRefresh).toHaveBeenCalled();
    expect(testState.setVisible).toHaveBeenCalledWith(false);
  });

  it('preserves the v2 version when editing an existing v2 public form from the v1 settings list', async () => {
    testState.form.values = {
      collection: 'main:users',
      key: 'existing-form',
      title: 'Updated public form',
      type: 'form',
      version: 'v2',
    };

    const { result } = renderHook(() => useSubmitActionProps());

    await act(async () => {
      await result.current.onClick();
    });

    expect(testState.resource.update).toHaveBeenCalledWith({
      filterByTk: 'existing-form',
      values: {
        collection: 'main:users',
        key: 'existing-form',
        title: 'Updated public form',
        type: 'form',
        version: 'v2',
      },
    });
    expect(testState.ensurePublicFormFlowModel).not.toHaveBeenCalled();
    expect(testState.uiSchemasInsert).not.toHaveBeenCalled();
  });
});
