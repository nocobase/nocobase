import { useMemo } from 'react';
import { useApp } from '../../hooks';
import { SchemaSettingOptions } from '../types';
import React from 'react';
import { SchemaSettingsWrapper } from '../components';
import { SchemaSettingsProps } from '../../../schema-settings';
import { Schema } from '@formily/json-schema';
import { GeneralField } from '@formily/core';
import { Designable } from '../../../schema-component';

type UseSchemaSettingsRenderOptions<T = {}> = Omit<SchemaSettingOptions<T>, 'name' | 'items'> &
  Omit<SchemaSettingsProps, 'title' | 'children'> & {
    fieldSchema?: Schema;
    field?: GeneralField;
    dn?: Designable;
  };

export function useSchemaSettingsRender<T = {}>(name: string, options?: UseSchemaSettingsRenderOptions<T>) {
  const app = useApp();
  const schemaSetting = useMemo(() => app.schemaSettingsManager.get<T>(name), [app.schemaSettingsManager, name]);
  const renderCache = React.useRef<Record<string, React.FunctionComponentElement<any>>>({});
  if (!name) {
    return {
      exists: false,
      render: () => null,
    };
  }

  if (!schemaSetting) {
    console.error(`[nocobase]: SchemaSettings "${name}" not found`);
    return {
      exists: false,
      render: () => null,
    };
  }
  return {
    exists: true,
    render: (options2: UseSchemaSettingsRenderOptions = {}) => {
      const key = JSON.stringify(options2);
      if (key && renderCache.current[key]) {
        return renderCache.current[key];
      }
      return (renderCache.current[key] = React.createElement(SchemaSettingsWrapper, {
        ...schemaSetting.options,
        ...options,
        ...options2,
      }));
    },
  };
}
