/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { linkageAssignField, setFieldsDefaultValue, subFormLinkageAssignField } from '../linkageRules';

describe('linkage assign actions - legacy params', () => {
  it('linkageAssignField should apply legacy object params at runtime', () => {
    const fieldModel: any = { uid: 'f1', fieldPath: 'a.b' };
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [fieldModel] } } } },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    linkageAssignField.handler(ctx, { value: { field: 'legacyUid', assignValue: 'x' }, setProps });

    expect(setProps).toHaveBeenCalledWith(fieldModel, { value: 'x' });
  });

  it('setFieldsDefaultValue should apply legacy object params at runtime', () => {
    const fieldModel: any = { uid: 'f1', fieldPath: 'a.b' };
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [fieldModel] } } } },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    setFieldsDefaultValue.handler(ctx, { value: { field: 'legacyUid', initialValue: 123 }, setProps });

    expect(setProps).toHaveBeenCalledWith(fieldModel, { initialValue: 123 });
  });

  it('linkageAssignField should keep default mode behavior in update form', () => {
    const fieldModel: any = { uid: 'f-update-default', fieldPath: 'a.b' };
    const ctx: any = {
      model: {
        getAclActionName: vi.fn(() => 'update'),
        subModels: { grid: { subModels: { items: [fieldModel] } } },
      },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    linkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-update',
          enable: true,
          targetPath: 'a.b',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'default-in-update',
        },
      ],
      setProps,
    });

    expect(setProps).toHaveBeenCalledWith(fieldModel, { initialValue: 'default-in-update' });
    expect(setProps).not.toHaveBeenCalledWith(fieldModel, { value: 'default-in-update' });
  });

  it('subFormLinkageAssignField should apply legacy object params at runtime', () => {
    const forkModel: any = {
      uid: 'f1',
      fieldPath: 'a.b',
      isFork: true,
      context: { defineProperty: vi.fn() },
    };
    const formItemModel: any = {
      uid: 'f1',
      fieldPath: 'a.b',
      getFork: vi.fn(() => undefined),
      createFork: vi.fn(() => forkModel),
    };
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [formItemModel] } } }, context: { fieldKey: 'k' } },
      engine: {
        getModel: vi.fn((uid: string) => (uid === 'legacyUid' ? { fieldPath: 'a.b' } : formItemModel)),
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    subFormLinkageAssignField.handler(ctx, { value: { field: 'legacyUid', assignValue: 'y' }, setProps });

    expect(setProps).toHaveBeenCalledWith(forkModel, { value: 'y' });
  });

  it('subFormLinkageAssignField should normalize nested relative targetPath by host fieldPath', () => {
    const ctx: any = {
      model: {
        uid: 'sub-form-model',
        parent: {
          getStepParams: (flowKey: string, stepKey: string) => {
            if (flowKey === 'fieldSettings' && stepKey === 'init') {
              return { fieldPath: 'M2M.M2M' };
            }
            return {};
          },
        },
        subModels: { grid: { subModels: { items: [] } } },
      },
      engine: {
        getModel: vi.fn(() => null),
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();
    const addFormValuePatch = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r1',
          enable: true,
          targetPath: 'Name',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: '333',
        },
      ],
      setProps,
      addFormValuePatch,
    });

    expect(setProps).not.toHaveBeenCalled();
    expect(addFormValuePatch).toHaveBeenCalledWith({
      path: 'M2M.M2M.Name',
      value: '333',
      whenEmpty: false,
    });
    expect(addFormValuePatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'Name',
      }),
    );
  });

  it('subFormLinkageAssignField should use default mode for new item in update form', () => {
    const formItemModel: any = {
      uid: 'f-default-new',
      fieldPath: 'a.b',
      getStepParams: vi.fn(() => ({ fieldPath: 'a.b' })),
      getFork: vi.fn(() => undefined),
      createFork: vi.fn(),
    };
    const ctx: any = {
      model: {
        getAclActionName: vi.fn(() => 'update'),
        context: {},
        subModels: { grid: { subModels: { items: [formItemModel] } } },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
      item: {
        __is_new__: true,
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-new',
          enable: true,
          targetPath: 'a.b',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'new-default',
        },
      ],
      setProps,
    });

    expect(setProps).toHaveBeenCalledWith(formItemModel, { initialValue: 'new-default' });
    expect(setProps).not.toHaveBeenCalledWith(formItemModel, { value: 'new-default' });
  });

  it('subFormLinkageAssignField should skip default mode for existing item in update form', () => {
    const formItemModel: any = {
      uid: 'f-default-existing',
      fieldPath: 'a.b',
      getStepParams: vi.fn(() => ({ fieldPath: 'a.b' })),
      getFork: vi.fn(() => undefined),
      createFork: vi.fn(),
    };
    const ctx: any = {
      model: {
        getAclActionName: vi.fn(() => 'update'),
        context: {},
        subModels: { grid: { subModels: { items: [formItemModel] } } },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
      item: {
        __is_new__: false,
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();
    const addFormValuePatch = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-existing',
          enable: true,
          targetPath: 'a.b',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'should-skip',
        },
      ],
      setProps,
      addFormValuePatch,
    });

    expect(setProps).not.toHaveBeenCalled();
    expect(addFormValuePatch).not.toHaveBeenCalled();
  });

  it('subFormLinkageAssignField should treat to-one item as existing when __is_new__ is not true in update form', () => {
    const formItemModel: any = {
      uid: 'f-default-to-one',
      fieldPath: 'a.b',
      getStepParams: vi.fn(() => ({ fieldPath: 'a.b' })),
      getFork: vi.fn(() => undefined),
      createFork: vi.fn(),
    };
    const ctx: any = {
      model: {
        getAclActionName: vi.fn(() => 'update'),
        context: {},
        subModels: { grid: { subModels: { items: [formItemModel] } } },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
      // 对一子表单未显式标记 __is_new__=true
      item: {},
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-to-one',
          enable: true,
          targetPath: 'a.b',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'to-one-default',
        },
      ],
      setProps,
    });

    expect(setProps).not.toHaveBeenCalled();
  });

  it('subFormLinkageAssignField should keep assign mode behavior in update form', () => {
    const formItemModel: any = {
      uid: 'f-assign-update',
      fieldPath: 'a.b',
      getStepParams: vi.fn(() => ({ fieldPath: 'a.b' })),
      getFork: vi.fn(() => undefined),
      createFork: vi.fn(),
    };
    const ctx: any = {
      model: {
        getAclActionName: vi.fn(() => 'update'),
        context: {},
        subModels: { grid: { subModels: { items: [formItemModel] } } },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
      item: {
        __is_new__: false,
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const setProps = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-assign-update',
          enable: true,
          targetPath: 'a.b',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: 'assign-value',
        },
      ],
      setProps,
    });

    expect(setProps).toHaveBeenCalledWith(formItemModel, { value: 'assign-value' });
  });

  it('subFormLinkageAssignField should skip default patch for explicit property path after user clear', () => {
    const ctx: any = {
      model: {
        uid: 'sub-form-explicit-path',
        getAclActionName: vi.fn(() => 'create'),
        context: {},
        parent: {
          getStepParams: (flowKey: string, stepKey: string) => {
            if (flowKey === 'fieldSettings' && stepKey === 'init') {
              return { fieldPath: 'M2M.M2M' };
            }
            return {};
          },
        },
        subModels: { grid: { subModels: { items: [] } } },
      },
      engine: {
        getModel: vi.fn(() => null),
      },
      app: { jsonLogic: { apply: vi.fn() } },
    };
    const addFormValuePatch = vi.fn();

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-path-1',
          enable: true,
          targetPath: 'Name',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'default-1',
        },
      ],
      addFormValuePatch,
      setProps: vi.fn(),
    });

    expect(addFormValuePatch).toHaveBeenCalledTimes(1);
    expect(addFormValuePatch).toHaveBeenNthCalledWith(1, {
      path: 'M2M.M2M.Name',
      value: 'default-1',
      whenEmpty: true,
    });

    ctx.inputArgs = {
      source: 'user',
      changedPaths: [['M2M', 'M2M', 'Name']],
    };

    subFormLinkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-default-path-2',
          enable: true,
          targetPath: 'Name',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: 'default-2',
        },
      ],
      addFormValuePatch,
      setProps: vi.fn(),
    });

    expect(addFormValuePatch).toHaveBeenCalledTimes(1);
  });

  it('linkageAssignField should evaluate RunJS value before assign', async () => {
    const fieldModel: any = { uid: 'f-runjs-assign', fieldPath: 'a.b' };
    const runjs = vi.fn(async () => ({ success: true, value: 'from-runjs' }));
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [fieldModel] } } } },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
      runjs,
    };
    const setProps = vi.fn();

    await linkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-runjs-assign',
          enable: true,
          targetPath: 'a.b',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: { code: 'return 1;', version: 'v1' },
        },
      ],
      setProps,
    });

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(setProps).toHaveBeenCalledWith(fieldModel, { value: 'from-runjs' });
  });

  it('linkageAssignField should skip assign when RunJS evaluation fails', async () => {
    const fieldModel: any = { uid: 'f-runjs-fail', fieldPath: 'a.b' };
    const runjs = vi.fn(async () => ({ success: false }));
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [fieldModel] } } } },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
      runjs,
    };
    const setProps = vi.fn();

    await linkageAssignField.handler(ctx, {
      value: [
        {
          key: 'r-runjs-fail',
          enable: true,
          targetPath: 'a.b',
          mode: 'assign',
          condition: { logic: '$and', items: [] },
          value: { code: 'throw new Error("x")', version: 'v1' },
        },
      ],
      setProps,
    });

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(setProps).not.toHaveBeenCalled();
  });

  it('setFieldsDefaultValue should evaluate RunJS value before apply', async () => {
    const fieldModel: any = { uid: 'f-runjs-default', fieldPath: 'a.b' };
    const runjs = vi.fn(async () => ({ success: true, value: 123 }));
    const ctx: any = {
      model: { subModels: { grid: { subModels: { items: [fieldModel] } } } },
      engine: { getModel: vi.fn(() => ({ fieldPath: 'a.b' })) },
      app: { jsonLogic: { apply: vi.fn() } },
      runjs,
    };
    const setProps = vi.fn();

    await setFieldsDefaultValue.handler(ctx, {
      value: [
        {
          key: 'r-runjs-default',
          enable: true,
          targetPath: 'a.b',
          mode: 'default',
          condition: { logic: '$and', items: [] },
          value: { code: 'return 123;', version: 'v1' },
        },
      ],
      setProps,
    });

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(setProps).toHaveBeenCalledWith(fieldModel, { initialValue: 123 });
  });
});
