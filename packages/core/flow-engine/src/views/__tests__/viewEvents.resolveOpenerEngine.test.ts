/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { createViewScopedEngine } from '../../ViewScopedFlowEngine';
import { resolveOpenerEngine } from '../viewEvents';

describe('viewEvents.resolveOpenerEngine', () => {
  it('prefers the parent view engine even when it is not the stack tail (cached page scenario)', () => {
    const root = new FlowEngine();
    const pageA = createViewScopedEngine(root);
    createViewScopedEngine(root); // pageB appended after pageA

    // Open a dialog from pageA while another kept-alive view exists after it.
    // view scoped engines always link to the tail, so the dialog's previousEngine will be pageB.
    const dialog = createViewScopedEngine(pageA);

    const opener = resolveOpenerEngine(pageA, dialog);
    expect(opener).toBe(pageA);
  });
});
