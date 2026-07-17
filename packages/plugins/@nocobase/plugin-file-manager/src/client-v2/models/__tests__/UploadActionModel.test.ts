/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  appendUploadDataSourceKey,
  getModelDataSourceKey,
  getUploadAction,
  getUploadDataSourceHeaders,
} from '../UploadActionModel';

describe('UploadActionModel data source routing', () => {
  it('uses the owning block resource data source instead of the popup collection context', () => {
    expect(
      getModelDataSourceKey({
        context: {
          collection: { dataSourceKey: 'main', name: 'files' },
          blockModel: {
            collection: { dataSourceKey: 'external', name: 'files' },
            resource: { getDataSourceKey: () => 'external' },
          },
        },
      }),
    ).toBe('external');
  });

  it('falls back to the owning block collection data source', () => {
    expect(
      getModelDataSourceKey({
        context: {
          collection: { dataSourceKey: 'main', name: 'files' },
          blockModel: {
            collection: { dataSourceKey: 'external', name: 'files' },
          },
        },
      }),
    ).toBe('external');
  });

  it('adds the external upload data source parameter', () => {
    expect(appendUploadDataSourceKey('files:create', 'external')).toBe('files:create?uploadDataSourceKey=external');
    expect(appendUploadDataSourceKey('files:create', 'main')).toBe('files:create');
    expect(getUploadAction('files:create', 'custom-files:create', 'external')).toBe(
      'custom-files:create?uploadDataSourceKey=external',
    );
    expect(appendUploadDataSourceKey('files:create?uploadDataSourceKey=external', 'external')).toBe(
      'files:create?uploadDataSourceKey=external',
    );
    expect(getUploadDataSourceHeaders('external')).toEqual({ 'X-Data-Source': 'external' });
    expect(getUploadDataSourceHeaders('main')).toEqual({});
  });
});
