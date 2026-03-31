/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { observer } from '../observer';
import { useFlowContext } from '../../FlowContextProvider';
import { observable } from '@formily/reactive';
import { vi } from 'vitest';
import { sleep } from '@nocobase/test/client';

// Mock useFlowContext
vi.mock('../../FlowContextProvider', async () => {
  const actual = await vi.importActual('../../FlowContextProvider');
  return {
    ...actual,
    useFlowContext: vi.fn(),
  };
});

describe('observer', () => {
  beforeEach(() => {
    (useFlowContext as any).mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    const Component = observer(() => <div>Hello World</div>);
    render(<Component />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should update when observable changes', async () => {
    const model = observable({ count: 0 });
    const Component = observer(() => <div>Count: {model.count}</div>);
    render(<Component />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    act(() => {
      model.count++;
    });
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should delay update when pageActive is false', async () => {
    const model = observable({ count: 0 });
    const pageActive = observable.ref(false);
    const tabActive = observable.ref(true);

    const context = {
      pageActive: pageActive,
      tabActive: tabActive,
    };

    (useFlowContext as any).mockReturnValue(context);

    const Component = observer(() => <div>Count: {model.count}</div>);

    render(<Component />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Update model, but pageActive is false
    act(() => {
      model.count++;
    });

    await sleep(30);

    // Should not update yet
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.queryByText('Count: 1')).not.toBeInTheDocument();

    // Now make pageActive true
    act(() => {
      pageActive.value = true;
    });

    await sleep(30);

    // Should update now
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should delay update when tabActive is false', async () => {
    const model = observable({ count: 0 });
    const pageActive = observable.ref(true);
    const tabActive = observable.ref(false);

    const context = {
      pageActive: pageActive,
      tabActive: tabActive,
    };

    (useFlowContext as any).mockReturnValue(context);

    const Component = observer(() => <div>Count: {model.count}</div>);

    render(<Component />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Update model, but tabActive is false
    act(() => {
      model.count++;
    });

    await sleep(30);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.queryByText('Count: 1')).not.toBeInTheDocument();

    // Now make tabActive true
    act(() => {
      tabActive.value = true;
    });

    await sleep(30);

    // Should update now
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should update immediately when pageActive and tabActive are true', async () => {
    const model = observable({ count: 0 });
    const pageActive = observable.ref(true);
    const tabActive = observable.ref(true);

    const context = {
      pageActive: pageActive,
      tabActive: tabActive,
    };

    (useFlowContext as any).mockReturnValue(context);

    const Component = observer(() => <div>Count: {model.count}</div>);

    render(<Component />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    act(() => {
      model.count++;
    });

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should handle undefined tabActive as true (backward compatibility or default)', async () => {
    const model = observable({ count: 0 });
    const pageActive = observable.ref(true);
    // tabActive is undefined in context

    const context = {
      pageActive: pageActive,
    };

    (useFlowContext as any).mockReturnValue(context);

    const Component = observer(() => <div>Count: {model.count}</div>);

    render(<Component />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    act(() => {
      model.count++;
    });

    await sleep(30);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should respect view inputArgs for initial check', async () => {
    const model = observable({ count: 0 });

    const context = {
      view: {
        inputArgs: { pageActive: false },
      },
    };

    (useFlowContext as any).mockReturnValue(context);

    const Component = observer(() => <div>Count: {model.count}</div>);

    render(<Component />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    act(() => {
      model.count++;
    });

    await sleep(30);

    // Should NOT update because pageActive is false (from view.inputArgs)
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    expect(screen.queryByText('Count: 1')).not.toBeInTheDocument();
  });
});
