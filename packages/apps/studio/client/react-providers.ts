import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import { Toaster } from '@/components/ui/toast';

import { AgentWorkflowRules } from './agents/workflow-rules.js';
import { AgentIntakeWaitFormat } from './agents/intake-wait-format.js';
import { ReleaseActorNames } from './releases/actor-names.js';
import { ReleaseDeleteAppImpact } from './releases/delete-app-impact.js';
import { ReleaseAppOrigin } from './releases/app-origin.js';
import { ReleasePeoplePicker } from './releases/people-picker.js';
import { ReleaseSystemLabels } from './releases/system-labels.js';
import { StudioGitContributions } from './git/provider.js';
import { AppThemeProvider } from './theme/theme-provider.js';

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([
    {
      component: AppThemeProvider,
      layer: 'root',
      name: 'theme',
    },
    // The one toast host. It renders what plugins and pages report through
    // `useToaster()`, which `client/service-provider.ts` connects to it.
    // Pages must not mount another.
    {
      component: Toaster,
      layer: 'application',
      name: 'toaster',
    },
    // Release management's operators and requesters by name, from the projects plugin's members.
    {
      component: ReleaseActorNames,
      layer: 'application',
      name: 'release-actor-names',
    },
    // Release management's environment approvers, picked from the projects plugin's members.
    {
      component: ReleasePeoplePicker,
      layer: 'application',
      name: 'release-people-picker',
    },
    // The repositories that build an App, on its Overview in release management.
    {
      component: ReleaseAppOrigin,
      layer: 'application',
      name: 'release-app-origin',
    },
    // What deleting an App stops, in release management's Delete App confirmation.
    {
      component: ReleaseDeleteAppImpact,
      layer: 'application',
      name: 'release-delete-app-impact',
    },
    // The labels Studio adds to preview Apps, read-only with why they are there in release management's pages.
    {
      component: ReleaseSystemLabels,
      layer: 'application',
      name: 'release-system-labels',
    },
    // The agents plugin's status rules (run an agent, suggest an executor) in the projects plugin's workflow editor.
    {
      component: AgentWorkflowRules,
      layer: 'application',
      name: 'agent-workflow-rules',
    },
    {
      component: AgentIntakeWaitFormat,
      layer: 'application',
      name: 'agent-intake-wait-format',
    },
    // Studio's pull requests, added to the slots above: the `studio.merged` event and `prMerged` condition in the
    // workflow editor.
    {
      component: StudioGitContributions,
      layer: 'application',
      // Inside the agents' providers (listed first, so outer), whose rules it adds to.
      name: 'studio-git',
    },
  ]);

export default reactProviders;
