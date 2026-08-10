/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import { ensureFormValueDrivenDataScopeClear } from '../../utils/dataScopeFormValueClear';

describe('ensureFormValueDrivenDataScopeClear', () => {
  it('clears field value when referenced formValues dependency changes', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: { form: {} },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'schoolId', operator: '$eq', value: '{{ ctx.formValues.school.id }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedValues: { school: { id: 2 } },
      allValues: { school: { id: 2 }, class: { id: 1 } },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear when dependency did not change', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: { form: {} },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'schoolId', operator: '$eq', value: '{{ ctx.formValues.school.id }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedValues: { class: null },
      allValues: { school: { id: 2 }, class: null },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('maps ctx.item.value dependencies to the current row path', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: { form: {} },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['users:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'nickname', operator: '$eq', value: '{{ ctx.item.value.nickname }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['users', 0, 'nickname']],
    });
    expect(onChange).not.toHaveBeenCalled();

    emitter.emit('formValuesChange', {
      changedPaths: [['users', 1, 'nickname']],
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('parses object-patch changedPaths before matching ctx.item.value dependencies', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: { form: {} },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['users:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'nickname', operator: '$eq', value: '{{ ctx.item.value.nickname }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['users[1].nickname']],
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('maps root parentItem.value dependencies to the root form path', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: { form: {} },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['roles:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.item.parentItem.value.departmentId }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['roles', 0, 'name']],
    });
    expect(onChange).not.toHaveBeenCalled();

    emitter.emit('formValuesChange', {
      changedPaths: [['departmentId']],
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear a popup form field when data scope depends on the external parent item', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: { staff_m2o: null },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 10 },
        onChange,
      },
      context: {
        blockModel: formBlock,
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'orgId', operator: '$eq', value: '{{ ctx.item.parentItem.value.org_m2o.id }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['staff_m2o']],
      allValues: { staff_m2o: { id: 10 } },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('maps popup current item dependencies to the popup form root', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_m2o: { id: 1 },
          staff_m2o: { id: 10 },
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 10 },
        onChange,
      },
      context: {
        blockModel: formBlock,
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'orgId', operator: '$eq', value: '{{ ctx.item.value.org_m2o.id }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['staff_m2o']],
      allValues: {
        org_m2o: { id: 1 },
        staff_m2o: { id: 10 },
      },
    });
    expect(onChange).not.toHaveBeenCalled();

    emitter.emit('formValuesChange', {
      changedPaths: [['org_m2o']],
      allValues: {
        org_m2o: { id: 2 },
        staff_m2o: { id: 10 },
      },
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear a row field when a sibling field changes but the item dependency value is unchanged', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [{ companyName: 'a', user_m2o: { id: 1 }, staff_m2o: null }],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 0]],
      allValues: {
        org_o2m: [{ companyName: 'a', user_m2o: { id: 1 }, staff_m2o: { id: 10 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears a row field when a coarse row change includes an actual item dependency value change', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [{ companyName: 'a', user_m2o: { id: 1 } }],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 0]],
      allValues: {
        org_o2m: [{ companyName: 'b', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('clears a dependent row field when the sibling relation used by data scope changes', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [{ companyName: 'a', user_m2o: { id: 1 }, staff_m2o: { id: 10 } }],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 10 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'id', operator: '$eq', value: '{{ ctx.item.value.user_m2o.id }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 0]],
      allValues: {
        org_o2m: [{ companyName: 'a', user_m2o: { id: 2 }, staff_m2o: { id: 10 } }],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear a row field when another row is removed after it', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not clear a row field when another row is removed before it and the row index changes', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not clear a row field after reindexing when rows use a custom filter target key', () => {
    const emitter = new EventEmitter();
    const usersField = {
      targetCollection: { filterTargetKey: 'name' },
      isAssociationField: () => true,
    };
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        collection: { getField: (name: string) => (name === 'org_o2m' ? usersField : null) },
        formValues: {
          org_o2m: [
            { name: 'alice', companyName: 'a', user_m2o: { id: 1 } },
            { name: 'bob', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ name: 'bob', companyName: 'b', user_m2o: { id: 2 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not clear a row field after reindexing when rows use a composite filter target key', () => {
    const emitter = new EventEmitter();
    const usersField = {
      targetCollection: { filterTargetKey: ['tenantId', 'code'] },
      isAssociationField: () => true,
    };
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        collection: { getField: (name: string) => (name === 'org_o2m' ? usersField : null) },
        formValues: {
          org_o2m: [
            { tenantId: 1, code: 'a', companyName: 'a', user_m2o: { id: 1 } },
            { tenantId: 1, code: 'b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ tenantId: 1, code: 'b', companyName: 'b', user_m2o: { id: 2 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps tracking a row after its custom filter target key changes', () => {
    const emitter = new EventEmitter();
    const usersField = {
      targetCollection: { filterTargetKey: 'name' },
      isAssociationField: () => true,
    };
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        collection: { getField: (name: string) => (name === 'org_o2m' ? usersField : null) },
        formValues: {
          org_o2m: [
            { name: 'alice', companyName: 'a', user_m2o: { id: 1 } },
            { name: 'bob', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'name']],
      allValues: {
        org_o2m: [
          { name: 'alice', companyName: 'a', user_m2o: { id: 1 } },
          { name: 'robert', companyName: 'b', user_m2o: { id: 2 } },
        ],
      },
    });

    expect(onChange).not.toHaveBeenCalled();

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'companyName']],
      allValues: {
        org_o2m: [
          { name: 'alice', companyName: 'a', user_m2o: { id: 1 } },
          { name: 'robert', companyName: 'c', user_m2o: { id: 2 } },
        ],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('keeps tracking a row after its temporary identity changes to a persisted key', () => {
    const emitter = new EventEmitter();
    const usersField = {
      targetCollection: { filterTargetKey: 'id' },
      isAssociationField: () => true,
    };
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        collection: { getField: (name: string) => (name === 'org_o2m' ? usersField : null) },
        formValues: {
          org_o2m: [
            { id: 1, companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', __is_new__: true, companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'id']],
      allValues: {
        org_o2m: [
          { id: 1, companyName: 'a', user_m2o: { id: 1 } },
          { __index__: 'row-b', id: 2, companyName: 'b', user_m2o: { id: 2 } },
        ],
      },
    });

    expect(onChange).not.toHaveBeenCalled();

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'companyName']],
      allValues: {
        org_o2m: [
          { id: 1, companyName: 'a', user_m2o: { id: 1 } },
          { __index__: 'row-b', id: 2, companyName: 'c', user_m2o: { id: 2 } },
        ],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear a stale row field binding when its row has been removed', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not reattach a stale row field binding to the next row after deletion', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
            { __index__: 'row-c', companyName: 'c', user_m2o: { id: 3 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [
          { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
          { __index__: 'row-c', companyName: 'c', user_m2o: { id: 3 } },
        ],
      },
    });

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'companyName']],
      allValues: {
        org_o2m: [
          { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
          { __index__: 'row-c', companyName: 'changed', user_m2o: { id: 3 } },
        ],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not reattach a stale row field binding when the first stale event is an old index child change', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
            { __index__: 'row-c', companyName: 'c', user_m2o: { id: 3 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: '{{ ctx.item.value.companyName }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m', 1, 'companyName']],
      allValues: {
        org_o2m: [
          { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
          { __index__: 'row-c', companyName: 'changed', user_m2o: { id: 3 } },
        ],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not clear a stale removed row binding when data scope depends on the item length', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'count', operator: '$eq', value: '{{ ctx.item.length }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('still clears a row field when data scope explicitly depends on the item length', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'count', operator: '$eq', value: '{{ ctx.item.length }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear a row field when data scope depends on the item index and another row is removed after it', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 1 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:0'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'index', operator: '$eq', value: '{{ ctx.item.index }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } }],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears a row field when data scope depends on the item index and the row index changes', () => {
    const emitter = new EventEmitter();
    const formBlock = {
      uid: 'form-1',
      disposed: false,
      emitter,
      context: {
        form: {},
        formValues: {
          org_o2m: [
            { __index__: 'row-a', companyName: 'a', user_m2o: { id: 1 } },
            { __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } },
          ],
        },
      },
    };

    const onChange = vi.fn();
    const model: any = {
      disposed: false,
      props: {
        value: { id: 2 },
        onChange,
      },
      context: {
        blockModel: formBlock,
        fieldIndex: ['org_o2m:1'],
      },
    };

    const ctx: any = {
      model,
      flowKey: 'selectSettings',
    };

    const filter = {
      logic: '$and',
      items: [{ path: 'index', operator: '$eq', value: '{{ ctx.item.index }}' }],
    };

    ensureFormValueDrivenDataScopeClear(ctx, filter);

    emitter.emit('formValuesChange', {
      changedPaths: [['org_o2m']],
      allValues: {
        org_o2m: [{ __index__: 'row-b', companyName: 'b', user_m2o: { id: 2 } }],
      },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
