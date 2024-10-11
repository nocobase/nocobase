/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../../collection-manager';
import { useOperatorList } from '../useOperators';

// Mock dependencies
vi.mock('@formily/react', () => ({
  useFieldSchema: vi.fn(),
}));

vi.mock('../../../../collection-manager', () => ({
  useCollection_deprecated: vi.fn(),
  useCollectionManager_deprecated: vi.fn(),
}));

describe('useOperatorList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return operators list based on x-designer-props', () => {
    const mockSchema = {
      'x-designer-props': {
        interface: 'input',
      },
    };
    const mockOperators = ['eq', 'ne'];

    vi.mocked(useFieldSchema).mockReturnValue(mockSchema as any);
    vi.mocked(useCollection_deprecated).mockReturnValue({ name: 'test' } as any);
    vi.mocked(useCollectionManager_deprecated).mockReturnValue({
      getCollectionFields: vi.fn(),
      getInterface: vi.fn().mockReturnValue({
        filterable: {
          operators: mockOperators,
        },
      }),
    } as any);

    const { result } = renderHook(() => useOperatorList());
    expect(result.current).toEqual(mockOperators);
  });

  it('should return operators list based on field interface', () => {
    const mockSchema = { name: 'testField' };
    const mockOperators = ['contains', 'notContains'];
    const mockField = { name: 'testField', interface: 'input' };

    vi.mocked(useFieldSchema).mockReturnValue(mockSchema as any);
    vi.mocked(useCollection_deprecated).mockReturnValue({ name: 'test' } as any);
    vi.mocked(useCollectionManager_deprecated).mockReturnValue({
      getCollectionFields: vi.fn().mockReturnValue([mockField]),
      getInterface: vi.fn().mockReturnValue({
        filterable: {
          operators: mockOperators,
        },
      }),
    } as any);

    const { result } = renderHook(() => useOperatorList());
    expect(result.current).toEqual(mockOperators);
  });

  it('should filter out invisible operators', () => {
    const mockSchema = { name: 'testField' };
    const mockOperators = [{ name: 'eq', visible: () => true }, { name: 'ne', visible: () => false }, { name: 'gt' }];
    const mockField = { name: 'testField', interface: 'input' };

    vi.mocked(useFieldSchema).mockReturnValue(mockSchema as any);
    vi.mocked(useCollection_deprecated).mockReturnValue({ name: 'test' } as any);
    vi.mocked(useCollectionManager_deprecated).mockReturnValue({
      getCollectionFields: vi.fn().mockReturnValue([mockField]),
      getInterface: vi.fn().mockReturnValue({
        filterable: {
          operators: mockOperators,
        },
      }),
    } as any);

    const { result } = renderHook(() => useOperatorList());
    expect(result.current).toEqual([{ name: 'eq', visible: expect.any(Function) }, { name: 'gt' }]);
  });
});
