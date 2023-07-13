import { SchemaOptionsContext } from '@formily/react';
import { get } from 'lodash';
import { useContext } from 'react';

export const useComponent = (component: any, defaults?: any) => {
  const { components } = useContext(SchemaOptionsContext);
  if (!component) {
    return defaults;
  }
  if (typeof component !== 'string') {
    return component;
  }
  return get(components, component) || defaults;
};
