/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@nocobase/test/client';
import * as UseAppModule from '../../../../application/hooks/useApp';
import * as UseCurrentUserModule from '../../../../user/CurrentUserProvider';
import { useAPITokenVariable } from '../useAPITokenVariable';
import { useCurrentRoleVariable } from '../useRoleVariable';

describe('builtin variable api client fallback', () => {
  beforeEach(() => {
    vi.spyOn(UseAppModule, 'useApp').mockReturnValue({} as any);
    vi.spyOn(UseCurrentUserModule, 'useCurrentUserContext').mockReturnValue({
      data: {
        data: {
          roles: [
            {
              name: 'admin',
              title: 'Admin',
            },
          ],
        },
      },
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not throw when api client is unavailable', () => {
    const { result: roleResult } = renderHook(() => useCurrentRoleVariable());
    const { result: tokenResult } = renderHook(() => useAPITokenVariable());

    expect(roleResult.current.currentRoleCtx).toBeUndefined();
    expect(tokenResult.current.apiTokenCtx).toBeUndefined();
  });
});
