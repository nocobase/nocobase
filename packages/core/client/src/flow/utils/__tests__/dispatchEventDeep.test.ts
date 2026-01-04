/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { dispatchEventDeep } from '../dispatchEventDeep';

describe('dispatchEventDeep', () => {
  test('dispatches to descendant models and their forks by default', async () => {
    const engine = new FlowEngine();
    const received: any[] = [];

    class TestChild extends FlowModel {
      render() {
        return null;
      }
    }

    TestChild.registerFlow({
      key: 'onPageChange',
      on: 'pageChangeFlow',
      steps: {
        mark: {
          handler(ctx) {
            received.push(ctx.model);
          },
        },
      },
    });

    class TestRoot extends FlowModel<{ subModels: { child: TestChild } }> {
      render() {
        return null;
      }
    }

    engine.registerModels({ TestRoot, TestChild });

    const root = engine.createModel<TestRoot>({
      use: 'TestRoot',
      subModels: {
        child: { use: 'TestChild' },
      },
    });

    const child = root.subModels.child as unknown as TestChild;
    child.createFork({}, 'row-0');

    await dispatchEventDeep(root, 'pageChangeFlow');

    const forkFlags = received.map((m) => Boolean((m as any)?.isFork)).sort();
    expect(forkFlags).toEqual([false, true]);
  });
});
