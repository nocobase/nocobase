/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({
  settingsContext: undefined as
    | {
        model?: { collection?: unknown };
        collection?: unknown;
      }
    | undefined,
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: unknown) => component,
  useFlowSettingsContext: () => state.settingsContext,
}));

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('antd', () => ({
  Select: ({
    value,
    options = [],
    placeholder,
    onChange,
  }: {
    value?: string | string[];
    options?: Array<{ label: React.ReactNode; value: string }>;
    placeholder?: string;
    onChange?: (value: string | undefined) => void;
  }) => (
    <div>
      <div data-testid="placeholder">{placeholder}</div>
      <div data-testid="value">{Array.isArray(value) ? value.join(',') : value}</div>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange?.(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

describe('RecordCommentFieldSelect', () => {
  const collection = {
    fields: [
      { name: 'content', type: 'text', interface: 'textarea', title: 'Content' },
      { name: 'createdAt', type: 'date', interface: 'createdAt', title: 'Created at' },
      { name: 'postId', type: 'bigInt', interface: 'integer', title: 'Post ID' },
      { name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' },
      { name: 'createdBy', type: 'belongsTo', interface: 'createdBy', title: 'Created by', target: 'users' },
      { name: 'assignee', type: 'belongsTo', interface: 'm2o', title: 'Assignee', target: 'users' },
    ],
  };

  beforeEach(() => {
    state.settingsContext = {
      model: {
        collection,
      },
    };
  });

  it('lists all collection fields when no filter is configured', async () => {
    const { RecordCommentFieldSelect } = await import('../components/RecordCommentFieldSelect');

    render(<RecordCommentFieldSelect value="content" />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('Select field');
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('filters field options by comment mapping purpose and emits changes', async () => {
    const { RecordCommentFieldSelect } = await import('../components/RecordCommentFieldSelect');
    const onChange = vi.fn();

    const { rerender } = render(<RecordCommentFieldSelect fieldFilter="user" onChange={onChange} />);

    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Assignee'));
    expect(onChange).toHaveBeenCalledWith('assignee');

    rerender(<RecordCommentFieldSelect fieldFilter="content" />);
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Assignee')).not.toBeInTheDocument();

    rerender(<RecordCommentFieldSelect fieldFilter="date" />);
    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    rerender(<RecordCommentFieldSelect fieldFilter="owner" />);
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Post ID')).toBeInTheDocument();
    expect(screen.queryByText('Post')).not.toBeInTheDocument();
  });

  it('falls back to the settings collection when the model has no collection', async () => {
    const { RecordCommentFieldSelect } = await import('../components/RecordCommentFieldSelect');
    state.settingsContext = {
      collection,
    };

    render(<RecordCommentFieldSelect fieldFilter="content" />);

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
