/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { patchGridOptionsFromTemplateRoot } from '../templateCopy';

describe('patchGridOptionsFromTemplateRoot', () => {
  it('fills missing layout/linkageRules from template root', () => {
    const engine = new FlowEngine();
    class RootModel extends FlowModel {}
    engine.registerModels({ RootModel });

    const root = engine.createModel<RootModel>({
      uid: 'tpl-root',
      use: 'RootModel',
      stepParams: {
        formModelSettings: { layout: { layout: 'horizontal', labelWidth: 160 } },
        eventSettings: { linkageRules: { value: [{ key: 'r1' }] } },
      },
    });

    const gridOptions: any = { uid: 'dup-grid', use: 'GridModel', stepParams: {} };
    const merged = patchGridOptionsFromTemplateRoot(root, gridOptions);
    expect(merged.patched).toBe(true);
    expect(merged.options.stepParams.formModelSettings.layout).toEqual({ layout: 'horizontal', labelWidth: 160 });
    expect(merged.options.stepParams.eventSettings.linkageRules).toEqual({ value: [{ key: 'r1' }] });

    // should be deep-cloned (mutating merged options must not affect template root)
    merged.options.stepParams.formModelSettings.layout.layout = 'vertical';
    expect(root.getStepParams('formModelSettings', 'layout')).toEqual({ layout: 'horizontal', labelWidth: 160 });
  });

  it('does not override existing grid values', () => {
    const engine = new FlowEngine();
    class RootModel extends FlowModel {}
    engine.registerModels({ RootModel });

    const root = engine.createModel<RootModel>({
      uid: 'tpl-root',
      use: 'RootModel',
      stepParams: {
        formModelSettings: { layout: { layout: 'horizontal', labelWidth: 160 } },
        eventSettings: { linkageRules: { value: [{ key: 'r1' }] } },
      },
    });

    const gridOptions: any = {
      uid: 'dup-grid',
      use: 'GridModel',
      stepParams: {
        formModelSettings: { layout: { layout: 'vertical', labelWidth: 120 } },
        eventSettings: { linkageRules: { value: [] } },
      },
    };
    const merged = patchGridOptionsFromTemplateRoot(root, gridOptions);
    expect(merged.patched).toBe(false);
    expect(merged.options.stepParams.formModelSettings.layout).toEqual({ layout: 'vertical', labelWidth: 120 });
    expect(merged.options.stepParams.eventSettings.linkageRules).toEqual({ value: [] });
  });
});
