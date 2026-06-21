/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import { DisplayEnumFieldModel } from '../DisplayEnumFieldModel';

describe('DisplayEnumFieldModel', () => {
  it('renders labels for multiple values (multipleSelect/checkboxGroup)', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayEnumFieldModel });

    const model = engine.createModel<DisplayEnumFieldModel>({
      use: DisplayEnumFieldModel,
      uid: 'display-enum-multiple-values',
    });

    model.setProps({
      value: ['a', 'b'],
      options: [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ],
    });

    render(model.render());

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.queryByText('a, b')).not.toBeInTheDocument();
  });
});
