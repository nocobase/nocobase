import {
  ExportActionInitializer,
  ExportDesigner,
  ExportProvider,
  useExportAction,
} from '@nocobase/plugin-export/src/client';
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
    <SchemaComponentOptions components={{ ExportActionInitializer, ExportDesigner }} scope={{ useExportAction }}>
      <Root>{props.children}</Root>
    </SchemaComponentOptions>
  );
};
