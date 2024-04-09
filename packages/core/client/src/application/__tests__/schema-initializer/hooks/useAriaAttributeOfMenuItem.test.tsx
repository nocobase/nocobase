import { renderHook } from '@testing-library/react-hooks';
import { useAriaAttributeOfMenuItem, SchemaInitializerMenuProvider } from '@nocobase/client';

describe('useAriaAttributeOfMenuItem', () => {
  test('should return attribute with role "menuitem" when not in menu', () => {
    const { result } = renderHook(() => useAriaAttributeOfMenuItem());
    expect(result.current.attribute).toEqual({ role: 'menuitem' });
  });

  test('should return empty attribute when in menu', () => {
    const { result } = renderHook(() => useAriaAttributeOfMenuItem(), {
      wrapper: SchemaInitializerMenuProvider,
    });
    expect(result.current.attribute).toEqual({});
  });
});
