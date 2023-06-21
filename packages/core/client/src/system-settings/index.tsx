export * from './SystemSettingsProvider';
export * from './SystemSettingsShortcut';
import { Plugin } from '../application-v2';
import { SystemSettingsProvider } from './SystemSettingsProvider';

export class SystemSettingsPlugin extends Plugin {
  async load() {
    this.app.use(SystemSettingsProvider, this.options);
  }
}
