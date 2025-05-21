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
    expect(builtinVars.some(v => v.name === '$user')).toBeTruthy();
    expect(builtinVars.some(v => v.name === '$nDate')).toBeTruthy();
    expect(builtinVars.some(v => v.name === '$nToken')).toBeTruthy();
  });

  it('should include custom variables registered in the application', () => {
    // Arrange
    const mockVariable = {
      name: 'customVar',
      useVariableSettings: () => ({
        ctx: { customProp: 'test' },
        options: {
          label: 'Custom Variable',
          value: 'customVar'
        }
      }),
    };

    // Register a custom variable
    app.registerVariable(mockVariable);

    // Act
    const { result } = renderHook(() => useBuiltinVariables());

    // Assert - check if our custom variable is included
    const builtinVars = result.current.builtinVariables;
    const customVar = builtinVars.find(v => v.name === 'customVar');

    expect(customVar).toBeDefined();
    expect(customVar.ctx).toEqual({ customProp: 'test' });
  });

  it('should handle multiple custom variables', () => {
    // Arrange
    const mockVariables = [
      {
        name: 'customVar1',
        useVariableSettings: () => ({
          ctx: { source: 'var1' },
          options: {
            label: 'Custom Variable 1',
            value: 'customVar1'
          }
        }),
      },
      {
        name: 'customVar2',
        useVariableSettings: () => ({
          ctx: { source: 'var2' },
          options: {
            label: 'Custom Variable 2',
            value: 'customVar2'
          }
        }),
      },
      {
        name: 'customVar3',
        useVariableSettings: () => ({
          ctx: { source: 'var3' },
          options: {
            label: 'Custom Variable 3',
            value: 'customVar3'
          }
        }),
      }
    ];

    // Register custom variables
    mockVariables.forEach(variable => app.registerVariable(variable));

    // Act
    const { result } = renderHook(() => useBuiltinVariables());

    // Assert - check if all custom variables are included
    const builtinVars = result.current.builtinVariables;

    mockVariables.forEach(mockVar => {
      const foundVar = builtinVars.find(v => v.name === mockVar.name);
      expect(foundVar).toBeDefined();
      expect(foundVar.ctx).toEqual({ source: mockVar.name.replace('customVar', 'var') });
    });
  });

  it('should handle custom variables with function useCtx', () => {
    // Arrange
    const mockCtxFn = vi.fn().mockReturnValue({ dynamicValue: 'computed' });
    const mockVariable = {
      name: 'functionalVar',
      useVariableSettings: () => ({
        ctx: mockCtxFn,
        options: {
          label: 'Functional Variable',
          value: 'functionalVar'
        }
      }),
    };

    // Register a custom variable with function useCtx
    app.registerVariable(mockVariable);

    // Act
    const { result } = renderHook(() => useBuiltinVariables());

    // Assert - check if our functional variable is included
    const builtinVars = result.current.builtinVariables;
    const funcVar = builtinVars.find(v => v.name === 'functionalVar');

    expect(funcVar).toBeDefined();
    // The variable context should be the function itself
    expect(funcVar.ctx).toBe(mockCtxFn);
  });
});
