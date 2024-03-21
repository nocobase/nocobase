import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { PrintActionInitializer } from './PrintActionInitializer';
import { useDetailPrintActionProps } from './utils';

export const PrintActionPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ PrintActionInitializer }} scope={{ useDetailPrintActionProps }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
