import agentChat from '#extensions/nocobase-agent-chat/locales/en-US';
import fileUi from '../extensions/nocobase-file-component-ui/locales/en-US.js';
import type { LocaleResource } from '@nocobase/i18n';

import systemEnUS from './system/en-US.js';

const enUS = {
  // The template's own copy: the shell, the sign-in pages, shared components and the homepage. Keep it in
  // `./system/` so a template upgrade can replace it without touching the application's copy below.
  ...systemEnUS,
  ...fileUi,
  ...agentChat,
  onlineAgent: {
    preferenceFailed: 'Could not save your runner preference.',
    runner: {
      title: 'Preferred runtime',
      auto: 'Automatic',
      personal: 'Personal runtimes first',
      team: 'Shared runtimes first',
    },
    teamDefault: 'Team default agent',
    teamDescription:
      'Used for new conversations when a person has no default agent.',
    noDefault: 'No default',
    personal: 'Agent preferences',
    retry: 'Retry loading agents',
    saveFailed: 'Could not save the default agent.',

    usage: 'Usage and pricing',
    group: 'Agents',
    agents: 'Agents',
    runtimes: 'Runtimes',
    skills: 'Skills',
    newSkill: 'New skill',
    skillDetail: 'Skill details',
    connectRuntime: 'Connect runtime',
    models: 'Models',
    openModels: 'Open models',
    checkingModels: 'Checking chat models…',
    catalogFailed: 'Could not load chat models.',
    noModels: {
      title: 'No chat model configured',
      description:
        'Add a model service and enable a chat model to start chatting.',
      readOnly: 'Ask an administrator to configure a chat model.',
    },
  },
  // The application's copy goes here, one group per feature. A shared group such as `navigation` is extended by
  // spreading the system one first, `navigation: { ...systemEnUS.navigation, orders: 'Orders' }`, since a group
  // written here replaces the system group of the same name rather than merging with it.
};

/**
 * The shape every locale of this application follows, derived from the English wording above.
 *
 * Anything a plugin does not translate falls back to this namespace, so a term defined here is reused everywhere
 * without each plugin repeating it.
 */
export type AppResource = LocaleResource<typeof enUS>;

export default enUS;
