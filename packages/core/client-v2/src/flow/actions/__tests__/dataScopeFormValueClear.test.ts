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
});
