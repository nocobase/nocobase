/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { requestParentRecordData } from '../../data-block/DataBlockRequestProvider';

describe('requestParentRecordData', () => {
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
