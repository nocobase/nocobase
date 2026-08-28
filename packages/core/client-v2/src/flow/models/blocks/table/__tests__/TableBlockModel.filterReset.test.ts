/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { TableBlockModel } from '../TableBlockModel';

describe('TableBlockModel filter reset', () => {
  it('collapses the filtered tree when rows are not expanded by default', () => {
    const setExpandFlag = vi.fn();
    const setProps = vi.fn();
    const model = {
      props: { treeTable: true, defaultExpandAllRows: false, expandedRowKeys: [1, 2] },
      resource: { getData: () => [{ id: 3, children: [{ id: 4 }] }] },
      setProps,
      mapSubModels: (_key, callback) => callback({ setExpandFlag }),
    };

    TableBlockModel.prototype.resetAfterFilterChange.call(model);

    expect(setProps).toHaveBeenCalledWith('expandedRowKeys', []);
    expect(setExpandFlag).toHaveBeenCalledWith(false);
  });

  it('expands the filtered tree when rows are expanded by default', () => {
    const setExpandFlag = vi.fn();
    const setProps = vi.fn();
    const model = {
      props: { treeTable: true, defaultExpandAllRows: true, expandedRowKeys: [1, 2] },
      collection: { filterTargetKey: 'id' },
      resource: { getData: () => [{ id: 3, children: [{ id: 4 }] }] },
      setProps,
      mapSubModels: (_key, callback) => callback({ setExpandFlag }),
    };

    TableBlockModel.prototype.resetAfterFilterChange.call(model);

    expect(setProps).toHaveBeenCalledWith('expandedRowKeys', [3, 4]);
    expect(setExpandFlag).toHaveBeenCalledWith(true);
  });

  it('uses the collection filter target key when expanding the filtered tree', () => {
    const setProps = vi.fn();
    const model = {
      props: { treeTable: true, defaultExpandAllRows: true },
      collection: { filterTargetKey: ['tenant', 'slug'] },
      resource: {
        getData: () => [{ tenant: 'acme', slug: 'root', children: [{ tenant: 'acme', slug: 'child' }] }],
      },
      setProps,
      mapSubModels: vi.fn(),
    };

    TableBlockModel.prototype.resetAfterFilterChange.call(model);

    expect(setProps).toHaveBeenCalledWith('expandedRowKeys', ['acme-root', 'acme-child']);
  });

  it('does not change expansion state for a regular table', () => {
    const setProps = vi.fn();
    const mapSubModels = vi.fn();
    const model = {
      props: { treeTable: false },
      setProps,
      mapSubModels,
    };

    TableBlockModel.prototype.resetAfterFilterChange.call(model);

    expect(setProps).not.toHaveBeenCalled();
    expect(mapSubModels).not.toHaveBeenCalled();
  });
});
