import React, { FC } from 'react';
import { UseInitializerChildrenResult, useInitializerChildren } from '../hooks';
import { SchemaInitializerItemType } from '../types';

export const SchemaInitializerChildren: FC<{ children: SchemaInitializerItemType[] }> = (props) => {
  const { children } = props;
  const validChildren = useInitializerChildren(children);
  return (
    <>
      {validChildren.map((item, index) => (
        <SchemaInitializerChild key={item.name || item.key || index} {...item} />
      ))}
    </>
  );
};

const useChildrenDefault = () => undefined;
const SchemaInitializerChild: FC<UseInitializerChildrenResult> = (props) => {
  const { children, useChildren = useChildrenDefault, checkChildrenLength, name, Component, ...others } = props;
  const useChildrenRes = useChildren();
  const componentChildren = useChildrenRes || children;
  if (checkChildrenLength && (!Array.isArray(componentChildren) || componentChildren.length === 0)) {
    return null;
  }
  return React.createElement(Component, { key: name, name, ...others }, useChildrenRes || children);
};
