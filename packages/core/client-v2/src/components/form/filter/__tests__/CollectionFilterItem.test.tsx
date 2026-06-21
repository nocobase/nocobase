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

type StubField = {
  name: string;
  title: string;
  children?: StubField[];
};

// `fieldsToOptions` walks the live data-source registry to build option trees with operator lists per field interface. For a focused unit test we stub it so the test isn't coupled to interface registration. The stub returns the same nested shape `fieldsToOptions` would produce so `CollectionFilterItem`'s Cascader sees children for association-like fields.
vi.mock('../../../../flow/components/filter/fieldsToOptions', () => {
  const toOption = (field: StubField): any => ({
    name: field.name,
    title: field.title,
    operators: field.children
      ? undefined
      : [
          { value: '$eq', label: 'equals' },
          { value: '$ne', label: 'not equals' },
        ],
    children: field.children?.map(toOption),
  });
  return {
    fieldsToOptions: (fields: StubField[], _depth: number, ignore: string[]) =>
      fields.filter((f) => !ignore.includes(f.name)).map(toOption),
  };
});

import { CollectionFilterItem, createCollectionFilterItem } from '../CollectionFilterItem';

function buildStubCollection(fieldDefs: StubField[]) {
  return {
    getFields: () =>
      fieldDefs.map((f) => ({
        name: f.name,
        title: f.title,
        type: 'string',
        interface: 'input',
        target: undefined as string | undefined,
        // Mirror the stub's children so any downstream call that descends through the field tree behaves the same as `fieldsToOptions` does.
        children: f.children,
      })),
  } as any;
}

function openFieldCascader(container: HTMLElement) {
  const selector = container.querySelector('.ant-select-selector');
  if (!selector) throw new Error('expected Cascader trigger to be rendered');
  // antd Cascader renders an internal Select-style selector; mouseDown opens its popup just like a plain Select.
  fireEvent.mouseDown(selector);
}

function openOperatorSelect(container: HTMLElement) {
  // Operator dropdown is the second `.ant-select-selector` on the row; the first one is the Cascader's internal selector.
  const selectors = container.querySelectorAll('.ant-select-selector');
  if (selectors.length < 2) throw new Error('expected operator Select to be rendered');
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

    openFieldCascader(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    expect(await screen.findByText('Lock reason')).toBeInTheDocument();
  });

  it('updates value.path and seeds operator on leaf selection', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openFieldCascader(container);
    fireEvent.click(await screen.findByText('Username'));

    await waitFor(() => {
      expect(value.path).toBe('username');
      // First operator from the stubbed options must be seeded automatically so the row is immediately usable without an extra click.
      expect(value.operator).toBe('$eq');
      // Field change clears the value — its shape is operator/field dependent (string for `$eq`, descriptor for `$dateOn`, etc.), so we don't carry the old value across field switches.
      expect(value.value).toBeUndefined();
    });
  });

  it('clears value when the operator changes', async () => {
    const value = observable({ path: 'username', operator: '$eq', value: 'alice' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openOperatorSelect(container);
    fireEvent.click(await screen.findByText('not equals'));

    await waitFor(() => {
      expect(value.operator).toBe('$ne');
      // Same rationale as the field-change branch — a stale string from `$eq` would be structurally incompatible with e.g. a `$dateOn` descriptor if the user picks a date operator next.
      expect(value.value).toBeUndefined();
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

    openFieldCascader(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    expect(screen.queryByText('Lock reason')).not.toBeInTheDocument();
  });

  it('honours nonfilterableFieldNames blacklist', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    const { container } = render(
      <CollectionFilterItem value={value} collection={collection} nonfilterableFieldNames={['lockReason']} />,
    );

    openFieldCascader(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    expect(screen.queryByText('Lock reason')).not.toBeInTheDocument();
  });

  it('applies both whitelist and blacklist (final = whitelist minus blacklist)', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      { name: 'username', title: 'Username' },
      { name: 'nickname', title: 'Nickname' },
      { name: 'lockReason', title: 'Lock reason' },
    ]);

    // Whitelist permits username + nickname; blacklist then subtracts nickname. Result: only username should appear.
    const { container } = render(
      <CollectionFilterItem
        value={value}
        collection={collection}
        filterableFieldNames={['username', 'nickname']}
        nonfilterableFieldNames={['nickname']}
      />,
    );

    openFieldCascader(container);
    expect(await screen.findByText('Username')).toBeInTheDocument();
    // nickname is whitelisted but also blacklisted — blacklist wins for that field.
    expect(screen.queryByText('Nickname')).not.toBeInTheDocument();
    // lockReason isn't in the whitelist either, so it stays hidden.
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

  it('drills into nested association fields and joins the path with dots', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([
      {
        name: 'user',
        title: 'User',
        // Association parent — no operators of its own; should appear disabled in the Cascader so users have to drill into a leaf.
        children: [
          { name: 'username', title: 'Username' },
          { name: 'nickname', title: 'Nickname' },
        ],
      },
      { name: 'lockedTs', title: 'Locked time' },
    ]);

    const { container } = render(<CollectionFilterItem value={value} collection={collection} />);

    openFieldCascader(container);
    // Click the association parent to reveal its children. Cascader is configured with `expandTrigger="click"`.
    fireEvent.click(await screen.findByText('User'));
    fireEvent.click(await screen.findByText('Username'));

    await waitFor(() => {
      // The selected leaf path is dot-joined so callers can use it directly as a filter path (e.g. `user.username`).
      expect(value.path).toBe('user.username');
      expect(value.operator).toBe('$eq');
    });
  });

  it('createCollectionFilterItem binds the collection so FilterContainer can drive it', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const Item = createCollectionFilterItem(collection, { filterableFieldNames: ['username'] });
    const { container } = render(<Item value={value} />);

    openFieldCascader(container);
    fireEvent.click(await screen.findByText('Username'));
    await waitFor(() => {
      expect(value.path).toBe('username');
    });
  });

  it('keeps default widths at 200/120 and honours explicit width/placeholder overrides', () => {
    const value = observable({ path: 'username', operator: '$eq', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const { container, rerender } = render(<CollectionFilterItem value={value} collection={collection} />);

    let selects = container.querySelectorAll('.ant-select');
    expect(selects[0]).toHaveStyle({ width: '200px' });
    expect(selects[1]).toHaveStyle({ minWidth: '120px' });

    rerender(
      <CollectionFilterItem
        value={observable({ path: '', operator: '', value: '' })}
        collection={collection}
        fieldWidth={160}
        operatorMinWidth={110}
        fieldPlaceholder="Choose field"
        operatorPlaceholder="Choose operator"
      />,
    );

    selects = container.querySelectorAll('.ant-select');
    expect(selects[0]).toHaveStyle({ width: '160px' });
    expect(selects[1]).toHaveStyle({ minWidth: '110px' });
    expect(screen.getByText('Choose field')).toBeInTheDocument();
  });

  it('lets callers suppress the fallback value placeholder', () => {
    const value = observable({ path: 'username', operator: '$eq', value: '' });
    const collection = buildStubCollection([{ name: 'username', title: 'Username' }]);

    const { rerender } = render(<CollectionFilterItem value={value} collection={collection} />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();

    rerender(<CollectionFilterItem value={value} collection={collection} valuePlaceholder={null} />);
    expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
  });
});
