import React, { FC } from 'react';
import { UseInitializerChildrenResult, useInitializerChildren } from '../hooks';
import { SchemaInitializerItemType } from '../types';

export const SchemaInitializerChildren: FC<{ children: SchemaInitializerItemType[] }> = (props) => {
  const { children } = props;
  const validChildren = useInitializerChildren(children);
  return (
    <>
      {validChildren.map((item, index) => (
        <SchemaInitializerChild key={item.name || index} {...item} />
      ))}
    </>
  );
};

const useChildrenDefault = () => undefined;
const SchemaInitializerChild: FC<UseInitializerChildrenResult> = (props) => {
  // const { insert } = useSchemaInitializerV2();
  const { children, useChildren = useChildrenDefault, name, Component, ...others } = props;
  const useChildrenRes = useChildren();
  return React.createElement(Component, { key: name, name, ...others }, useChildrenRes || children);
};
