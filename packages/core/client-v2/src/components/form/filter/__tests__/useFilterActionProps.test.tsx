/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider, type Collection } from '@nocobase/flow-engine';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFilterActionProps } from '../useFilterActionProps';

vi.mock('../../../flow/components/filter/useFilterOptions', () => ({
  useFilterOptions: () => [],
}));

vi.mock('../CollectionFilterItem', () => ({
  createCollectionFilterItem: () => undefined,
}));

function makeCollection(): Collection {
  return {
    getFields: () => [{ name: 'title' }, { name: 'type' }],
  } as unknown as Collection;
}

function makeWrapper() {
  const engine = new FlowEngine();
  const Wrapper: React.FC = ({ children }) => <FlowEngineProvider engine={engine}>{children}</FlowEngineProvider>;
  return Wrapper;
}

describe('useFilterActionProps', () => {
  it('seeds the editable group from defaultValue when initialValue is missing', () => {
    const { result } = renderHook(
      () =>
        useFilterActionProps({
          collection: makeCollection(),
          defaultValue: { $and: [{ title: { $includes: '' } }, { type: { $eq: undefined } }] },
          onApply: () => undefined,
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.value).toMatchObject({
      logic: '$and',
      items: [
        { path: 'title', operator: '$includes', value: '' },
        { path: 'type', operator: '$eq', value: undefined },
      ],
    });
  });

  it('reset restores defaultValue and emits its compiled filter', () => {
    const onApply = vi.fn();
    const { result } = renderHook(
      () =>
        useFilterActionProps({
          collection: makeCollection(),
          defaultValue: { $and: [{ title: { $includes: '' } }, { type: { $eq: undefined } }] },
          initialValue: { $and: [{ title: { $includes: 'abc' } }] },
          onApply,
        }),
      { wrapper: makeWrapper() },
    );

    result.current.onReset();

    expect(result.current.value).toMatchObject({
      logic: '$and',
      items: [
        { path: 'title', operator: '$includes', value: '' },
        { path: 'type', operator: '$eq', value: undefined },
      ],
    });
    expect(onApply).toHaveBeenCalledWith(undefined, 'reset');
  });

  it('counts only effective compiled conditions, so empty default rows do not highlight the button', () => {
    const { result } = renderHook(
      () =>
        useFilterActionProps({
          collection: makeCollection(),
          defaultValue: { $and: [{ title: { $includes: '' } }, { type: { $eq: undefined } }] },
          onApply: () => undefined,
        }),
      { wrapper: makeWrapper() },
    );

    expect(result.current.conditionCount).toBe(0);
  });
});
