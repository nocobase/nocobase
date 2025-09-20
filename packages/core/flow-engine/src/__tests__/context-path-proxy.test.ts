/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ContextPathProxy } from '../ContextPathProxy';

describe('createContextProxy', () => {
  it('should return correct string template for root', () => {
    const ctx = ContextPathProxy.create();
    expect(ctx.toString()).toBe('{{ctx}}');
    expect(`${ctx}`).toBe('{{ctx}}');
  });

  it('should support nested property access and string template', () => {
    const ctx = ContextPathProxy.create();
    expect(`${ctx.steps}`).toBe('{{ctx.steps}}');
    expect(`${ctx.steps.step1}`).toBe('{{ctx.steps.step1}}');
    expect(`${ctx.steps.step1.result}`).toBe('{{ctx.steps.step1.result}}');
  });

  it('should support valueOf for implicit conversion', () => {
    const ctx = ContextPathProxy.create();
    expect(ctx.steps.step1.result == '{{ctx.steps.step1.result}}').toBe(true);
  });

  it('should return undefined for symbol property', () => {
    const ctx = ContextPathProxy.create();
    expect((ctx as any)[Symbol.toPrimitive]).toBeUndefined();
  });
});
