/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowRuntimeContext } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { ActionModel } from '../ActionModel';

class IconActionModel extends ActionModel {
  defaultProps = {
    type: 'default' as const,
    title: 'Icon action',
    icon: 'PlusOutlined',
  };
}

class PlainActionModel extends ActionModel {
  defaultProps = {
    type: 'default' as const,
    title: 'Plain action',
  };
}

function getButtonSettingsDefaultParams(model: ActionModel) {
  const defaultParams = model.getFlow('buttonSettings')?.getStep('general')?.defaultParams;
  if (typeof defaultParams !== 'function') {
    throw new Error('buttonSettings.general.defaultParams is unavailable.');
  }
  return defaultParams(new FlowRuntimeContext(model, 'buttonSettings', 'settings'));
}

describe('ActionModel button settings', () => {
  it('uses icon-only buttons by default for mobile icon actions', () => {
    const engine = new FlowEngine();
    engine.registerModels({ IconActionModel });
    const model = engine.createModel<IconActionModel>({
      use: 'IconActionModel',
      uid: 'mobile-icon-action',
    });

    model.context.defineProperty('isMobileLayout', { value: true });

    expect(getButtonSettingsDefaultParams(model)).toMatchObject({
      icon: 'PlusOutlined',
      iconOnly: true,
    });
  });

  it('keeps button titles visible by default outside mobile layouts', () => {
    const engine = new FlowEngine();
    engine.registerModels({ IconActionModel });
    const model = engine.createModel<IconActionModel>({
      use: 'IconActionModel',
      uid: 'desktop-icon-action',
    });

    expect(getButtonSettingsDefaultParams(model)).toMatchObject({
      icon: 'PlusOutlined',
    });
    expect(getButtonSettingsDefaultParams(model)).not.toHaveProperty('iconOnly', true);
  });

  it('does not force icon-only buttons for mobile actions without icons', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PlainActionModel });
    const model = engine.createModel<PlainActionModel>({
      use: 'PlainActionModel',
      uid: 'mobile-plain-action',
    });

    model.context.defineProperty('isMobileLayout', { value: true });

    expect(getButtonSettingsDefaultParams(model)).toMatchObject({
      title: 'Plain action',
    });
    expect(getButtonSettingsDefaultParams(model)).not.toHaveProperty('iconOnly', true);
  });
});
