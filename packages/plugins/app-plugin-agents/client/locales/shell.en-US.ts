/**
 * The wording of what the plugin brings to an application on its own: who may chat with an agent and the team's
 * default Agent on the Agent page, the Usage page's tabs, and Personal settings › Preferences › Agent. Merged into
 * `agents` and `usage` and added as `me`;
 * the other languages fall back to English for these keys until they are translated.
 */
const shellEnUS = {
  agents: {
    filters: { disabled: 'Disabled', enabledOnly: 'Enabled' },
    columns: { chatRoles: 'Who can chat' },
    chatRoles: {
      label: 'Who can chat',
      everyone: 'All members',
      roles: 'Specific roles',
      placeholder: 'Choose roles',
      hint: 'Members outside these roles do not see this agent in the chat panel and cannot start a conversation with it. Managing agents does not change who can chat; only root reaches every agent.',
      required: 'Choose at least one role.',
    },
    detail: {
      view: 'View',
      viewFor: 'View {{name}}',
      readOnly: 'You can view this agent. Only managers of agents change it.',
      tabs: {
        settings: 'Settings',
        actions: 'Business actions',
        skills: 'Default skills',
        runs: 'Runs',
      },
      actionsHint:
        'What the application lets this agent do in business data. It acts only where the person who woke it may act too.',
      actionsNone: 'This agent has no business actions.',
      optionalActions: 'Optional actions',
      optionalActionsHint:
        'Off for every agent until you turn them on for this one. It still acts only where the person who woke it may act too.',
      optionalActionsFailed: 'Could not change the optional actions.',
      skillsHint:
        'The team default skills every run of every agent gets. Change them on the Skills page.',
      skillsNone: 'No team default skills yet.',
      skillsUnavailable: 'You need permission to view skills to see them.',
    },
    teamDefault: {
      label: 'Team default Agent',
      none: 'None',
      hint: 'New conversations go to it unless a person chose a default of their own. Only an enabled agent all members may chat with can be the team default.',
      saved: 'Team default Agent saved',
    },
  },
  usage: { tabs: { usage: 'Usage', prices: 'Prices' } },
  me: {
    navigation: 'Agent',
    title: 'Agent',
    description:
      'Your own Agent settings: where your new conversations go, the runtimes you added and what your runs used.',
    defaultAgent: { title: 'My default Agent' },
    effort: {
      title: 'Reasoning effort',
      description:
        'How hard the agent thinks in the conversations you start, unless you choose otherwise in the conversation. An agent whose coding tool does not offer it uses its own default.',
      label: 'My reasoning effort',
      default: "Each agent's default",
      saved: 'Reasoning effort saved',
    },
    runtimes: {
      title: 'Runtimes I added',
      description:
        'Personal runtimes run only your own work. Add one from the Runtimes page in System settings, or ask an administrator.',
      none: 'You have not added a runtime.',
      loadFailed: 'Could not load your runtimes',
      status: { online: 'Online', offline: 'Offline', revoked: 'Revoked' },
    },
    usage: {
      title: 'My usage',
      description: 'What your runs used over the last 30 days.',
      runs: 'Runs',
      tokens: 'Tokens',
      cost: 'Estimated cost',
      loadFailed: 'Could not load your usage',
    },
  },
};

export default shellEnUS;
