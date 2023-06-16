import React, { ComponentType, FC } from 'react';
import { BlankComponent } from './components/BlankComponent';
import { ComponentAndProps } from './types';

export const compose = (...components: ComponentAndProps[]) => {
  const Component = components.reduce<ComponentType>((Parent, child) => {
    const [Child, childProps] = child;
    const ComposeComponent = ({ children }) => (
      <Parent>
        <Child {...childProps}>{children}</Child>
      </Parent>
    );
    return ComposeComponent;
  }, BlankComponent);

  return (LastChild?: ComponentType) =>
    ((props?: any) => {
      return <Component>{LastChild && <LastChild {...props} />}</Component>;
    }) as FC;
};
