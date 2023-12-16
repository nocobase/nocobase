import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { DuplicateActionInitializer } from './DuplicateActionInitializer';
import { DuplicateAction } from './DuplicateAction';

export const DuplicatePluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ DuplicateActionInitializer, DuplicateAction }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
