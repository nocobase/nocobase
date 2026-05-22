/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { observable } from '@nocobase/flow-engine';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// `fieldsToOptions` walks the live data-source registry to build option
// trees with operator lists per field interface. For a focused unit test
// we stub it so the test isn't coupled to interface registration.
vi.mock('../../../flow/components/filter/fieldsToOptions', () => ({
  fieldsToOptions: (fields: { name: string; title: string }[], _depth: number, ignore: string[]) =>
    fields
      .filter((f) => !ignore.includes(f.name))
      .map((f) => ({
        name: f.name,
        title: f.title,
        operators: [
          { value: '$eq', label: 'equals' },
          { value: '$ne', label: 'not equals' },
        ],
      })),
}));

import { CollectionFilterItem, createCollectionFilterItem } from '../CollectionFilterItem';

function buildStubCollection(fieldDefs: { name: string; title: string }[]) {
  return {
    getFields: () =>
      fieldDefs.map((f) => ({
        name: f.name,
        title: f.title,
        type: 'string',
        interface: 'input',
        target: undefined as string | undefined,
      })),
  } as any;
}

function openFieldSelect(container: HTMLElement) {
  const selectors = container.querySelectorAll('.ant-select-selector');
  // First Select is the field picker, second is the operator picker.
  fireEvent.mouseDown(selectors[0]);
}

function openOperatorSelect(container: HTMLElement) {
  const selectors = container.querySelectorAll('.ant-select-selector');
  fireEvent.mouseDown(selectors[1]);
}

describe('CollectionFilterItem', () => {
  it('renders field options from the bound collection', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openFieldSelect(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    expect(await screen.findByText('Lock reason')).toBeInTheDocument();
  });

  it('updates value.path and seeds operator on field change', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openFieldSelect(container);
    fireEvent.click(await screen.findByText('Username'));

    await waitFor(() => {
      expect(value.path).toBe('username');
      // First operator from the stubbed options must be seeded automatically
      // so the row is immediately usable without an extra click.
      expect(value.operator).toBe('$eq');
      expect(value.value).toBe('');
    });
  });

  it('honours filterableFieldNames whitelist', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    const { container } = render(
      <CollectionFilterItem value={value} collection={collection} filterableFieldNames={['username']} />,
    );

    openFieldSelect(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    expect(screen.queryByText('Lock reason')).not.toBeInTheDocument();
  });

  it('writes through value.value on input change', () => {
    const value = observable({ path: 'username', operator: '$eq', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    render(<CollectionFilterItem value={value} collection={collection} />);

    fireEvent.change(screen.getByPlaceholderText('Enter value'), { target: { value: 'alice' } });
    expect(value.value).toBe('alice');
  });

  it('lets the user change the operator independently', async () => {
    const value = observable({ path: 'username', operator: '$eq', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openOperatorSelect(container);
    fireEvent.click(await screen.findByText('not equals'));

    await waitFor(() => {
      expect(value.operator).toBe('$ne');
    });
  });

  it('createCollectionFilterItem binds the collection so FilterContainer can drive it', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const Item = createCollectionFilterItem(collection, { filterableFieldNames: ['username'] });
    const { container } = render(<Item value={value} />);

    openFieldSelect(container);
    fireEvent.click(await screen.findByText('Username'));
    await waitFor(() => {
      expect(value.path).toBe('username');
    });
  });
});
