import React from 'react';

export const compose = (...components) => {
  const Root = components.reduce((parent, child) => {
    const [Parent, parentProps] = Array.isArray(parent) ? parent : [parent];
    const [Child, childProps] = Array.isArray(child) ? child : [child];
    console.log({ Parent, Child, parentProps, childProps });
    return ({ children }) => (
      <Parent {...parentProps}>
        <Child {...childProps}>{children}</Child>
      </Parent>
    );
  });
  return (LastChild?: any) => (props) => <Root>{LastChild && <LastChild {...props} />}</Root>;
};
