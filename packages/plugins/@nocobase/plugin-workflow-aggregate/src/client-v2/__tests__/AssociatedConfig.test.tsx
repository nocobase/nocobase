/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { CascaderProps } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssociatedConfig } from '../components/AssociatedConfig';

type MockField = {
  collectionName?: string;
  dataSourceKey?: string;
  name: string;
  primaryKey?: boolean;
  target?: string;
  type: string;
};

type MockOption = {
  appends?: string[] | null;
  children?: MockOption[];
  depth?: number;
  field?: MockField;
  isLeaf?: boolean;
  key: string;
  label: string;
  loadChildren?: (option: MockOption) => void;
  types?: Array<(field: MockField) => boolean>;
  value: string;
};

type MockCascaderProps = CascaderProps<MockOption, 'value', false>;

const { cascaderProps, mockWorkflowPlugin } = vi.hoisted(() => {
  const cascaderProps: { current?: MockCascaderProps } = {};

  const makeFieldOption = (
    field: MockField,
    options: {
      depth?: number;
      label: string;
      loadChildren?: (option: MockOption) => void;
      types?: MockOption['types'];
    },
  ): MockOption => ({
    depth: options.depth,
    field,
    isLeaf: !options.loadChildren,
    key: field.name,
    label: options.label,
    loadChildren: options.loadChildren,
    types: options.types,
    value: field.name,
  });

  const filterFieldOptions = (target: MockOption, options: MockOption[]) => {
    if (!target.types?.length) {
      return options;
    }

    return options.filter((option) => {
      const { field } = option;
      if (!field) {
        return false;
      }
      return target.types?.some((type) => type(field)) || Boolean(option.loadChildren);
    });
  };

  const loadAuthorChildren = (target: MockOption) => {
    target.children = filterFieldOptions(target, [
      makeFieldOption(
        {
          collectionName: 'users',
          dataSourceKey: 'main',
          name: 'tasks',
          target: 'tasks',
          type: 'hasMany',
        },
        { depth: (target.depth ?? 1) - 1, label: 'Tasks', types: target.types },
      ),
      makeFieldOption(
        {
          collectionName: 'users',
          dataSourceKey: 'main',
          name: 'nickname',
          type: 'string',
        },
        { depth: (target.depth ?? 1) - 1, label: 'Nickname', types: target.types },
      ),
    ]);
  };

  const loadTriggerDataChildren = (target: MockOption) => {
    target.children = filterFieldOptions(target, [
      makeFieldOption(
        {
          collectionName: 'posts',
          dataSourceKey: 'main',
          name: 'comments',
          target: 'comments',
          type: 'hasMany',
        },
        { depth: (target.depth ?? 1) - 1, label: 'Comments', types: target.types },
      ),
      makeFieldOption(
        {
          collectionName: 'posts',
          dataSourceKey: 'main',
          name: 'author',
          target: 'users',
          type: 'belongsTo',
        },
        {
          depth: (target.depth ?? 1) - 1,
          label: 'Author',
          loadChildren: loadAuthorChildren,
          types: target.types,
        },
      ),
      makeFieldOption(
        {
          collectionName: 'posts',
          dataSourceKey: 'main',
          name: 'title',
          type: 'string',
        },
        { depth: (target.depth ?? 1) - 1, label: 'Title', types: target.types },
      ),
    ]);
  };

  const mockWorkflowPlugin = {
    instructions: { get: vi.fn() },
    triggers: {
      get: vi.fn(() => ({
        useVariables: vi.fn((_config, options) => [
          {
            appends: options?.appends,
            depth: options?.depth,
            field: {
              collectionName: 'posts',
              dataSourceKey: 'main',
              name: 'data',
              target: 'posts',
              type: 'hasOne',
            },
            isLeaf: false,
            key: 'data',
            label: 'Trigger data',
            loadChildren: loadTriggerDataChildren,
            types: options?.types,
            value: 'data',
          },
        ]),
      })),
    },
  };

  return { cascaderProps, mockWorkflowPlugin };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Cascader: (props: MockCascaderProps) => {
      cascaderProps.current = props;
      return <div data-testid="associated-cascader" />;
    },
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    useFlowEngine: () => ({
      context: {
        app: {
          pm: {
            get: vi.fn(() => mockWorkflowPlugin),
          },
        },
        dataSourceManager: {},
        t: (key: string) => key,
      },
    }),
  };
});

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  getCollection: (_dataSourceManager: unknown, collection: string) => ({
    fields: [{ name: 'id', primaryKey: true }],
    name: collection,
  }),
  joinCollectionName: (dataSourceKey: string, collectionName: string) =>
    dataSourceKey === 'main' ? collectionName : `${dataSourceKey}:${collectionName}`,
  parseCollectionName: (value?: string) => {
    if (!value) {
      return [];
    }
    const parts = value.split(':');
    const collectionName = parts.pop();
    return [parts[0] ?? 'main', collectionName];
  },
  useAvailableUpstreams: () => [],
  useCurrentWorkflowContext: () => ({ config: { collection: 'posts' }, type: 'collection' }),
  useNodeContext: () => ({ id: 1 }),
}));

function renderWithForm(initialValues: unknown) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;
    return (
      <Form form={form} initialValues={initialValues}>
        <Form.Item name={['config', 'association']}>
          <AssociatedConfig />
        </Form.Item>
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

async function loadChildren(path: MockOption[]) {
  await act(async () => {
    await cascaderProps.current?.loadData?.(path);
  });
}

function getCascaderOptions() {
  const options = cascaderProps.current?.options as MockOption[] | undefined;
  expect(options).toBeTruthy();
  return options ?? [];
}

function getTriggerOptions() {
  const triggerRoot = getCascaderOptions()[1];
  expect(triggerRoot).toBeTruthy();
  const triggerData = triggerRoot?.children?.[0];
  expect(triggerData).toBeTruthy();
  return { triggerRoot, triggerData, triggerDataOptions: triggerData?.children ?? [] };
}

function findOption(options: MockOption[], value: string) {
  const option = options.find((item) => item.value === value);
  expect(option).toBeTruthy();
  return option as MockOption;
}

describe('AssociatedConfig', () => {
  beforeEach(() => {
    cascaderProps.current = undefined;
    vi.clearAllMocks();
  });

  it('keeps only to-many relation fields and branches that can reach to-many relation fields', async () => {
    renderWithForm({ config: { association: null } });

    await waitFor(() => {
      expect(cascaderProps.current?.options).toBeTruthy();
    });

    const { triggerRoot, triggerData } = getTriggerOptions();

    await loadChildren([triggerRoot, triggerData]);

    const { triggerDataOptions } = getTriggerOptions();
    expect(triggerDataOptions.map((option) => option.value)).toEqual(['comments', 'author']);

    const author = findOption(triggerDataOptions, 'author');
    await loadChildren([triggerRoot, triggerData, author]);

    const authorOptions = findOption(getTriggerOptions().triggerDataOptions, 'author').children ?? [];
    expect(authorOptions.map((option) => option.value)).toEqual(['tasks']);
  });

  it('resets aggregate field and filter when selecting or clearing an associated collection', async () => {
    const getForm = renderWithForm({
      config: {
        association: null,
        collection: 'posts',
        params: {
          field: 'amount',
          filter: { amount: { $gt: 1 } },
        },
      },
    });

    await waitFor(() => {
      expect(cascaderProps.current?.options).toBeTruthy();
    });

    const { triggerRoot, triggerData } = getTriggerOptions();
    await loadChildren([triggerRoot, triggerData]);
    const comments = findOption(getTriggerOptions().triggerDataOptions, 'comments');

    act(() => {
      cascaderProps.current?.onChange?.(
        [triggerRoot.value, triggerData.value, comments.value],
        [triggerRoot, triggerData, comments],
      );
    });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'association'])).toEqual({
        associatedCollection: 'posts',
        associatedKey: '{{$context.data.id}}',
        name: 'comments',
      });
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toBeNull();
    });

    getForm()?.setFieldValue(['config', 'params'], {
      field: 'amount',
      filter: { amount: { $gt: 1 } },
    });

    act(() => {
      cascaderProps.current?.onChange?.([], []);
    });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'association'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toBeNull();
    });
  });

  it('keeps intermediate relation navigation local until a to-many relation is selected', async () => {
    const getForm = renderWithForm({
      config: {
        association: {
          associatedCollection: 'posts',
          associatedKey: '{{$context.data.id}}',
          name: 'comments',
        },
        collection: 'comments',
      },
    });

    await waitFor(() => {
      expect(cascaderProps.current?.options).toBeTruthy();
    });

    const { triggerRoot, triggerData } = getTriggerOptions();
    await loadChildren([triggerRoot, triggerData]);
    const author = findOption(getTriggerOptions().triggerDataOptions, 'author');

    act(() => {
      cascaderProps.current?.onChange?.(
        [triggerRoot.value, triggerData.value, author.value],
        [triggerRoot, triggerData, author],
      );
    });

    await waitFor(() => {
      expect(cascaderProps.current?.value).toEqual([triggerRoot.value, triggerData.value, author.value]);
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBe('comments');
      expect(getForm()?.getFieldValue(['config', 'association'])).toEqual({
        associatedCollection: 'posts',
        associatedKey: '{{$context.data.id}}',
        name: 'comments',
      });
    });

    act(() => {
      cascaderProps.current?.onDropdownVisibleChange?.(false);
    });

    await waitFor(() => {
      expect(cascaderProps.current?.value).toEqual([triggerRoot.value, triggerData.value, 'comments']);
    });
  });

  it('clears existing associated values that resolve to a non-to-many relation field', async () => {
    const getForm = renderWithForm({
      config: {
        association: {
          associatedCollection: 'posts',
          associatedKey: '{{$context.data.id}}',
          name: 'author',
        },
        collection: 'users',
        params: {
          field: 'score',
          filter: { score: { $gt: 1 } },
        },
      },
    });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'collection'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'association'])).toEqual({});
      expect(getForm()?.getFieldValue(['config', 'params', 'field'])).toBeNull();
      expect(getForm()?.getFieldValue(['config', 'params', 'filter'])).toBeNull();
    });
  });
});
