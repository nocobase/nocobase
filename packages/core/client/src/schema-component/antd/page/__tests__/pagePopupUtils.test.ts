/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getPopupParamsFromPath, getPopupPathFromParams, removeLastPopupPath } from '../pagePopupUtils';

describe('getPopupParamsFromPath', () => {
  it('should parse the path and return the popup parameters', () => {
    const path =
      'popupUid/tab/tabValue/datasource/datasourceValue/filterbytk/filterValue/collection/collectionValue/association/associationValue/sourceid/sourceidValue';
    const result = getPopupParamsFromPath(path);

    expect(result).toEqual([
      {
        popupuid: 'popupUid',
        tab: 'tabValue',
        datasource: 'datasourceValue',
        filterbytk: 'filterValue',
        collection: 'collectionValue',
        association: 'associationValue',
        sourceid: 'sourceidValue',
      },
    ]);
  });

  it('should handle multiple popups in the path', () => {
    const path =
      'popupUid1/tab/tabValue1/datasource/datasourceValue1/filterbytk/filterValue1/collection/collectionValue1/association/associationValue1/sourceid/sourceidValue1/popups/popupUid2/tab/tabValue2/datasource/datasourceValue2/filterbytk/filterValue2/collection/collectionValue2/association/associationValue2/sourceid/sourceidValue2';
    const result = getPopupParamsFromPath(path);

    expect(result).toEqual([
      {
        popupuid: 'popupUid1',
        tab: 'tabValue1',
        datasource: 'datasourceValue1',
        filterbytk: 'filterValue1',
        collection: 'collectionValue1',
        association: 'associationValue1',
        sourceid: 'sourceidValue1',
      },
      {
        popupuid: 'popupUid2',
        tab: 'tabValue2',
        datasource: 'datasourceValue2',
        filterbytk: 'filterValue2',
        collection: 'collectionValue2',
        association: 'associationValue2',
        sourceid: 'sourceidValue2',
      },
    ]);
  });
});

describe('getPopupPathFromParams', () => {
  it('should generate the popup path from the parameters', () => {
    const params = {
      popupuid: 'popupUid',
      tab: 'tabValue',
      datasource: 'datasourceValue',
      filterbytk: 'filterValue',
      collection: 'collectionValue',
      association: 'associationValue',
      sourceid: 'sourceidValue',
    };
    const result = getPopupPathFromParams(params);

    expect(result).toBe(
      '/popups/popupUid/datasource/datasourceValue/filterbytk/filterValue/collection/collectionValue/association/associationValue/sourceid/sourceidValue/tab/tabValue',
    );
  });

  it('should handle optional parameters', () => {
    const params = {
      popupuid: 'popupUid',
      tab: 'tabValue',
      datasource: 'datasourceValue',
      filterbytk: 'filterValue',
      collection: undefined,
      association: 'associationValue',
      sourceid: undefined,
    };
    const result = getPopupPathFromParams(params);

    expect(result).toBe(
      '/popups/popupUid/datasource/datasourceValue/filterbytk/filterValue/association/associationValue/tab/tabValue',
    );
  });
});

describe('removeLastPopupPath', () => {
  it('should remove the last popup path from the given path', () => {
    const path1 = '/admin/page/popups/popupUid/popups/popupUid2';
    const result1 = removeLastPopupPath(path1);

    expect(result1).toBe('/admin/page/popups/popupUid/');

    const path2 = '/admin/page/popups/popupUid';
    const result2 = removeLastPopupPath(path2);

    expect(result2).toBe('/admin/page/');
  });

  it('should handle paths without popups', () => {
    const path = '/admin/page';
    const result = removeLastPopupPath(path);

    expect(result).toBe(path);
  });

  it('should handle empty paths', () => {
    const path = '';
    const result = removeLastPopupPath(path);

    expect(result).toBe('');
  });
});
