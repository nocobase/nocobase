import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';

const agents: AppConfigFactory<AgentsConfig> = defineAppConfig((runtime) => ({
  // Keep existing Runner registrations keyed by the application, not the new CLI brand.
  app: { id: runtime.routing.name, name: runtime.routing.name },
  cli: { name: 'nocobase-examples', package: { kind: 'served' } },
  fileInputs: {
    profiles: [
      {
        // Verified against the official vision guide on 2026-10-23; never grant this to another endpoint.
        // https://api-docs.deepseek.com/zh-cn/guides/vision
        modelService: 'deepseek',
        model: 'deepseek-flash',
        provider: 'deepseek',
        protocol: 'chat-completions',
        baseUrl: 'https://api.deepseek.com',
        nativeMediaTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        extraction: 'local',
      },
    ],
  },
}));

export default agents;
