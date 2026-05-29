/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowContext } from '../../flowContext';
import { inheritLayoutContextForDetachedView } from '../inheritLayoutContext';

describe('inheritLayoutContextForDetachedView', () => {
  it('inherits layout context for detached view contexts', () => {
    const sourceContext = new FlowContext();
    const engineContext = new FlowContext();
    const layoutContext = new FlowContext();
    const viewContext = new FlowContext();

    engineContext.defineProperty('skipAclCheck', { value: false });
    layoutContext.defineProperty('skipAclCheck', { value: true });
    sourceContext.defineProperty('engine', {
      value: {
        context: engineContext,
      },
    });
    sourceContext.defineProperty('layoutContext', { value: layoutContext });

    viewContext.addDelegate(engineContext);
    inheritLayoutContextForDetachedView(viewContext, sourceContext);

    expect(viewContext.skipAclCheck).toBe(true);
  });

  it('does nothing when source context has no layout context', () => {
    const sourceContext = new FlowContext();
    const engineContext = new FlowContext();
    const viewContext = new FlowContext();

    engineContext.defineProperty('skipAclCheck', { value: false });
    sourceContext.defineProperty('engine', {
      value: {
        context: engineContext,
      },
    });

    viewContext.addDelegate(engineContext);
    inheritLayoutContextForDetachedView(viewContext, sourceContext);

    expect(viewContext.skipAclCheck).toBe(false);
  });
});
