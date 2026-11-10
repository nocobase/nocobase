/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { getTableColumnSortField, getTableSorterOrder, resolveTableSorterField } from '../sortUtils';

describe('table sort utils', () => {
  it('builds a relation sort path from the selected association title field', () => {
    const sortField = getTableColumnSortField({
      fieldPath: 'org_oho',
      props: {
        dataIndex: 'orgname',
        titleField: 'orgname',
      },
      collectionField: {
        name: 'org_oho',
        targetCollectionTitleFieldName: 'nickname',
        isAssociationField: () => true,
      },
      getStepParams: () => ({ label: 'orgname' }),
    });

    expect(sortField).toBe('org_oho.orgname');
  });

  it('falls back to the column field path for non-association fields', () => {
    const sortField = getTableColumnSortField({
      fieldPath: 'title',
      props: {
        dataIndex: 'title',
      },
      collectionField: {
        name: 'title',
        isAssociationField: () => false,
      },
    });

    expect(sortField).toBe('title');
  });

  it('prefers the explicit column sort field over antd sorter field', () => {
    expect(
      resolveTableSorterField({
        field: 'orgname',
        column: {
          sortField: 'org_oho.orgname',
        },
      }),
    ).toBe('org_oho.orgname');
  });
});

it('restores configured sorting after both directions of manual association sorting', () => {
  const column = { sortField: 'team.title' };
  const defaults = ['-createdAt', 'id'];
  expect(getTableSorterOrder({ column, order: 'ascend' }, undefined, defaults)).toEqual(['team.title']);
  expect(getTableSorterOrder({ column, order: 'descend' }, undefined, defaults)).toEqual(['-team.title']);
  expect(getTableSorterOrder({ column }, undefined, defaults)).toEqual(defaults);
  expect(getTableSorterOrder({ column })).toEqual([]);
  expect(getTableSorterOrder({ column }, 'position', defaults)).toEqual(['position']);
});
