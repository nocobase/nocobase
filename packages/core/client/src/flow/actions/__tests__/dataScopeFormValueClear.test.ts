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
import { ensureFormValueDrivenDataScopeClear } from '../dataScopeFormValueClear';

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
});
