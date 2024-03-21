import { render } from '@nocobase/test/client';
import React from 'react';
import { SettingsMenu } from '../CurrentUser';
import { useCurrentUserSettingsMenu } from '../CurrentUserSettingsMenuProvider';

const AppContextProvider = (props) => {
  return <div></div>;
};

// TODO: AppContextProvider 没有提供足够的上下文环境
describe.skip('CurrentUserSettingsMenuProvider', () => {
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
