import { SchemaSettings } from '@nocobase/client';
import { RenderSettingsOptions, renderSettings } from './renderSettings';

type RenderSingleSettingsOptions = Omit<RenderSettingsOptions, 'schemaSettings'>;

export const renderSingleSettings = ({ Component, schema, ...options }: RenderSingleSettingsOptions) => {
  const testSettings = new SchemaSettings({
    name: 'testSettings',
    items: [
      {
        name: 'test',
        Component,
      },
    ],
  });

  schema = Object.assign({}, schema, { 'x-settings': 'testSettings' });

  return renderSettings({ ...options, schemaSettings: testSettings, schema });
};
