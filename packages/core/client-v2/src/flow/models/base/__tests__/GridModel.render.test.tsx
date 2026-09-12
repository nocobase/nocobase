/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GridModel } from '../GridModel';

describe('GridModel.render', () => {
  let engine: FlowEngine;

  beforeEach(async () => {
    engine = new FlowEngine();
    engine.registerModels({ GridModel });
    await engine.flowSettings.disable();
  });

  it('renders the Space wrapper as block-level flex to avoid inline baseline spacing', () => {
    const item = engine.createModel({ use: 'FlowModel', uid: 'item-1' });
    const model = engine.createModel<GridModel>({
      use: 'GridModel',
      uid: 'grid-render',
      props: {
        rows: {
          row1: [['item-1']],
        },
        sizes: {
          row1: [24],
        },
        rowGap: 16,
      },
      structure: {} as any,
    });
    (model as any).subModels = { items: [item] };

    expect(Object.keys((model as any).getVisibleLayout().rows)).toEqual(['row1']);

    const { container } = render(<FlowEngineProvider engine={engine}>{model.render()}</FlowEngineProvider>);
    const space = container.querySelector('.ant-space') as HTMLElement;

    expect(space).toBeTruthy();
    expect(space.style.width).toBe('100%');
    expect(space.style.marginBottom).toBe('16px');
    expect(space.style.display).toBe('flex');
  });
});
