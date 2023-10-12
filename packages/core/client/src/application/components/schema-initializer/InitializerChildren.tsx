import React, { FC } from 'react';
import { useFindComponent } from '../../../schema-component';
import {
  SchemaInitializerOptions,
  useSchemaInitializerV2,
  InitializerGroup,
  SchemaInitializerListItemType,
} from '../../SchemaInitializer';

export const InitializerChildren: FC<{ children: SchemaInitializerOptions['list'] }> = (props) => {
  const { children } = props;
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item) => (
          <InitializerChild key={item.name} {...item} />
        ))}
    </>
  );
};

const InitializerChild: FC<SchemaInitializerListItemType> = (props) => {
  const findComponent = useFindComponent();
  const { insert } = useSchemaInitializerV2();
  const { children, type, sort: _unUse, visible, name, Component, ...others } = props;
  const visibleResult = visible?.();
  if (visible && !visibleResult) return null;
  const C = type === 'itemGroup' ? InitializerGroup : findComponent(Component);
  if (!C) return null;
  return React.createElement(C, { key: name, name, insert, ...others }, children);
};
