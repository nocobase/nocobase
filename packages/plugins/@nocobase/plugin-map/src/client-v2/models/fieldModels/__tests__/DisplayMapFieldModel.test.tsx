/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { DisplayPointFieldModel } from '../DisplayPointFieldModel';

vi.mock('../../MapComponent', () => ({
  MapComponent: (props) => <div data-testid="map-component">{JSON.stringify(props.value)}</div>,
}));

describe('DisplayMapFieldModel', () => {
  function createModel(props: Record<string, any>) {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayPointFieldModel });

    const model = engine.createModel<DisplayPointFieldModel>({
      use: DisplayPointFieldModel,
      uid: `display-point-${props.displayStyle || 'text'}`,
      props,
    });

    model.context.defineProperty('collectionField', {
      value: {
        uiSchema: {
          'x-component-props': {
            mapType: 'amap',
          },
        },
      },
    });

    return model;
  }

  it('renders point values as text without converting the coordinate array to an empty string', () => {
    const model = createModel({
      displayStyle: 'text',
      fieldNames: { label: 'name' },
      value: [116.397, 39.907],
    });

    render(<>{model.render()}</>);

    expect(screen.getByText('116.397,39.907')).toBeInTheDocument();
  });

  it('passes the raw point value to the map component in map mode', () => {
    const value = [116.397, 39.907];
    const model = createModel({
      displayStyle: 'map',
      value,
    });

    render(<>{model.render()}</>);

    expect(screen.getByTestId('map-component')).toHaveTextContent(JSON.stringify(value));
  });
});
