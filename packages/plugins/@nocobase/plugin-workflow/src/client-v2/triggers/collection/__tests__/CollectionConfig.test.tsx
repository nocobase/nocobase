/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import CollectionTriggerConfig from '../CollectionConfig';

vi.mock('../../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('../../../components/collection', () => ({
  CollectionCascader: (props: any) => <div data-testid="collection-cascader">{String(Boolean(props.disabled))}</div>,
  FieldsSelect: () => <div data-testid="fields-select" />,
  AppendsSelect: () => <div data-testid="appends-select" />,
}));

vi.mock('../../../components/FilterDynamicComponent', () => ({
  ConditionField: () => <div data-testid="condition-field" />,
}));

describe('CollectionTriggerConfig', () => {
  it('consumes extracted shared collection components', () => {
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <Form initialValues={{ config: { collection: 'posts', mode: 2 } }}>
          <CollectionTriggerConfig />
        </Form>
      </FlowEngineProvider>,
    );

    expect(screen.getByTestId('collection-cascader')).toHaveTextContent('true');
    expect(screen.getByTestId('fields-select')).toBeInTheDocument();
    expect(screen.getByTestId('condition-field')).toBeInTheDocument();
    expect(screen.getByTestId('appends-select')).toBeInTheDocument();
  });
});
