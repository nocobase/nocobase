import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';

const agents: AppConfigFactory<AgentsConfig> = defineAppConfig((runtime) => ({
  // Keep existing Runner registrations keyed by the application, not the new CLI brand.
  app: { id: runtime.routing.name, name: runtime.routing.name },
  cli: { name: 'nocobase-examples', package: { kind: 'served' } },
}));

export default agents;
