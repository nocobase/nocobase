import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import LLMModels from './models.js';
import LLMTest from './test.js';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-ai-employee',
  description: 'Discover and test models from configured LLM services.',
  commands: {
    models: LLMModels,
    test: LLMTest,
  },
});

export default cliPlugin;
