/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook, waitFor } from '@nocobase/test/client';
import { useParsedFilter } from '../../hooks/useParsedFilter';

const { parseFilter, findVariable } = vi.hoisted(() => ({
  parseFilter: vi.fn(),
  findVariable: vi.fn(),
}));

vi.mock('../../../schema-settings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../schema-settings')>();
  return {
    ...actual,
    useParseDataScopeFilter: () => ({
      parseFilter,
      findVariable,
    }),
  };
});

describe('useParsedFilter', () => {
  beforeEach(() => {
    parseFilter.mockReset();
    findVariable.mockReset();
  });

  it('should set loading to true immediately when filter option changes', async () => {
    parseFilter.mockResolvedValueOnce({ status: 'draft' }).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'published' }), 20);
        }),
    );

    const { result, rerender } = renderHook(({ filterOption }) => useParsedFilter({ filterOption }), {
      initialProps: {
        filterOption: { status: 'draft' },
      },
    });

    await waitFor(() => {
      expect(result.current.parseVariableLoading).toBe(false);
      expect(result.current.filter).toEqual({ status: 'draft' });
    });

    rerender({
      filterOption: { status: 'published' },
    });

    expect(result.current.parseVariableLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.parseVariableLoading).toBe(false);
      expect(result.current.filter).toEqual({ status: 'published' });
    });
  });
});
