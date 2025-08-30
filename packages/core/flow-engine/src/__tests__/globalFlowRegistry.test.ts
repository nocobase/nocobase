/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowModel } from '../models/flowModel';

describe('GlobalFlowRegistry (class-level flows)', () => {
  class BaseModel extends FlowModel {}
  class ChildModel extends BaseModel {}

  it('adds and gets class-level flows via FlowDefinition', () => {
    const gr = ChildModel.globalFlowRegistry;
    const def = gr.addFlow('alpha', {
      key: 'alpha',
      title: 'Alpha',
      steps: {
        s1: {
          title: 'S1',
          // inline handler for testing
          handler: (ctx: any, params: any) => 'ok',
        },
      },
    });

    expect(def).toBeTruthy();
    const got = gr.getFlow('alpha');
    expect(got).toBeTruthy();
    expect(got?.key).toBe('alpha');
    expect(got?.title).toBe('Alpha');

    const flows = gr.getFlows();
    expect(flows instanceof Map).toBe(true);
    expect(flows.has('alpha')).toBe(true);
  });

  it('inherits parent flows and allows child overrides (child first)', () => {
    const parentGR = BaseModel.globalFlowRegistry;
    const childGR = ChildModel.globalFlowRegistry;

    parentGR.addFlow('common', {
      key: 'common',
      title: 'FromParent',
      steps: {
        p: { title: 'P', handler: (ctx: any, params: any) => {} },
      },
    });

    // 子类能看到父类的 flow
    let def = childGR.getFlow('common');
    expect(def).toBeTruthy();
    expect(def?.title).toBe('FromParent');

    // 子类覆盖同名 flow
    childGR.addFlow('common', {
      key: 'common',
      title: 'FromChild',
      steps: { c: { title: 'C', handler: (ctx: any, params: any) => {} } },
    });
    def = childGR.getFlow('common');
    expect(def?.title).toBe('FromChild');

    // 父类仍保持不变
    const parentDef = parentGR.getFlow('common');
    expect(parentDef?.title).toBe('FromParent');

    // getFlows 包含父类 + 子类（子类覆盖父类）
    const flows = childGR.getFlows();
    expect(flows.has('common')).toBe(true);
    expect(flows.get('common')?.title).toBe('FromChild');
  });
});
