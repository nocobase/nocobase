/**
 * The chat's wording this plugin uses itself: its hooks' notices (rename, archive, a failed send, switching agents),
 * the texts `noticeText` and `stepLineText` look up, the agents' availability, the system default chat agent setting,
 * the profile's "Agent" section and the new-agent presets. The chat UI's own wording ships with the UI Library's
 * agent-chat block.
 */
const chatEnUS = {
  chat: {
    untitled: 'Untitled conversation',
    renamed: 'Renamed',
    archivedNamed: 'Archived “{{title}}”',
    unarchived: 'Conversation restored',
    undo: 'Undo',
    sendFailed: 'The message was not sent. Try again.',
    availability: {
      online: 'Online',
      agentMissing: 'Deleted',
      agentArchived: 'Archived',
      forbidden: 'Not available to you',
      noRunner: 'No runner online',
      modelUnavailable: 'Model unavailable',
    },
    offline: {
      fallbackDone: 'This conversation now uses the system default',
      restoreDone: 'Switched back',
      newSession: 'The agent starts a new session and reads this conversation.',
    },
    notice: {
      switchedToDefault:
        'Switched to {{name}}, the system default, until {{own}} is back.',
      switchedBack: 'Back with {{name}}.',
      runFailed: 'The agent stopped before answering.',
      runFailedReason: 'The agent stopped before answering: {{reason}}',
      runCancelled: 'Stopped.',
    },
    consultation: {
      title: 'Consulted {{name}}',
    },
    steps: {
      thinking: 'Thinking…',
      reading: 'Looking at {{subject}}',
      working: 'Working on {{subject}}',
    },
    agents: {
      personal: 'Only me',
      chooseFor: 'Choose an agent',
      empty: 'No agent you may choose',
      none: 'No agent',
      unknown: 'Unknown agent',
      placeholder: 'Choose an agent',
      myDefault: 'My default',
      systemDefault: 'System default',
      onlineGroup: 'Online agents',
      runnerGroup: 'Runner agents',
      online: 'Online',
      runner: 'Runner',
      onlineHint: 'Answers in seconds on the server',
      runnerHint: 'A coding agent on a runtime',
    },
    settings: {
      title: 'System default chat agent',
      description:
        'New conversations go to this agent when a person has no default of their own; a conversation may also switch to it while its agent is offline.',
      none: 'None',
      unknown: 'An agent you cannot see',
      saved: 'System default chat agent saved',
    },
  },
  chatProfile: {
    loadFailed: 'Could not load your agent settings',
    defaultAgent: 'My default chat agent',
    systemDefault: 'System default',
    systemDefaultNamed: 'System default ({{name}})',
    noDefault: 'No system default is set.',
    saved: 'Default chat agent saved',
  },
  agentPresets: {
    label: 'Start from',
    blank: 'Blank agent',
    hint: 'A preset fills in the description, instructions and business actions; you can change all of them.',
  },
};

export type ChatLocale = typeof chatEnUS;

export default chatEnUS;
