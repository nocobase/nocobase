import React, { ComponentType, FC } from 'react';
import { BlankComponent } from './components';
import { ComponentAndProps } from './types';

export const compose = (...components: ComponentAndProps[]) => {
  const Component = components.reduce<ComponentType>((Parent, child) => {
    const [Child, childProps] = child;
    const ComposeComponent: FC = ({ children }) => (
      <Parent>
        <Child {...childProps}>{children}</Child>
      </Parent>
    );
    ComposeComponent.displayName = Child.displayName;
    return ComposeComponent;
  }, BlankComponent);

  return (LastChild?: ComponentType) =>
    ((props?: any) => {
      return <Component>{LastChild && <LastChild {...props} />}</Component>;
    }) as FC;
};
