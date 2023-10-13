import React, { FC } from 'react';
import { UseInitializerChildrenResult, useInitializerChildren, useSchemaInitializerV2 } from '../hooks';
import { SchemaInitializerOptions } from '../types';

export const InitializerChildren: FC<{ children: SchemaInitializerOptions['list'] }> = (props) => {
  const { children } = props;
  const validChildren = useInitializerChildren(children);
  return (
    <>
      {validChildren.map((item) => (
        <InitializerChild key={item.name} {...item} />
      ))}
    </>
  );
};

const InitializerChild: FC<UseInitializerChildrenResult> = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { children, name, Component, ...others } = props;
  // TODO：insert 要移除改为 hooks
  return React.createElement(Component, { key: name, name, insert, ...others }, children);
};
