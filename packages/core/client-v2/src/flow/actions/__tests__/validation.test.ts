/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { validation } from '../validation';

vi.mock('../../../flow-compat', () => ({ FieldValidation: () => null }));

describe('validation action', () => {
  it('rejects excess decimal places with a translated error and retains collection rules', async () => {
    const setProps = vi.fn();
    const collectionRule = { validator: vi.fn().mockResolvedValue(undefined) };
    const t = vi.fn((key: string, options?: Record<string, unknown>) => {
      return `${options?.label} 精度不能超过 ${options?.limit} 位小数`;
    });
    const ctx = {
      model: {
        props: { label: '工龄' },
        collectionField: { getComponentProps: () => ({ rules: [collectionRule] }) },
        setProps,
      },
      t,
    } as unknown as Parameters<typeof validation.handler>[0];

    await validation.handler(ctx, {
      validation: { type: 'number', rules: [{ name: 'precision', args: { limit: 2 } }] },
    });

    const { rules } = setProps.mock.calls[0][0] as {
      rules: { validator: (rule: unknown, value: unknown) => Promise<void> }[];
    };
    expect(rules).toHaveLength(2);
    expect(rules[0]).toBe(collectionRule);
    await expect(rules[1].validator({}, 39.2234)).rejects.toBe('工龄 精度不能超过 2 位小数');
    expect(t).toHaveBeenCalledWith(
      'number.precision',
      expect.objectContaining({ ns: 'data-source-main', label: '工龄', limit: 2 }),
    );
    await expect(rules[1].validator({}, 39.22)).resolves.toBeUndefined();
    await expect(rules[1].validator({}, null)).resolves.toBeUndefined();
  });
});
