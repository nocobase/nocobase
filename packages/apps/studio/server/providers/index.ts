import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import StudioAccessProvider from '../access/provider.js';
import StudioAgentSessionsProvider from '../agent-sessions/provider.js';
import StudioAgentsProvider from '../agents/provider.js';
import StudioCiProvider from '../builds/ci-provider.js';
import StudioCliProvider from '../cli/provider.js';
import StudioDemoProvider from '../demo/provider.js';
import StudioGitProvider from '../git/provider.js';
import StudioInboxProvider from '../inbox/provider.js';
import StudioKnowledgeProvider from '../knowledge/provider.js';
import StudioPreviewsProvider from '../previews/provider.js';
import StudioProjectInitsProvider from '../projects-init/provider.js';
import StudioReleasesProvider from '../releases/provider.js';

// Each boots after every plugin's provider has booted: `StudioAgentsProvider` joins the agents and projects plugins
// then, before any request is served (see its header).
const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  // Registers the status event `studio.merged`: an issue whose pull requests are all merged is done.
  StudioGitProvider,
  StudioPreviewsProvider,
  StudioAgentsProvider,
  // New projects and their initialization: follows Studio's git's repository events and the agents' runs.
  StudioProjectInitsProvider,
  StudioAccessProvider,
  StudioInboxProvider,
  // Release management on Studio's roles, inbox and repositories.
  StudioReleasesProvider,
  // Repositories' CI set up by Studio: their keys, workflows and the daily key rotation.
  StudioCiProvider,
  // The knowledge base: its commands, brief sections and mount for the agents, its inbox cards.
  StudioKnowledgeProvider,
  // Agent sessions on people's own computers: the issues their agents create, and Studio's tools for those agents.
  StudioAgentSessionsProvider,
  // What Studio's command line leaves off.
  StudioCliProvider,
  // Registers the demo data as the application's sample data, which the framework builds once everything is ready.
  StudioDemoProvider,
];

export default serviceProviders;
