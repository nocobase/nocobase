/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, sleep } from '@nocobase/test/client';
import { DataBlockContext } from '../../data-block/DataBlockProvider';
import { requestParentRecordData } from '../../data-block/DataBlockRequestProvider';
import { BlockRequestContextProvider } from '../../data-block/DataBlockRequestProvider';

const { mockKeepAliveState, mockLocationSearch } = vi.hoisted(() => ({
  mockKeepAliveState: { active: true },
  mockLocationSearch: vi.fn(() => ''),
}));

vi.mock('../../../route-switch/antd/admin-layout/KeepAlive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../route-switch/antd/admin-layout/KeepAlive')>();
  return {
    ...actual,
    useKeepAlive: () => mockKeepAliveState,
  };
});

vi.mock('../../../application/CustomRouterContextProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../application/CustomRouterContextProvider')>();
  return {
    ...actual,
    useLocationSearch: () => mockLocationSearch(),
  };
});

describe('requestParentRecordData', () => {
  beforeEach(() => {
    mockKeepAliveState.active = true;
    mockLocationSearch.mockReset();
    mockLocationSearch.mockReturnValue('');
  });

  it('should return parent record data if parentRecord is provided', async () => {
    const parentRecord = { id: 1, name: 'John Doe' };
    const result = await requestParentRecordData({ parentRecord });
    expect(result).toEqual({ data: parentRecord });
  });

  it('should return undefined if association, sourceKey, or sourceId is missing', async () => {
    const result = await requestParentRecordData({});
    expect(result).toEqual({ data: undefined });
  });

  it('should return undefined if association is missing', async () => {
    const sourceId = 1;
    const sourceKey = 'filterKey';
    const result = await requestParentRecordData({ sourceId, sourceKey });
    expect(result).toEqual({ data: undefined });
  });

  it('should return undefined if sourceKey is missing', async () => {
    const association = 'Collection.Field';
    const sourceId = 1;
    const result = await requestParentRecordData({ association, sourceId });
    expect(result).toEqual({ data: undefined });
  });

  it('should return undefined if sourceId is missing', async () => {
    const association = 'Collection.Field';
    const sourceKey = 'filterKey';
    const result = await requestParentRecordData({ association, sourceKey });
    expect(result).toEqual({ data: undefined });
  });

  it('should make a request to the correct URL if association is provided', async () => {
    const association = 'Collection.Field';
    const sourceId = 1;
    const sourceKey = 'filterKey';
    const api = {
      request: vi.fn().mockResolvedValue({ data: { id: 1, name: 'John Doe' } }),
    };
    const headers = { Authorization: 'Bearer token' };

    await requestParentRecordData({ association, sourceId, sourceKey, api, headers });

    expect(api.request).toHaveBeenCalledWith({
      url: 'Collection:get?filter[filterKey]=1',
      headers,
    });
  });
});

describe('BlockRequestContextProvider', () => {
  beforeEach(() => {
    mockKeepAliveState.active = true;
    mockLocationSearch.mockReset();
    mockLocationSearch.mockReturnValue('');
  });

  it('should skip keep-alive refresh when search params changed before page restore', async () => {
    const refresh = vi.fn();
    const recordRequest = {
      refresh,
      data: null,
      loading: false,
    } as any;

    const App = () => (
      <DataBlockContext.Provider value={{ dn: null, props: {} as any }}>
        <BlockRequestContextProvider recordRequest={recordRequest}>
          <div>content</div>
        </BlockRequestContextProvider>
      </DataBlockContext.Provider>
    );

    const { rerender } = render(<App />);

    mockKeepAliveState.active = false;
    rerender(<App />);

    mockLocationSearch.mockReturnValue('?f=1');
    mockKeepAliveState.active = true;
    rerender(<App />);

    await sleep(50);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('should refresh when restoring keep-alive page with unchanged search params', async () => {
    const refresh = vi.fn();
    const recordRequest = {
      refresh,
      data: null,
      loading: false,
    } as any;

    const App = () => (
      <DataBlockContext.Provider value={{ dn: null, props: {} as any }}>
        <BlockRequestContextProvider recordRequest={recordRequest}>
          <div>content</div>
        </BlockRequestContextProvider>
      </DataBlockContext.Provider>
    );

    const { rerender } = render(<App />);

    mockKeepAliveState.active = false;
    rerender(<App />);

    mockKeepAliveState.active = true;
    rerender(<App />);

    await sleep(50);

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
