import { useMemo } from 'react';
import { useApp } from '../../hooks';
import { SchemaSettingOptions } from '../types';
import React from 'react';
import { SchemaSettingsWrapper } from '../components';
import { SchemaSettingsProps } from '../../../schema-settings';

type UseSchemaSettingsRenderOptions<T = {}> = SchemaSettingOptions<T> & Omit<SchemaSettingsProps, 'title' | 'children'>;

export function useSchemaSettingsRender<T = {}>(name: string, options?: UseSchemaSettingsRenderOptions<T>) {
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
    render: (options2?: UseSchemaSettingsRenderOptions) =>
      React.createElement(SchemaSettingsWrapper, { ...schemaSetting.options, ...options, ...options2 }),
  };
}
