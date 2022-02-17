import { SchemaOptionsContext } from '@formily/react';
import { get } from 'lodash';
import { useContext } from 'react';

export const useComponent = (component: any, defaults?: any) => {
  if (!component) {
    return defaults;
  }
  if (typeof component !== 'string') {
    return component;
  }
  const { components } = useContext(SchemaOptionsContext);
  return get(components, component) || defaults;
};
