import React from 'react';
import { render } from 'testUtils';
import AppContextProvider from '../../test/AppContextProvider';
import { SettingsMenu } from '../CurrentUser';
import { useCurrentUserSettingsMenu } from '../CurrentUserSettingsMenuProvider';

describe('CurrentUserSettingsMenuProvider', () => {
  const wrapper = ({ children }) => {
    return (
      <AppContextProvider>
        <SettingsMenu />
        {children}
      </AppContextProvider>
    );
  };

  const TestComponent = () => {
    const { getMenuItems } = useCurrentUserSettingsMenu();
    getMenuItems();
    return <div>Test</div>;
  };

  it('should throw error when CurrentUserSettingsMenuProvider is not provided', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrowErrorMatchingInlineSnapshot(
      '"CurrentUser: You should use `CurrentUserSettingsMenuProvider` in the root of your app."',
    );
  });

  it('should not throw error when providing context', () => {
    expect(() => {
      render(<TestComponent />, { wrapper });
    }).not.toThrow();
  });

  // TODO: result.current 是 null，会报错，暂时不知道哪里出了问题
  // it.skip('add menu item', () => {
  //   const { result } = renderHook(() => useCurrentUserSettingsMenu(), {
  //     wrapper,
  //   });

  //   expect(result.current.getMenuItems()).not.toHaveLength(0);
  // });
});
