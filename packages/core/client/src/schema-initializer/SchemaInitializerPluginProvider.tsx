import { ExportActionInitializer, ExportDesigner, ExportProvider } from '@nocobase/plugin-export/src/client';
import React from 'react';
import { SchemaComponentOptions } from '../schema-component';

const Blank = ({ children }) => children || null;

export const SchemaInitializerPluginProvider = (props: any) => {
  const plugins = [ExportProvider];
  const Root = plugins.reduce((Parent, Child) => {
    return ({ children }) => (
      <Parent>
        <Child>{children}</Child>
      </Parent>
    );
  });
  return (
    <SchemaComponentOptions components={{ ExportActionInitializer, ExportDesigner }}>
      <Root>{props.children}</Root>
    </SchemaComponentOptions>
  );
};
