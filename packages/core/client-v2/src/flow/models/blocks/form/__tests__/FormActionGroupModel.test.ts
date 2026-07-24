/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { FormActionGroupModel, FormActionModel } from '../../../..';

describe('FormActionGroupModel', () => {
  it('filters addable form actions by allowedFormActionModelNames', async () => {
    class AllowedFormActionModel extends FormActionModel {}
    class HiddenFormActionModel extends FormActionModel {}

    AllowedFormActionModel.define({
      label: 'Allowed action',
      sort: 10,
    });
    HiddenFormActionModel.define({
      label: 'Hidden action',
      sort: 20,
    });

    const engine = new FlowEngine();
    engine.registerModels({
      FormActionModel,
      HiddenFormActionModel,
    });
    engine.registerModelLoaders({
      AllowedFormActionModel: {
        loader: async () => ({ AllowedFormActionModel }),
      },
    });

    const items = await FormActionGroupModel.defineChildren({
      engine,
      allowedFormActionModelNames: ['AllowedFormActionModel'],
    } as any);

    expect(items.map((item: any) => item.useModel)).toEqual(['AllowedFormActionModel']);
  });

  it('filters nested provider items by their useModel', async () => {
    class AllowedProviderActionModel extends FormActionModel {}
    class HiddenProviderActionModel extends FormActionModel {}

    const engine = new FlowEngine();
    engine.registerModels({
      FormActionModel,
      AllowedProviderActionModel,
      HiddenProviderActionModel,
    });
    const dispose = FormActionGroupModel.registerMenuItemProvider('nested-provider', () => ({
      key: 'provider-group',
      label: 'Provider group',
      children: [
        { key: 'allowed-provider', useModel: 'AllowedProviderActionModel' },
        { key: 'hidden-provider', useModel: 'HiddenProviderActionModel' },
      ],
    }));

    try {
      const items = await FormActionGroupModel.defineChildren({
        engine,
        allowedFormActionModelNames: ['AllowedProviderActionModel'],
      } as any);
      const providerGroup = items.find((item) => item.key === 'provider-group');
      const children = Array.isArray(providerGroup?.children) ? providerGroup.children : [];

      expect(children.map((item) => item.useModel)).toEqual(['AllowedProviderActionModel']);
    } finally {
      dispose();
    }
  });
});
