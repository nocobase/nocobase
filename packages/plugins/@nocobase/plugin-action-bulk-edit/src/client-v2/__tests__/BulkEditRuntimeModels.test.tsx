/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const flowEngineMocks = vi.hoisted(() => ({
  addSubModelButtonProps: undefined as Record<string, unknown> | undefined,
  buildSubModelItems: vi.fn(),
  fieldModelRendererProps: undefined as Record<string, unknown> | undefined,
  flowModelRendererProps: undefined as Record<string, unknown> | undefined,
  formItemProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  const Select = ({
    children,
    disabled,
    onChange,
    value,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    onChange?: (value: number) => void;
    value?: number;
  }) =>
    ReactModule.createElement(
      'select',
      {
        'aria-label': 'bulk-edit-value-type',
        disabled,
        onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange?.(Number(event.target.value)),
        value,
      },
      children,
    );
  Select.Option = ({ children, value }: { children?: React.ReactNode; value: number }) =>
    ReactModule.createElement('option', { value }, children);

  return {
    ...actual,
    Select,
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    AddSubModelButton: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
      flowEngineMocks.addSubModelButtonProps = props;
      return <div data-testid="add-sub-model-button">{props.children}</div>;
    },
    buildSubModelItems: flowEngineMocks.buildSubModelItems,
    FieldModelRenderer: (props: Record<string, unknown>) => {
      flowEngineMocks.fieldModelRendererProps = props;
      return (
        <div>
          <input aria-label="inner-field" onChange={(event) => props.onChange?.(event)} />
          <button type="button" onClick={() => props.onChange?.({ target: { checked: true } })}>
            checked value
          </button>
          <button type="button" onClick={() => props.onChange?.('direct value')}>
            direct value
          </button>
        </div>
      );
    },
    FlowModelRenderer: (props: Record<string, unknown>) => {
      flowEngineMocks.flowModelRendererProps = props;
      return <div data-testid="flow-model-renderer">{String((props.model as { uid?: string })?.uid)}</div>;
    },
    FlowSettingsButton: (props: { children?: React.ReactNode }) => <button type="button">{props.children}</button>,
    FormItem: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
      flowEngineMocks.formItemProps = props;
      return <div data-testid="form-item">{props.children}</div>;
    },
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    SkeletonFallback: ({ style }: { style?: React.CSSProperties }) => (
      <div data-testid="skeleton-fallback" style={style} />
    ),
  };
});

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ahooks')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    useRequest: (service: () => Promise<unknown>) => {
      const [data, setData] = ReactModule.useState<unknown>();

      ReactModule.useEffect(() => {
        let mounted = true;
        service()
          .then((value) => {
            if (mounted) {
              setData(value);
            }
          })
          .catch(() => undefined);
        return () => {
          mounted = false;
        };
      }, [service]);

      return {
        data,
        loading: !data,
      };
    },
  };
});

vi.mock('../component/BulkEditFieldV2', () => ({
  BulkEditFieldV2: (props: { field?: React.ReactNode }) => <div data-testid="bulk-edit-field-v2">{props.field}</div>,
}));

import { BlockGridModel, FieldModel, FormItemModel, RecordSelectFieldModel } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { BulkEditFormItemValueType } from '../types';
import { BulkEditActionModel } from '../flow/models/BulkEditActionModel';
import { BulkEditBlockGridModel, BulkEditChildPageTabModel } from '../flow/models/BulkEditChildPageTabModel';
import { BulkEditBlockModel, BulkEditDataBlockModel } from '../flow/models/BulkEditDataBlockModel';
import { BulkEditFieldModel } from '../flow/models/BulkEditFieldModel';
import { BulkEditFormActionGroupModel } from '../flow/models/BulkEditFormActionGroupModel';
import { BulkEditFormGridModel } from '../flow/models/BulkEditFormGridModel';
import { BulkEditFormItemModel } from '../flow/models/BulkEditFormItemModel';
import { BulkEditFormModel } from '../flow/models/BulkEditFormModel';
import { BulkEditFormSubmitActionModel } from '../flow/models/BulkEditFormSubmitActionModel';

type MutableModel = {
  context?: Record<string, unknown>;
  parent?: unknown;
  props?: Record<string, unknown>;
  subModels?: Record<string, unknown>;
  uid?: string;
};

function createModelStub<T>(prototype: T, values: MutableModel) {
  const model = Object.create(prototype as object) as MutableModel;
  Object.entries(values).forEach(([key, value]) => {
    Object.defineProperty(model, key, {
      configurable: true,
      value,
      writable: true,
    });
  });
  return model as T;
}

function createContext(extra: Record<string, unknown> = {}) {
  return {
    blockModel: {
      form: {
        setFieldValue: vi.fn(),
      },
    },
    defineProperty: vi.fn(),
    t: (key: string) => key,
    ...extra,
  };
}

describe('BulkEditFieldModel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('syncs props and step params to the inner field model', () => {
    const innerField = {
      setProps: vi.fn(),
      setStepParams: vi.fn(),
    };
    const model = Object.assign(Object.create(BulkEditFieldModel.prototype), {
      subModels: {
        field: innerField,
      },
    }) as BulkEditFieldModel;
    vi.spyOn(FieldModel.prototype, 'setProps').mockImplementation(() => undefined);
    vi.spyOn(FieldModel.prototype, 'setStepParams').mockImplementation(() => undefined);

    model.setProps({ aclDisabled: true });
    model.setProps('title', 'Bulk edit title');
    model.setStepParams({
      fieldSettings: {
        init: {
          fieldPath: 'title',
        },
      },
    });
    model.setStepParams('fieldSettings', 'component', {
      use: 'InputFieldModel',
    });

    expect(innerField.setProps).toHaveBeenCalledWith({ aclDisabled: true }, undefined);
    expect(innerField.setProps).toHaveBeenCalledWith('title', 'Bulk edit title');
    expect(innerField.setStepParams).toHaveBeenCalledWith(
      {
        fieldSettings: {
          init: {
            fieldPath: 'title',
          },
        },
      },
      undefined,
      undefined,
    );
    expect(innerField.setStepParams).toHaveBeenCalledWith('fieldSettings', 'component', {
      use: 'InputFieldModel',
    });
  });

  it('keeps prop and step param updates local when the inner field model is absent', () => {
    const model = Object.assign(Object.create(BulkEditFieldModel.prototype), {
      subModels: {},
    }) as BulkEditFieldModel;
    const setProps = vi.spyOn(FieldModel.prototype, 'setProps').mockImplementation(() => undefined);
    const setStepParams = vi.spyOn(FieldModel.prototype, 'setStepParams').mockImplementation(() => undefined);

    model.setProps('title', 'Bulk edit title');
    model.setStepParams('fieldSettings', 'component', {
      use: 'InputFieldModel',
    });

    expect(setProps).toHaveBeenCalledWith('title', 'Bulk edit title');
    expect(setStepParams).toHaveBeenCalledWith('fieldSettings', 'component', {
      use: 'InputFieldModel',
    });
  });

  it('delegates missing flow settings to the inner field model', async () => {
    const openFlowSettings = vi.fn<() => Promise<string>>().mockResolvedValue('opened');
    const model = Object.assign(Object.create(BulkEditFieldModel.prototype), {
      getFlow: vi.fn(() => undefined),
      subModels: {
        field: {
          openFlowSettings,
        },
      },
    }) as BulkEditFieldModel;

    await expect(model.openFlowSettings({ flowKey: 'fieldSettings' })).resolves.toBe('opened');

    expect(openFlowSettings).toHaveBeenCalledWith({ flowKey: 'fieldSettings' });
  });

  it('falls back to the bulk edit field model flow settings when the flow exists locally', async () => {
    const superOpenFlowSettings = vi
      .spyOn(FieldModel.prototype, 'openFlowSettings')
      .mockResolvedValue('opened locally' as never);
    const model = Object.assign(Object.create(BulkEditFieldModel.prototype), {
      getFlow: vi.fn(() => ({ key: 'fieldSettings' })),
      subModels: {
        field: {
          openFlowSettings: vi.fn(),
        },
      },
    }) as BulkEditFieldModel;

    await expect(model.openFlowSettings({ flowKey: 'fieldSettings' })).resolves.toBe('opened locally');

    expect(superOpenFlowSettings).toHaveBeenCalledWith({ flowKey: 'fieldSettings' });
  });

  it('renders the bulk edit value type selector and inner field renderer', async () => {
    const formItemModel = {
      context: createContext(),
      props: {
        name: 'title',
      },
      setProps: vi.fn(),
    };
    const innerField = {
      setStepParams: vi.fn(),
    };
    const model = Object.assign(Object.create(BulkEditFieldModel.prototype), {
      getStepParams: vi.fn(() => ({
        fieldSettings: {
          init: {
            fieldPath: 'title',
          },
        },
      })),
      parent: formItemModel,
      props: {
        aclDisabled: false,
      },
      subModels: {
        field: innerField,
      },
    }) as BulkEditFieldModel;

    render(model.render());

    await waitFor(() => {
      expect(innerField.setStepParams).toHaveBeenCalledWith({
        fieldSettings: {
          init: {
            fieldPath: 'title',
          },
        },
      });
    });

    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.ChangedTo),
      },
    });
    fireEvent.change(screen.getByLabelText('inner-field'), {
      target: {
        value: 'Updated',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'checked value' }));
    fireEvent.click(screen.getByRole('button', { name: 'direct value' }));
    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.Clear),
      },
    });
    fireEvent.change(screen.getByLabelText('bulk-edit-value-type'), {
      target: {
        value: String(BulkEditFormItemValueType.RemainsTheSame),
      },
    });

    expect(formItemModel.setProps).toHaveBeenCalledWith({
      required: true,
      rules: [
        {
          required: true,
          message: 'The field value is required',
        },
      ],
    });
    expect(formItemModel.context.blockModel.form.setFieldValue).toHaveBeenCalledWith('title', null);
    expect(formItemModel.context.blockModel.form.setFieldValue).toHaveBeenLastCalledWith('title', undefined);
  });
});

describe('BulkEditFormItemModel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('lists only editable collection fields as bulk edit form items', () => {
    vi.spyOn(FormItemModel, 'defineChildren').mockReturnValue([
      {
        key: 'title',
        createModelOptions: () => ({ key: 'title', use: 'FormItemModel' }),
      },
      {
        key: 'status',
        createModelOptions: () => ({ key: 'status', use: 'FormItemModel' }),
      },
      {
        key: 'serial',
        createModelOptions: () => ({ key: 'serial', use: 'FormItemModel' }),
      },
      {
        key: 'snapshot',
        createModelOptions: () => ({ key: 'snapshot', use: 'FormItemModel' }),
      },
    ] as never);

    const children = BulkEditFormItemModel.defineChildren({
      collection: {
        getFields: () => [
          { name: 'title', interface: 'input' },
          { name: 'status', interface: 'select', uiSchema: { 'x-read-pretty': true } },
          { name: 'serial', interface: 'input', type: 'sequence' },
          { name: 'snapshot', interface: 'snapshot' },
        ],
      },
    });

    expect(children).toHaveLength(1);
    expect(children[0].createModelOptions()).toEqual({
      key: 'title',
      use: 'BulkEditFormItemModel',
    });
  });

  it('renders nested form item fields with forked context and dynamic names', () => {
    const forkContext = {
      defineProperty: vi.fn(),
    };
    const fork = {
      context: forkContext,
    };
    const fieldModel = {
      createFork: vi.fn(() => fork),
    };
    const context = createContext({
      currentObject: {
        id: 1,
      },
      fieldIndex: ['items:2'],
      fieldKey: 'items',
      pattern: 'editable',
    });
    const model = createModelStub(BulkEditFormItemModel.prototype, {
      context,
      parent: {
        context: {
          fieldPathArray: ['parent'],
        },
      },
      props: {
        aclDisabled: true,
        name: ['items', 'title'],
      },
      subModels: {
        field: fieldModel,
      },
    }) as BulkEditFormItemModel;

    render(model.renderItem());

    expect(fieldModel.createFork).toHaveBeenCalledWith({}, 'items');
    expect(forkContext.defineProperty).toHaveBeenCalledWith(
      'fieldIndex',
      expect.objectContaining({ get: expect.any(Function) }),
    );
    expect(forkContext.defineProperty).toHaveBeenCalledWith(
      'fieldKey',
      expect.objectContaining({ get: expect.any(Function) }),
    );
    expect(forkContext.defineProperty).toHaveBeenCalledWith(
      'currentObject',
      expect.objectContaining({ get: expect.any(Function) }),
    );
    expect(forkContext.defineProperty).toHaveBeenCalledWith(
      'pattern',
      expect.objectContaining({ get: expect.any(Function) }),
    );
    expect(context.defineProperty).toHaveBeenCalledWith('fieldPathArray', {
      value: ['parent', 2, 'title'],
    });
    expect(flowEngineMocks.formItemProps).toMatchObject({
      disabled: true,
      name: [2, 'title'],
      pattern: 'editable',
      validateFirst: true,
    });
    expect(flowEngineMocks.fieldModelRendererProps).toMatchObject({
      model: fork,
      name: [2, 'title'],
    });
    expect(screen.getByTestId('bulk-edit-field-v2')).toBeInTheDocument();
  });

  it('renders regular and new-record form item disabled states', () => {
    const fieldModel = {
      createFork: vi.fn(),
    };
    const model = createModelStub(BulkEditFormItemModel.prototype, {
      context: createContext({
        record: {
          __is_new__: true,
        },
      }),
      props: {
        aclCreateDisabled: true,
        name: ['title'],
      },
      subModels: {
        field: fieldModel,
      },
    }) as BulkEditFormItemModel;

    render(model.renderItem());

    expect(fieldModel.createFork).not.toHaveBeenCalled();
    expect(flowEngineMocks.formItemProps).toMatchObject({
      disabled: true,
      name: ['title'],
    });
    expect(flowEngineMocks.fieldModelRendererProps).toMatchObject({
      model: fieldModel,
      name: ['title'],
    });
  });
});

describe('bulk edit action and submit model metadata', () => {
  it('builds edit mode setting options and keeps its handler side-effect free', () => {
    const step = BulkEditActionModel.globalFlowRegistry
      ?.getFlow?.('bulkEditSettings')
      ?.getStep?.('editMode')
      ?.serialize();

    expect(step?.uiMode?.({} as never)).toMatchObject({
      key: 'value',
      props: {
        options: [{ value: 'selected' }, { value: 'all' }],
      },
      type: 'select',
    });
    expect(step?.defaultParams).toEqual({ value: 'selected' });
    expect(step?.handler?.({} as never, {} as never)).toBeUndefined();
  });

  it('shows submit action only inside the bulk edit form model', () => {
    const hide = BulkEditFormSubmitActionModel.meta?.hide;
    const bulkEditFormModel = Object.create(BulkEditFormModel.prototype);

    expect(hide?.({ model: bulkEditFormModel } as never)).toBe(false);
    expect(hide?.({ model: {} } as never)).toBe(true);
  });

  it('creates bulk edit form model options without view input args', async () => {
    await expect(BulkEditFormModel.meta?.createModelOptions?.({} as never, {} as never)).resolves.toMatchObject({
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: undefined,
            dataSourceKey: undefined,
          },
        },
      },
    });
  });
});

describe('bulk edit record select settings', () => {
  it('uses stored bulk edit title field names and hides the default title field setting', async () => {
    const titleFieldAction = (
      RecordSelectFieldModel as never as { actionRegistry: { getAction: (name: string) => any } }
    ).actionRegistry.getAction('titleField');
    const bulkEditFieldModel = Object.create(BulkEditFieldModel.prototype);

    expect(
      titleFieldAction.defaultParams({
        model: { parent: bulkEditFieldModel, props: { fieldNames: { label: 'name', value: 'id' } } },
      }),
    ).toEqual({
      label: 'name',
    });
    await expect(titleFieldAction.hideInSettings({ model: { parent: bulkEditFieldModel } })).resolves.toBe(true);
    await expect(titleFieldAction.hideInSettings({ model: { parent: null } })).resolves.toBeTypeOf('boolean');
  });

  it('hides quick create settings for bulk edit form scenes', () => {
    const quickCreateStep = RecordSelectFieldModel.globalFlowRegistry
      ?.getFlow?.('selectSettings')
      ?.getStep?.('quickCreate')
      ?.serialize();

    expect(
      quickCreateStep?.hideInSettings?.({
        blockModel: {
          constructor: {
            _isScene: (scene: string) => scene === 'bulkEditForm',
          },
        },
      }),
    ).toBe(true);
    expect(
      quickCreateStep?.hideInSettings?.({
        blockModel: {
          constructor: {
            _isScene: () => false,
          },
        },
      }),
    ).toBeTypeOf('boolean');
  });
});

describe('bulk edit block and grid models', () => {
  beforeEach(() => {
    flowEngineMocks.buildSubModelItems.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('filters bulk edit data block children by scene support', async () => {
    flowEngineMocks.buildSubModelItems.mockReturnValue(
      vi.fn().mockResolvedValue([
        { key: 'form', useModel: 'BulkEditFormModel' },
        { key: 'table', useModel: 'TableBlockModel' },
        { key: 'calendar', useModel: 'CalendarBlockModel' },
      ]),
    );
    const ctx = {
      engine: {
        getModelClass: vi.fn((useModel: string) => ({
          _isScene: (scene: string) => useModel === 'TableBlockModel' && scene === 'bulkEditForm',
        })),
      },
      view: {
        inputArgs: {
          scene: 'bulkEditForm',
        },
      },
    };

    await expect(BulkEditDataBlockModel.meta?.children?.(ctx as never)).resolves.toEqual([
      { key: 'form', useModel: 'BulkEditFormModel' },
      { key: 'table', useModel: 'TableBlockModel' },
    ]);

    ctx.view.inputArgs.scene = 'table';

    await expect(BulkEditDataBlockModel.meta?.children?.(ctx as never)).resolves.toEqual([
      { key: 'form', useModel: 'BulkEditFormModel' },
    ]);
  });

  it('keeps only markdown blocks in the extra block model picker', async () => {
    flowEngineMocks.buildSubModelItems.mockReturnValue(
      vi.fn().mockResolvedValue([
        { key: 'markdown', useModel: 'MarkdownBlockModel' },
        { key: 'iframe', useModel: 'IframeBlockModel' },
      ]),
    );

    await expect(BulkEditBlockModel.meta?.children?.({} as never)).resolves.toEqual([
      { key: 'markdown', useModel: 'MarkdownBlockModel' },
    ]);
  });

  it('injects bulk edit form scene into block grid context on init', () => {
    vi.spyOn(BlockGridModel.prototype, 'onInit').mockImplementation(() => undefined);
    const defineProperty = vi.fn();
    const model = createModelStub(BulkEditBlockGridModel.prototype, {
      context: {
        defineProperty,
        view: {
          inputArgs: {
            viewUid: 'bulk-edit-action',
          },
        },
      },
    }) as BulkEditBlockGridModel;

    model.onInit({ inputArgs: true });

    expect(model.subModelBaseClasses).toEqual(['BulkEditDataBlockModel', 'BulkEditBlockModel']);
    expect(defineProperty).toHaveBeenCalledWith('view', {
      value: {
        inputArgs: {
          scene: 'bulkEditForm',
          viewUid: 'bulk-edit-action',
        },
      },
    });
  });

  it('keeps block grid context unchanged when init args do not include input args', () => {
    vi.spyOn(BlockGridModel.prototype, 'onInit').mockImplementation(() => undefined);
    const defineProperty = vi.fn();
    const model = createModelStub(BulkEditBlockGridModel.prototype, {
      context: {
        defineProperty,
      },
    }) as BulkEditBlockGridModel;

    model.onInit({});

    expect(defineProperty).not.toHaveBeenCalled();
  });

  it('sets mobile and desktop grid gaps from the block grid settings flow', async () => {
    const handler = BulkEditBlockGridModel.globalFlowRegistry
      ?.getFlow?.('blockGridSettings')
      ?.getStep?.('grid')
      ?.serialize().handler;
    const model = {
      setProps: vi.fn(),
    };

    expect(handler).toBeTypeOf('function');
    await handler?.(
      {
        isMobileLayout: true,
        model,
        themeToken: {
          marginBlock: 24,
        },
      } as never,
      {} as never,
    );
    await handler?.(
      {
        isMobileLayout: false,
        model,
        themeToken: {
          marginBlock: 24,
        },
      } as never,
      {} as never,
    );

    expect(model.setProps).toHaveBeenNthCalledWith(1, 'rowGap', 12);
    expect(model.setProps).toHaveBeenNthCalledWith(2, 'colGap', 24);
    expect(model.setProps).toHaveBeenNthCalledWith(3, 'rowGap', 24);
    expect(model.setProps).toHaveBeenNthCalledWith(4, 'colGap', 24);
  });

  it('loads the async bulk edit grid model from the child page tab renderer', async () => {
    const addDelegate = vi.fn();
    const loadOrCreateModel = vi.fn().mockResolvedValue({
      context: {
        addDelegate,
      },
      uid: 'bulk-edit-grid',
    });
    const model = createModelStub(BulkEditChildPageTabModel.prototype, {
      context: {
        engine: {
          loadOrCreateModel,
        },
        isMobileLayout: false,
        model: {
          uid: 'tab-model',
        },
        themeToken: {
          marginBlock: 16,
        },
      },
      uid: 'tab-model',
    }) as BulkEditChildPageTabModel;

    render(model.renderChildren());

    expect(await screen.findByTestId('flow-model-renderer')).toHaveTextContent('bulk-edit-grid');
    expect(loadOrCreateModel).toHaveBeenCalledWith({
      async: true,
      parentId: 'tab-model',
      subKey: 'grid',
      subType: 'object',
      use: 'BulkEditBlockGridModel',
    });
    expect(addDelegate).toHaveBeenCalledWith(model.context);
  });

  it('keeps the child page tab renderer in fallback when the async model has no uid', async () => {
    const loadOrCreateModel = vi.fn().mockResolvedValue({
      context: {
        addDelegate: vi.fn(),
      },
    });
    const model = createModelStub(BulkEditChildPageTabModel.prototype, {
      context: {
        engine: {
          loadOrCreateModel,
        },
        isMobileLayout: true,
        model: {
          uid: 'tab-model',
        },
        themeToken: {
          marginBlock: 16,
        },
      },
      uid: 'tab-model',
    }) as BulkEditChildPageTabModel;

    render(model.renderChildren());

    expect(await screen.findByTestId('skeleton-fallback')).toHaveStyle({ margin: '8px' });
  });

  it('renders the bulk edit form grid add-field action', () => {
    const model = createModelStub(BulkEditFormGridModel.prototype, {
      context: {
        getModelClassName: vi.fn(() => 'BulkEditFormItemModel'),
      },
      translate: (key: string) => `t:${key}`,
    }) as BulkEditFormGridModel;

    render(model.renderAddSubModelButton());

    expect(screen.getByRole('button', { name: 't:Fields' })).toBeInTheDocument();
    expect(flowEngineMocks.addSubModelButtonProps).toMatchObject({
      keepDropdownOpen: true,
      model,
      subModelBaseClasses: ['BulkEditFormItemModel'],
      subModelKey: 'items',
    });
  });
});

describe('BulkEditFormActionGroupModel', () => {
  it('loads the bulk edit form action group model class', () => {
    expect(BulkEditFormActionGroupModel.name).toBe('BulkEditFormActionGroupModel');
  });
});
