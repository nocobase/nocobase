/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  metaTree: [
    {
      name: '$context',
      title: 'Trigger variables',
      type: 'object',
      paths: ['$context'],
      children: [{ name: 'id', title: 'id', type: 'string', paths: ['$context', 'id'] }],
    },
  ] as any[],
}));

vi.mock('@nocobase/client-v2', () => ({
  JsonTextArea: (props: any) => <textarea aria-label="json-textarea" {...props} />,
}));

vi.mock('@nocobase/flow-engine', () => ({
  FlowContextSelector: (props: any) => (
    <div role="button" aria-label="json-variable-selector" onClick={() => props.onChange?.('{{$context.id}}')}>
      {props.children}
    </div>
  ),
}));

vi.mock('../useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: vi.fn(() => holder.metaTree),
}));

import { HideVariableContext } from '../../components/HideVariableContext';
import { WorkflowVariableJsonTextArea } from '../WorkflowVariableJsonTextArea';

describe('WorkflowVariableJsonTextArea', () => {
  it('renders the variable selector when workflow variables are available', () => {
    holder.metaTree = [
      {
        name: '$context',
        title: 'Trigger variables',
        type: 'object',
        paths: ['$context'],
        children: [{ name: 'id', title: 'id', type: 'string', paths: ['$context', 'id'] }],
      },
    ];

    render(<WorkflowVariableJsonTextArea />);

    expect(screen.getByLabelText('json-textarea')).toBeInTheDocument();
    expect(screen.getByLabelText('json-variable-selector')).toBeInTheDocument();
  });

  it('hides the variable selector when variable UI is disabled by context', () => {
    render(
      <HideVariableContext.Provider value>
        <WorkflowVariableJsonTextArea />
      </HideVariableContext.Provider>,
    );

    expect(screen.getByLabelText('json-textarea')).toBeInTheDocument();
    expect(screen.queryByLabelText('json-variable-selector')).toBeNull();
  });

  it('hides the variable selector when there are no workflow variables', () => {
    holder.metaTree = [];

    render(<WorkflowVariableJsonTextArea />);

    expect(screen.getByLabelText('json-textarea')).toBeInTheDocument();
    expect(screen.queryByLabelText('json-variable-selector')).toBeNull();
  });
});
