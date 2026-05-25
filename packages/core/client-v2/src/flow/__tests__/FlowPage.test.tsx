/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowPage } from '../FlowPage';

const mocks = vi.hoisted(() => ({
  rendererProps: undefined as any,
  model: {
    uid: 'public-form-page',
    props: {
      showFlowSettings: false,
    },
    context: {
      isMobileLayout: false,
      themeToken: {
        marginBlock: 16,
      },
    },
  },
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const ReactModule = await import('react');

  return {
    ...actual,
    FlowModelRenderer: vi.fn((props: any) => {
      mocks.rendererProps = props;
      return ReactModule.createElement('div', { 'data-testid': 'flow-model-renderer' });
    }),
    useFlowEngine: vi.fn(() => ({
      getModelClassAsync: vi.fn(),
      loadOrCreateModel: vi.fn(),
      context: {},
    })),
    useFlowModelById: vi.fn(() => mocks.model),
    useFlowViewContext: vi.fn(() => ({
      themeToken: {
        marginBlock: 16,
      },
    })),
  };
});

vi.mock('ahooks', async () => {
  const actual = await vi.importActual<any>('ahooks');
  return {
    ...actual,
    useRequest: vi.fn(() => ({
      loading: false,
      data: {
        uid: 'public-form-page',
      },
      error: null,
    })),
  };
});

describe('FlowPage', () => {
  afterEach(() => {
    mocks.rendererProps = undefined;
  });

  it('uses showFlowSettings from page model props', () => {
    render(<FlowPage />);

    expect(mocks.rendererProps?.showFlowSettings).toBe(false);
  });
});
