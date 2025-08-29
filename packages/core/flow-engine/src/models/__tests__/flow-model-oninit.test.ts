/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('FlowModel.onInit', () => {
  it('calls parent onInit before children onInit', () => {
    const order: string[] = [];

    class A extends FlowModel {
      onInit(options: any): void {
        super.onInit(options);
        order.push('A');
      }
    }

    class B extends FlowModel {
      onInit(options: any): void {
        super.onInit(options);
        order.push('B');
      }
    }

    const engine = new FlowEngine();
    engine.registerModels({ A, B });

    engine.createModel({
      use: 'A',
      subModels: {
        b1: [{ use: 'B' }, { use: 'B' }],
      },
    });

    expect(order).toEqual(['A', 'B', 'B']);
  });
});
