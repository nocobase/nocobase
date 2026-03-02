/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { flowModelRendererSpy } = vi.hoisted(() => {
  return {
    flowModelRendererSpy: vi.fn(),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    FlowModelRenderer: (props: any) => {
      flowModelRendererSpy(props);
      return <div data-testid="flow-model-renderer" />;
    },
  };
});

import { Application } from '../Application';

describe('ApplicationModel (phase-1 host)', () => {
  beforeEach(() => {
    flowModelRendererSpy.mockClear();
  });

  it('should create app model with fixed uid', () => {
    const app = new Application();

    expect(app.model).toBeTruthy();
    expect(app.flowEngine.getModel('__app_model__')).toBe(app.model);
  });

  it('should render root by FlowModelRenderer with app model', async () => {
    const app = new Application();
    const Root = app.getRootComponent();

    render(<Root />);

    await waitFor(() => {
      expect(flowModelRendererSpy).toHaveBeenCalled();
    });
    expect(flowModelRendererSpy).toHaveBeenLastCalledWith(expect.objectContaining({ model: app.model }));
  });

  it('should sync root children to app model props', async () => {
    const app = new Application();
    const Root = app.getRootComponent();

    render(
      <Root>
        <div data-testid="child">child</div>
      </Root>,
    );

    await waitFor(() => {
      expect(app.model.props.children).toBeTruthy();
    });
  });
});
