/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { subFormLinkageSetFieldProps } from '../linkageRules';

describe('subFormLinkageSetFieldProps action', () => {
  it('should not throw when engine.getModel returns undefined', () => {
    const setProps = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ctx: any = {
      model: {
        uid: 'sub-form-uid',
        context: {
          fieldKey: ['roles:0'],
        },
      },
      engine: {
        getModel: vi.fn(() => undefined),
      },
    };

    expect(() => {
      subFormLinkageSetFieldProps.handler(ctx, {
        value: {
          fields: ['missing-field-uid'],
          state: 'disabled',
        },
        setProps,
      });
    }).not.toThrow();

    expect(setProps).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[subFormLinkageSetFieldProps] Target field model not found', {
      fieldUid: 'missing-field-uid',
      modelUid: 'sub-form-uid',
    });

    warnSpy.mockRestore();
  });

  it('should fallback to master model when fieldKey is missing', () => {
    const setProps = vi.fn();
    const getFork = vi.fn();
    const formItemModel: any = {
      uid: 'field-1',
      getFork,
    };

    const ctx: any = {
      model: {
        context: {},
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
    };

    subFormLinkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['field-1'],
        state: 'disabled',
      },
      setProps,
    });

    expect(getFork).not.toHaveBeenCalled();
    expect(setProps).toHaveBeenCalledWith(formItemModel, { disabled: true });
  });

  it('should fallback to master model when fork model not found', () => {
    const setProps = vi.fn();
    const getFork = vi.fn(() => undefined);
    const formItemModel: any = {
      uid: 'field-2',
      getFork,
    };

    const ctx: any = {
      model: {
        context: {
          fieldKey: ['roles:0'],
        },
      },
      engine: {
        getModel: vi.fn(() => formItemModel),
      },
    };

    subFormLinkageSetFieldProps.handler(ctx, {
      value: {
        fields: ['field-2'],
        state: 'enabled',
      },
      setProps,
    });

    expect(getFork).toHaveBeenCalledTimes(1);
    expect(getFork).toHaveBeenCalledWith('roles:0:field-2');
    expect(setProps).toHaveBeenCalledWith(formItemModel, { disabled: false });
  });
});
