import { Plugin } from '@nocobase/server';
import PluginAIServer from '@nocobase/plugin-ai';
import { gigaChatProviderOptions } from './llm-providers/gigachat';

export class PluginAIGigaChatServer extends Plugin {
  async afterAdd() { }

  async beforeLoad() { }

  async load() {
    this.aiPlugin.aiManager.registerLLMProvider('gigachat', gigaChatProviderOptions);
  }

  async install() { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }

  private get aiPlugin(): PluginAIServer {
    return this.app.pm.get('ai');
  }
}

export default PluginAIGigaChatServer;
