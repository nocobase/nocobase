/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseSubFormValue = vi.fn();
const mockUseCollectionParentRecordData = vi.fn();
const mockUseParentCollection = vi.fn();
const mockUseFlag = vi.fn();

vi.mock('../../../../schema-component/antd/association-field/hooks', () => {
  return {
    useSubFormValue: () => mockUseSubFormValue(),
  };
});

vi.mock('../../../../data-source/collection-record/CollectionRecordProvider', () => {
  return {
    useCollectionParentRecordData: () => mockUseCollectionParentRecordData(),
  };
});

vi.mock('../../../../data-source/collection/AssociationProvider', () => {
  return {
    useParentCollection: () => mockUseParentCollection(),
  };
});

vi.mock('../../../../flag-provider', () => {
  return {
    useFlag: () => mockUseFlag(),
  };
});

import { useParentObjectContext } from '../useParentIterationVariable';

describe('useParentObjectContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFlag.mockReturnValue({
      isInSubForm: false,
      isInSubTable: true,
    });
    mockUseParentCollection.mockReturnValue({
      name: 't1_org',
      dataSource: 'main',
    });
  });

  it('falls back to parent record data when subform parent object is empty', () => {
    mockUseSubFormValue.mockReturnValue({
      parent: {
        value: {},
      },
    });
    mockUseCollectionParentRecordData.mockReturnValue({
      orgname: '上级公司A',
    });

    const { result } = renderHook(() => useParentObjectContext());

    expect(result.current).toEqual({
      shouldDisplayParentObject: true,
      parentObjectCtx: {
        orgname: '上级公司A',
      },
      collectionName: 't1_org',
      dataSource: 'main',
    });
  });

  it('prefers the explicit subform parent object when it already has data', () => {
    mockUseSubFormValue.mockReturnValue({
      parent: {
        value: {
          orgname: '来自子表单上下文',
        },
        collection: {
          name: 't1_org',
          dataSource: 'main',
        },
      },
    });
    mockUseCollectionParentRecordData.mockReturnValue({
      orgname: '来自父记录',
    });

    const { result } = renderHook(() => useParentObjectContext());

    expect(result.current).toEqual({
      shouldDisplayParentObject: true,
      parentObjectCtx: {
        orgname: '来自子表单上下文',
      },
      collectionName: 't1_org',
      dataSource: 'main',
    });
  });

  it('skips duplicated parent wrappers that point to the current subtable row', () => {
    const currentRow = {
      staffname: '456',
      address: null,
    };
    mockUseSubFormValue.mockReturnValue({
      formValue: currentRow,
      parent: {
        value: currentRow,
        collection: {
          name: 't1_staff',
          dataSource: 'main',
        },
        parent: {
          value: {
            orgname: '上级公司A',
          },
          collection: {
            name: 't1_org',
            dataSource: 'main',
          },
        },
      },
    });
    mockUseCollectionParentRecordData.mockReturnValue({});

    const { result } = renderHook(() => useParentObjectContext());

    expect(result.current).toEqual({
      shouldDisplayParentObject: true,
      parentObjectCtx: {
        orgname: '上级公司A',
      },
      collectionName: 't1_org',
      dataSource: 'main',
    });
  });
});
