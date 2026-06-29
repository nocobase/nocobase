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

const workflowState = vi.hoisted(() => ({ sync: true }));
const conditionFieldState = vi.hoisted(() => ({
  propsList: [] as any[],
}));

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
  ConditionField: (props: any) => {
    conditionFieldState.propsList.push(props);
    return <div data-testid="condition-field" />;
  },
}));

vi.mock('../../../canvas/contexts', () => ({
  useCurrentWorkflowContext: () => ({ sync: workflowState.sync }),
}));

describe('CollectionTriggerConfig', () => {
  it('consumes extracted shared collection components', () => {
    workflowState.sync = true;
    conditionFieldState.propsList = [];
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
    expect(conditionFieldState.propsList.at(-1)?.rightAsVariable).toBe(false);
    expect(
      screen.getByText(
        'Synchronous collection event workflows run within the trigger transaction by default. Related data operations automatically use this transaction.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Rollback when workflow execution fails')).toBeInTheDocument();

    const notice = screen.getByText(
      'Synchronous collection event workflows run within the trigger transaction by default. Related data operations automatically use this transaction.',
    );
    const rollback = screen.getByText('Rollback when workflow execution fails');
    const appends = screen.getByTestId('appends-select');
    expect(appends.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(notice.compareDocumentPosition(rollback) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides sync-only rollback configuration when workflow is asynchronous', () => {
    workflowState.sync = false;
    const engine = new FlowEngine();

    render(
      <FlowEngineProvider engine={engine}>
        <Form initialValues={{ config: { collection: 'posts', mode: 2 } }}>
          <CollectionTriggerConfig />
        </Form>
      </FlowEngineProvider>,
    );

    expect(screen.queryByText('Rollback when workflow execution fails')).not.toBeInTheDocument();
  });
});
