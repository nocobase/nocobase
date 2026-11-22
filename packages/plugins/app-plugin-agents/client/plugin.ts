/**
 * The plugin's client registration, `agents()` in an application's `client/plugins.ts`. Registered with no options, it
 * brings everything: the ✦ button in the header (`agent`, its badge the conversations waiting for the viewer), the
 * panel beside the content, the conversation page (`/chat/:conversationId`, route `agentChat`), the five System
 * settings pages under AI (Agent, Model services, Runtimes, Skills, Usage) and Personal settings › Preferences › Agent.
 *
 * Customizing, from least to most:
 *
 * 1. Options: `agents({ headerAction: false, panel: { width: 480, defaultOpen: true }, chatPath: '/assistant' })`.
 * 2. Extension points: `agents.toolRenderers`, `agents.slots`, `agents.preferenceSections` (`ui-registry.ts`), and
 *    `useAgentContext` / `AskAgentButton` on the application's pages.
 * 3. Replacing a part of the panel with `agents.components.replace(name, Component)`, a whole page with the
 *    application's `routeComponentOverrides` (`@nocobase/app-plugin-agents:agentChat`, `:agents`, `:models`,
 *    `:runtimes`, `:skills`, `:usage`, `:agentPreferences`), or the ✦ button with `headerActionOverrides` (`agent`).
 * 4. Copying the UI Library's `agent-chat` block into the application, with `agents({ headerAction: false, panel:
 *    false })` and only the plugin's hooks (`client/chat`).
 */
import {
  defineAppRoutes,
  defineClientPlugin,
  definePersonalSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  type AppClientPluginFactory,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { Bot } from 'lucide-react';

import { AgentHeaderButton } from './launchers/agent-header-button.js';
import locales from './locales/index.js';
import { agentsSettingsRoutes } from './routes.js';
import { useAgentAttention } from './shell/attention.js';
import { agentsLayoutExtension } from './shell/layout.js';
import {
  resolveAgentsOptions,
  type AgentsClientOptions,
} from './shell/options.js';
import { agentsUi, type AgentsUi } from './ui-registry.js';

export type { AgentsClientOptions } from './shell/options.js';

/** `/chat/:conversationId`: one conversation as a page; the API checks the owner (or a share) on every read. */
function chatRoute(chatPath: string): AppClientRoutePageDefinition {
  return {
    name: 'agentChat',
    path: `${chatPath}/:conversationId`,
    auth: 'required',
    authz: 'skip',
    componentLoader: async () => {
      const [{ default: Page }, { withAgents }] = await Promise.all([
        import('./pages/chat/index.js'),
        import('./query.js'),
      ]);
      return { default: withAgents(Page) };
    },
  };
}

/** Personal settings › Preferences › Agent: open to every signed-in person, about themselves. */
const preferencesRoutes = definePersonalSettingsRoutes([
  {
    name: 'agentPreferences',
    path: '/agent',
    parent: PERSONAL_SETTINGS_CATEGORIES.preferences,
    navigation: { title: 'me.navigation', icon: Bot },
    breadcrumb: { title: 'me.navigation' },
    componentLoader: async () => {
      const [{ default: Page }, { withAgents }] = await Promise.all([
        import('./pages/me/index.js'),
        import('./query.js'),
      ]);
      return { default: withAgents(Page) };
    },
  },
]);

const factory = defineClientPlugin<AgentsClientOptions>({
  packageName: '@nocobase/app-plugin-agents',
  locales,
  routes: (options) => [
    agentsSettingsRoutes,
    preferencesRoutes,
    defineAppRoutes([
      {
        name: 'agentConversations',
        path: resolveAgentsOptions(options).chatPath,
        auth: 'required',
        authz: 'skip',
        breadcrumb: { title: 'myConversations' },
        componentLoader: async () => {
          const [{ default: Page }, { withAgents }] = await Promise.all([
            import('./pages/chat/sessions.js'),
            import('./query.js'),
          ]);
          return { default: withAgents(Page) };
        },
      },
      chatRoute(resolveAgentsOptions(options).chatPath),
    ]),
  ],
  headerActions: (options) =>
    resolveAgentsOptions(options).headerAction
      ? [
          {
            name: 'agent',
            order: 900,
            component: AgentHeaderButton,
            badge: useAgentAttention,
          },
        ]
      : [],
  layoutExtensions: (options) => [
    agentsLayoutExtension(resolveAgentsOptions(options)),
  ],
});

/**
 * `agents(options)` registers the plugin; `agents.toolRenderers`, `agents.slots`, `agents.components` and
 * `agents.preferenceSections` add to or replace parts of its panel and pages.
 */
const agents: AppClientPluginFactory<AgentsClientOptions> & AgentsUi =
  Object.assign(factory, agentsUi);

export default agents;
