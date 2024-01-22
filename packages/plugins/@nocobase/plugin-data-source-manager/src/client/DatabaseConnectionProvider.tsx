import { SchemaComponentOptions } from '@nocobase/client';
import React, { FC } from 'react';
import * as hooks from './hooks';

export const DatabaseConnectionProvider: FC = (props) => {
  return (
    <SchemaComponentOptions scope={hooks} components={{}}>
      {props.children}
    </SchemaComponentOptions>
  );
};
