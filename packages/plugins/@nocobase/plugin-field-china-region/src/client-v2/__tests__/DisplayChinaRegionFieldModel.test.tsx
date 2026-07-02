/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DisplayChinaRegionFieldModel } from '../models/DisplayChinaRegionFieldModel';

function createModel(value: unknown) {
  const engine = new FlowEngine();
  engine.registerModels({ DisplayChinaRegionFieldModel });
  return engine.createModel<DisplayChinaRegionFieldModel>({
    use: 'DisplayChinaRegionFieldModel',
    uid: 'display-china-region-field',
    props: {
      value,
    },
  });
}

describe('DisplayChinaRegionFieldModel', () => {
  afterEach(cleanup);

  it('sorts selected regions by level and sort order before display', () => {
    const model = createModel([
      { name: '西城区', level: 3, sort: 2 },
      { name: '北京市', level: 1 },
      { label: '东城区', level: 3, sort: 1 },
      { name: '北京市', level: 2 },
    ]);

    render(model.render());

    expect(screen.getByText('北京市/北京市/东城区/西城区')).toBeTruthy();
  });

  it('renders object and primitive values, and skips empty values', () => {
    const { rerender, container } = render(createModel({ name: '浙江省' }).render());

    expect(screen.getByText('浙江省')).toBeTruthy();

    rerender(createModel('330100').render());
    expect(screen.getByText('330100')).toBeTruthy();

    rerender(createModel([]).render());
    expect(container.textContent).toBe('');

    rerender(createModel(null).render());
    expect(container.textContent).toBe('');
  });
});
