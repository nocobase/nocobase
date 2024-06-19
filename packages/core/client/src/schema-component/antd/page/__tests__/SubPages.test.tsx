/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getSubPagePathFromParams } from '../SubPages';

describe('getSubPagePathFromParams', () => {
  it('should generate the correct subpage path', () => {
    const params = {
      subPageUid: 'subPage1',
      tab: 'tab1',
      datasource: 'datasource1',
      filterbytk: 'filterbytk1',
      collection: 'collection1',
      association: 'association1',
      sourceid: 'sourceid1',
    };
    const expectedPath =
      '/subpages/subPage1/datasource/datasource1/filterbytk/filterbytk1/collection/collection1/association/association1/sourceid/sourceid1/tab/tab1';
    expect(getSubPagePathFromParams(params)).toBe(expectedPath);
  });

  it('should generate the correct subpage path without optional parameters', () => {
    const params = {
      subPageUid: 'subPage1',
      datasource: 'datasource1',
      filterbytk: 'filterbytk1',
    };
    const expectedPath = '/subpages/subPage1/datasource/datasource1/filterbytk/filterbytk1';
    expect(getSubPagePathFromParams(params)).toBe(expectedPath);
  });
});
