import { useMemo } from 'react';
import { useApp } from '../../hooks';
import { SchemaSettingOptions } from '../types';
import React from 'react';
import { SchemaSettingsWrapper } from '../components';

export function useSchemaSettingsRender<T = {}, DesignerContext = {}>(name: string, options?: SchemaSettingOptions<T>) {
  const app = useApp();
  const schemaSetting = useMemo(() => app.schemaSettingsManager.get<T>(name), [app.schemaSettingsManager, name]);
  if (!name) {
    return {
      exists: false,
      render: () => null,
    };
  }

  if (!schemaSetting) {
    console.error(`[nocobase]: SchemaSetting "${name}" not found`);
    return {
      exists: false,
      render: () => null,
    };
  }
  return {
    exists: true,
    render: (designer?: DesignerContext) =>
      React.createElement(SchemaSettingsWrapper, { ...schemaSetting.options, ...options, designer }),
  };
}
