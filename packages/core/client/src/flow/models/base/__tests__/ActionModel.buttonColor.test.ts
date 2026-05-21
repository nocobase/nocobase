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
import { ActionModel } from '../../..';

describe('ActionModel button color', () => {
  it('uses color + variant and strips legacy type/danger when color is set', () => {
    const engine = new FlowEngine();
    engine.registerModels({ ActionModel });

    const model = engine.createModel<ActionModel>({
      use: 'ActionModel',
      uid: 'action-color-render',
      props: {
        title: 'Action',
        type: 'primary',
        danger: true,
        color: 'pink',
      },
    });

    const renderProps = model.getButtonRenderProps();

    expect(renderProps.variant).toBe('solid');
    expect(renderProps.props.color).toBe('pink');
    expect(renderProps.props.type).toBeUndefined();
    expect(renderProps.props.danger).toBeUndefined();
  });

  it('normalizes color from button settings step params', () => {
    const engine = new FlowEngine();
    engine.registerModels({ ActionModel });

    const model = engine.createModel<ActionModel>({
      use: 'ActionModel',
      uid: 'action-color-handler',
      props: {
        title: 'Action',
        type: 'default',
      },
    });

    const flow = model.getFlow('buttonSettings');
    const step = flow?.steps?.general;

    expect(step).toBeDefined();
    step?.handler?.(
      {
        model,
        t: (value: any) => value,
      } as any,
      {
        title: 'Action',
        tooltip: '',
        type: 'default',
        color: 'pink',
      },
    );
    expect(model.props.color).toBe('pink');

    step?.handler?.(
      {
        model,
        t: (value: any) => value,
      } as any,
      {
        title: 'Action',
        tooltip: '',
        type: 'default',
        color: { value: 'blue' },
      },
    );
    expect(model.props.color).toBe('blue');

    step?.handler?.(
      {
        model,
        t: (value: any) => value,
      } as any,
      {
        title: 'Action',
        tooltip: '',
        type: 'default',
        color: '#ff00ff',
      },
    );
    expect(model.props.color).toBeUndefined();
  });
});
