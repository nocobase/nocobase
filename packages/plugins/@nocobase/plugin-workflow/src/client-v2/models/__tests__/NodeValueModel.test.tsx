/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@nocobase/test/client';
import { FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { NodeValueModel } from '../NodeValueModel';

const calculationResultTemplate = '{{t("Calculation result", { ns: "workflow" })}}';

function createNodeValueModel(defaultValue: string) {
  const engine = new FlowEngine();
  engine.context.defineProperty('i18n', {
    value: {
      language: 'en-US',
      t: (key: string) => (key === 'Calculation result' ? 'Translated calculation result' : key),
    },
  });
  engine.registerModels({ NodeValueModel });
  const model = engine.createModel<NodeValueModel>({
    use: 'NodeValueModel',
    uid: 'node-value-fallback',
    stepParams: {
      valueSettings: {
        init: {
          dataSource: '{{$jobsMapByNodeKey.n1}}',
          defaultValue,
        },
      },
    },
  });
  model.context.defineProperty('view', {
    value: {
      inputArgs: {
        flowContext: {},
      },
    },
  });

  return model;
}

describe('NodeValueModel', () => {
  it('translates template fallback values when no execution is available', () => {
    const model = createNodeValueModel(calculationResultTemplate);
    const { container } = render(<>{model.renderComponent()}</>);

    expect(screen.getByText('Translated calculation result')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(calculationResultTemplate);
  });
});
