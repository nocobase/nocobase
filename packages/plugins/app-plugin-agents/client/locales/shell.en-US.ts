/**
 * The wording of what the plugin brings to an application on its own: who may chat with an agent and the team's
 * default Agent on the Agent page, and Personal settings › Preferences › Agent. Merged into `agents` and added as `me`;
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
      hint: 'Members outside these roles do not see this agent in the chat panel and cannot start a conversation with it. Managers of agents always can.',
      required: 'Choose at least one role.',
    },
    teamDefault: {
      label: 'Team default Agent',
      none: 'None',
      hint: 'New conversations go to it unless a person chose a default of their own. Only an enabled agent all members may chat with can be the team default.',
      saved: 'Team default Agent saved',
    },
  },
  me: {
    navigation: 'Agent',
    title: 'Agent',
    description:
      'Your own Agent settings: where your new conversations go, the runtimes you added and what your runs used.',
    defaultAgent: { title: 'My default Agent' },
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
