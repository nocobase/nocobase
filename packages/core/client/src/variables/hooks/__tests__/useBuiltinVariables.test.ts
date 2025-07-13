/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '../../../application/Application';
import { renderHook } from '@nocobase/test/client';
import useBuiltinVariables from '../useBuiltinVariables';
import * as UseAppModule from '../../../application/hooks/useApp';

describe('useBuiltinVariables', () => {
  // Create an application instance
  let app: Application;

  beforeEach(() => {
    app = new Application();

    // Mock useApp to return our test application instance
    vi.spyOn(UseAppModule, 'useApp').mockReturnValue(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Mock for other hooks that useBuiltinVariables depends on
  vi.mock('../../../schema-settings/VariableInput/hooks/useURLSearchParamsVariable', () => ({
    useURLSearchParamsVariable: vi.fn().mockReturnValue({
      urlSearchParamsCtx: {},
      name: '$url',
      defaultValue: {},
    }),
  }));

  vi.mock('../../../schema-settings/VariableInput/hooks/useUserVariable', () => ({
    useCurrentUserVariable: vi.fn().mockReturnValue({
      currentUserCtx: {},
    }),
  }));

  vi.mock('../../../schema-settings/VariableInput/hooks/useRoleVariable', () => ({
    useCurrentRoleVariable: vi.fn().mockReturnValue({
      currentRoleCtx: {},
    }),
  }));

  vi.mock('../../../schema-settings/VariableInput/hooks/useAPITokenVariable', () => ({
    useAPITokenVariable: vi.fn().mockReturnValue({
      apiTokenCtx: {},
    }),
  }));

  vi.mock('../../../schema-settings/VariableInput/hooks/useDateVariable', () => ({
    useDatetimeVariable: vi.fn().mockReturnValue({
      datetimeCtx: {},
    }),
  }));

  vi.mock('../../../application/hooks/useGlobalVariable', () => ({
    useGlobalVariableCtx: vi.fn().mockReturnValue({}),
  }));

  it('should include default builtin variables', () => {
    // Act
    const { result } = renderHook(() => useBuiltinVariables());

    // Assert - check if default builtin variables are present
    const builtinVars = result.current.builtinVariables;

    // Check for some standard variables
    expect(builtinVars.some((v) => v.name === '$user')).toBeTruthy();
    expect(builtinVars.some((v) => v.name === '$nDate')).toBeTruthy();
    expect(builtinVars.some((v) => v.name === '$nToken')).toBeTruthy();
  });
});
