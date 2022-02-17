import React from 'react';
import { SchemaComponentOptions } from '../schema-component';
import * as initializers from './Initializers';

export const SchemaInitializerProvider: React.FC = (props) => {
  return <SchemaComponentOptions components={initializers}>{props.children}</SchemaComponentOptions>;
};
