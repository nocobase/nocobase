import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';
import manifest from '../../package.json' with { type: 'json' };

const agents: AppConfigFactory<AgentsConfig> = defineAppConfig((runtime) => ({
  app: { id: runtime.routing.name, name: runtime.routing.name },
  cli: { name: manifest.nocobase.cli.bin, package: { kind: 'served' } },
}));

export default agents;
