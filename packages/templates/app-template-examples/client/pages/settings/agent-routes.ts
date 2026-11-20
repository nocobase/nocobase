import {
  defineSettingsRoutes,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import {
  agentsRoute,
  modelsRoute,
  runtimesRoute,
  skillsRoute,
  usageRoute,
} from '@nocobase/app-plugin-agents/client/routes';
import {
  Bot,
  BrainCircuit,
  ChartColumn,
  Server,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

function settingsPage(
  route: AppClientRoutePageDefinition,
  title: string,
  icon: LucideIcon,
) {
  return {
    ...route,
    parent: 'settingsAi',
    navigation: { title, icon },
    breadcrumb: { title },
  };
}

export default defineSettingsRoutes([
  settingsPage(agentsRoute, 'onlineAgent.agents', Bot),
  settingsPage(runtimesRoute, 'onlineAgent.runtimes', Server),
  settingsPage(skillsRoute, 'onlineAgent.skills', Sparkles),
  settingsPage(modelsRoute, 'onlineAgent.models', BrainCircuit),
  settingsPage(
    {
      name: 'agentChatSettings',
      path: '/agent-chat',
      auth: 'required',
      authz: {
        resource: { type: 'settings', id: 'agents.agents' },
        action: 'manage',
      },
      componentLoader: () => import('./team-agent.js'),
    },
    'onlineAgent.teamDefault',
    Bot,
  ),
  settingsPage(usageRoute, 'onlineAgent.usage', ChartColumn),
]);
