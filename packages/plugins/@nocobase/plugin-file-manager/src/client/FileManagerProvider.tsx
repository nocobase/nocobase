import { SchemaComponentOptions } from '@nocobase/client';
import React, { FC } from 'react';
import * as hooks from './hooks';
import { UploadActionInitializer } from './initializers';

export const FileManagerProvider: FC = (props) => {
  return (
    <SchemaComponentOptions scope={hooks} components={{ UploadActionInitializer }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
