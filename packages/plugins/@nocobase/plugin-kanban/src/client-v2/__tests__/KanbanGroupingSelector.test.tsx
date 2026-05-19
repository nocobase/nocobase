/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanGroupingSelector } from '../models/components/KanbanGroupingSelector';

const useFormMock = vi.fn(() => undefined);

vi.mock('@formily/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/react')>();
  return {
    ...actual,
    observer: (component: any) => component,
    useForm: () => useFormMock(),
  };
});

describe('KanbanGroupingSelector', () => {
  it('renders a disabled selector before a grouping field is selected', () => {
    render(<KanbanGroupingSelector value={[]} collection={{ getField: () => undefined }} />);

    expect(screen.getByText('Select a grouping field first')).toBeInTheDocument();
    expect(document.querySelector('.ant-select-disabled')).toBeInTheDocument();
  });

  it('does not emit an initial grouping field when nothing is selected yet', async () => {
    const ownerField = {
      name: 'owner',
      interface: 'm2o',
    };
    const collection = {
      getFields: () => [ownerField],
      getField: (name: string) => (name === 'owner' ? ownerField : undefined),
    };
    const onChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState<any>();
      return (
        <KanbanGroupingSelector
          collection={collection}
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        />
      );
    };

    render(<Wrapper />);

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('renders selected group values', () => {
    const statusField = {
      name: 'status',
      interface: 'select',
    };
    const collection = {
      getFields: () => [statusField],
      getField: (name: string) => (name === 'status' ? statusField : undefined),
    };

    render(
      <KanbanGroupingSelector
        collection={collection}
        value={{
          groupField: 'status',
          groupOptions: [{ value: 'todo', label: 'Todo', color: 'red', enabled: true }],
        }}
      />,
    );

    expect(screen.getByText('Todo')).toBeInTheDocument();
  });
});
