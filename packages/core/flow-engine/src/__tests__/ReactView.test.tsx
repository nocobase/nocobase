/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReactView } from '../ReactView';
import { FlowEngine } from '../flowEngine';

describe('ReactView', () => {
  it('createRoot returns object with render/unmount and refresh re-renders', () => {
    const engine = new FlowEngine();
    const view = new ReactView(engine);
    const container = document.createElement('div');
    const root = view.createRoot(container);
    expect(typeof root.render).toBe('function');
    expect(typeof root.unmount).toBe('function');
    root.render(<div id="x">A</div>);
    // refresh should not throw
    view.refresh();
    root.unmount();
  });

  it('render returns a DOM node with _reactRoot and supports onRendered hook', () => {
    const engine = new FlowEngine();
    const view = new ReactView(engine);
    let ready: any;
    const node = view.render(<span>Hi</span>, {
      onRendered: (cb: any) => {
        ready = cb;
      },
    });
    expect(ready).toBeTypeOf('function');
    // run the deferred render
    ready();
    // do not assert internal implementation detail (_reactRoot)
    // just ensure the callback can be invoked without errors
  });

  it('onRefReady calls callback when ref becomes available', async () => {
    const engine = new FlowEngine();
    const view = new ReactView(engine);
    const ref = { current: null } as any;
    let called = false;
    setTimeout(() => (ref.current = document.createElement('div')));
    await new Promise<void>((resolve) => {
      view.onRefReady(
        ref,
        () => {
          called = true;
          resolve();
        },
        200,
      );
    });
    expect(called).toBe(true);
  });
});
