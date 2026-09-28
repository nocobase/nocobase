import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineAIConfig,
  type AIApplicationConfig,
} from '@nocobase/app-plugin-ai-employee/server/config';

const ai: AppConfigFactory<AIApplicationConfig> = defineAIConfig({
  // Map a secret onto the field of one service it sets, keyed by that
  // service's name, such as
  // `OPENAI_API_KEY: envString('llmServices.openai.options.apiKey')` or
  // `GITHUB_MCP_TOKEN: envString('mcpServers.github.headers.Authorization')`.
  env: {},
  defaults: () => ({
    storage: {},
    aiEmployee: { storage: {} },
    aiKnowledgeBase: {
      storage: {},
      vectorDatabases: [],
      manifests: [],
    },
    llmServices: {},
    skills: { paths: [] },
    mcpServers: {},
  }),
});

export default ai;
