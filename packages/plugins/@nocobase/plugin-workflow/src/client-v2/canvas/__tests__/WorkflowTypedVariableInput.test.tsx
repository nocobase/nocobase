/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowContextProvider } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HideVariableContext } from '../../components/HideVariableContext';
import { WorkflowTypedVariableInput } from '../WorkflowTypedVariableInput';

vi.mock('../useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: vi.fn(() => [
    {
      name: '$context',
      title: 'Trigger variables',
      type: 'object',
      paths: ['$context'],
      children: [{ name: 'id', title: 'ID', type: 'string', paths: ['$context', 'id'] }],
    },
  ]),
}));

function createContext() {
  const ctx = new FlowContext();
  (ctx as any).t = (key: string) => key;
  return ctx;
}

function renderWithCtx(node: React.ReactNode) {
  return render(<FlowContextProvider context={createContext()}>{node}</FlowContextProvider>);
}

describe('WorkflowTypedVariableInput', () => {
  it('passes hideVariable from workflow context down to TypedVariableInput', async () => {
    renderWithCtx(
      <HideVariableContext.Provider value>
        <WorkflowTypedVariableInput value="{{$context.id}}" types={[]} onChange={() => undefined} />
      </HideVariableContext.Provider>,
    );

    expect(screen.getByRole('button', { name: 'variable-tag' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'variable-switcher' })).toBeNull();
  });

  it('inherits disabled state from the parent form', () => {
    renderWithCtx(
      <Form disabled>
        <WorkflowTypedVariableInput value="{{$context.id}}" types={[]} onChange={() => undefined} />
      </Form>,
    );

    expect(screen.getByRole('button', { name: 'variable-switcher' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'icon-close' })).toBeNull();
  });
});
