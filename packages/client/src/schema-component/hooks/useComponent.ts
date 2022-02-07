import { SchemaOptionsContext } from '@formily/react';
import { get } from 'lodash';
import { useContext } from 'react';

export const useComponent = (component: any) => {
  if (!component) {
    return null;
  }
  if (typeof component !== 'string') {
    return component;
  }
  const { components } = useContext(SchemaOptionsContext);
  return get(components, component);
};
