/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DisplayJSONFieldModel } from '../DisplayJSONFieldModel';

describe('DisplayJSONFieldModel', () => {
  it('renders object field values as formatted JSON', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayJSONFieldModel });

    const model = engine.createModel<DisplayJSONFieldModel>({
      use: DisplayJSONFieldModel,
      uid: 'display-json-object-value',
      props: {
        value: {
          enabled: true,
          name: 'NocoBase',
        },
      },
    });

    const { container } = render(model.render());

    expect(container.textContent).toContain('"enabled": true');
    expect(container.textContent).toContain('"name": "NocoBase"');
  });
});
