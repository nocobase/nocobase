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
});
