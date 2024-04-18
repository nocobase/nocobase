import { RenderSettingsOptions, renderSettings } from './renderSettings';
import { setSchemaWithSettings } from '../web';

interface RenderSingleSettingsOptions extends Omit<RenderSettingsOptions, 'schemaSettings'> {
  settingPath?: string;
}

export const renderSingleSettings = (options: RenderSingleSettingsOptions) => {
  setSchemaWithSettings(options);

  return renderSettings(options);
};

export const renderReadPrettySingleSettings = (options: RenderSingleSettingsOptions) => {
  setSchemaWithSettings(options);

  options.schema['x-read-pretty'] = true;

  return renderSettings(options);
};
