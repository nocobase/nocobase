import { BlockSchemaComponentPlugin, Plugin } from '@nocobase/client';
import { ChartsProvider } from './ChartsProvider';

export class ChartsPlugin extends Plugin {
  async load() {
    this.app.use(ChartsProvider);

    // TODO: 主应用应该会有这个插件，按道理不需要再注册
    this.app.pm.add(BlockSchemaComponentPlugin);
  }
}

export default ChartsPlugin;
