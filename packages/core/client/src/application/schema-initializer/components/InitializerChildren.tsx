import React, { FC } from 'react';
import { UseInitializerChildrenResult, useInitializerChildren, useSchemaInitializerV2 } from '../hooks';
import { SchemaInitializerItemType } from '../types';

export const InitializerChildren: FC<{ children: SchemaInitializerItemType[] }> = (props) => {
  const { children } = props;
  const validChildren = useInitializerChildren(children);
  return (
    <>
      {validChildren.map((item, index) => (
        <InitializerChild key={item.name || index} {...item} />
      ))}
    </>
  );
};

const useChildrenDefault = () => undefined;
const InitializerChild: FC<UseInitializerChildrenResult> = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { children, useChildren = useChildrenDefault, name, Component, ...others } = props;
  const useChildrenRes = useChildren();
  // TODO：insert 要移除改为 hooks
  return React.createElement(Component, { key: name, name, insert, ...others }, useChildrenRes || children);
};
