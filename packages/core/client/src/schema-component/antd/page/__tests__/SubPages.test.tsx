/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getSubPageParamsAndPopupsParams,
  getSubPageParamsFromPath,
  getSubPagePath,
  getSubPagePathFromParams,
} from '../SubPages';

describe('getSubPagePathFromParams', () => {
  it('should generate the correct subpage path', () => {
    const params = {
      subpageuid: 'subPage1',
      filterbytk: 'filterbytk1',
      tab: 'tab1',
    };
    const expectedPath = '/subpages/subPage1/filterbytk/filterbytk1/tab/tab1';
    expect(getSubPagePathFromParams(params)).toBe(expectedPath);
  });

  it('should generate the correct subpage path without optional parameters', () => {
    const params = {
      subpageuid: 'subPage1',
      filterbytk: 'filterbytk1',
    };
    const expectedPath = '/subpages/subPage1/filterbytk/filterbytk1';
    expect(getSubPagePathFromParams(params)).toBe(expectedPath);
  });

  it('when exist popups in path', () => {
    const params = {
      subpageuid: 'subPage1',
      filterbytk: 'popups',
      tab: 'popups',
    };
    const expectedPath = `/subpages/subPage1/filterbytk/${window.btoa('popups')}/tab/${window.btoa('popups')}`;
    expect(getSubPagePathFromParams(params)).toBe(expectedPath);
  });
});

describe('getSubPageParamsAndPopupsParams', () => {
  it('should return the correct subPageParams and popupParams', () => {
    const path =
      'subPage1/datasource/datasource1/filterbytk/filterbytk1/popups/popupuid1/key1/value1/popups/popupuid2/key2/value2';
    const expectedSubPageParams = {
      subpageuid: 'subPage1',
      datasource: 'datasource1',
      filterbytk: 'filterbytk1',
    };
    const expectedPopupParams = [
      { popupuid: 'popupuid1', key1: 'value1' },
      { popupuid: 'popupuid2', key2: 'value2' },
    ];
    expect(getSubPageParamsAndPopupsParams(path)).toEqual({
      subPageParams: expectedSubPageParams,
      popupParams: expectedPopupParams,
    });
  });

  it('should return the correct subPageParams and empty popupParams', () => {
    const path = 'subPage1/datasource/datasource1/filterbytk/filterbytk1';
    const expectedSubPageParams = {
      subpageuid: 'subPage1',
      datasource: 'datasource1',
      filterbytk: 'filterbytk1',
    };
    const expectedPopupParams: string[] = [];
    expect(getSubPageParamsAndPopupsParams(path)).toEqual({
      subPageParams: expectedSubPageParams,
      popupParams: expectedPopupParams,
    });
  });
});

describe('getSubPageParamsFromPath', () => {
  it('should return the correct subPageParams from path without popups', () => {
    const path = 'subPage1/datasource/datasource1/filterbytk/filterbytk1';
    const expectedSubPageParams = {
      subpageuid: 'subPage1',
      datasource: 'datasource1',
      filterbytk: 'filterbytk1',
    };
    expect(getSubPageParamsFromPath(path)).toEqual(expectedSubPageParams);
  });

  it('when exist popups in path', () => {
    const path = `subPage1/datasource/datasource1/filterbytk/${window.btoa('popups')}`;
    const expectedSubPageParams = {
      subpageuid: 'subPage1',
      datasource: 'datasource1',
      filterbytk: 'popups',
    };
    expect(getSubPageParamsFromPath(path)).toEqual(expectedSubPageParams);
  });
});

describe('getSubPagePath', () => {
  it('should return the subpage path', () => {
    const location: any = {
      pathname: '/admin/subpages/subPage1/filterbytk/filterbytk1/tab/tab1',
    };
    const expectedPath = 'subPage1/filterbytk/filterbytk1/tab/tab1';
    expect(getSubPagePath(location)).toBe(expectedPath);
  });

  it('should return an empty string if subpage path is not found', () => {
    const location: any = {
      pathname: '/admin',
    };
    const expectedPath = '';
    expect(getSubPagePath(location)).toBe(expectedPath);
  });
});
