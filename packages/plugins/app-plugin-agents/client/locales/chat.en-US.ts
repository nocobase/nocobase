/**
 * The chat's wording this plugin uses itself: its hooks' notices (rename, archive, a failed send, switching agents),
 * the texts `noticeText` and `stepLineText` look up, the agents' availability and the profile's "Agent" section. The
 * chat UI's own wording ships with the UI Library's agent-chat block.
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
      agentArchived: 'Not enabled',
      forbidden: 'Not available to you',
      noModel: 'Configure a chat model first',
      noRunner: 'No runner online, cannot be chosen',
      othersPersonal: "Only others' personal runners have it",
      // The reason earlier versions wrote on a notice that their online fallback could not answer.
      modelUnavailable: 'Model unavailable',
    },
    offline: {
      fallbackDone: 'This conversation now uses another agent',
      restoreDone: 'Switched back',
      newSession: 'The agent starts a new session and reads this conversation.',
    },
    notice: {
      switchedToDefault:
        'Switched to {{name}}, the system default, until {{own}} is back.',
      switchedToOnline:
        '{{own}} has no runner for you now, so {{name}} answers until {{own}} is back.',
      onlineFallbackUnavailable:
        'The online fallback agent cannot answer ({{reason}}). This conversation stays with {{own}} while it waits for a runner.',
      switchedBack: 'Back with {{name}}.',
      runFailed: 'The agent stopped before answering.',
      runFailedReason: 'The agent stopped before answering: {{reason}}',
      runCancelled: 'Cancellation requested.',
    },
    consultation: {
      unavailableTitle: 'Consulted agent unavailable',
      snapshotTitle: 'Requested {{name}} at the time',
      title: 'Consulted {{name}}',
    },
    steps: {
      thinking: 'Thinking…',
      reading: 'Looking at {{subject}}',
      working: 'Working on {{subject}}',
    },
    agents: {
      personalOnly: 'Personal runners only',
      hint: 'Lists the enabled agents and says why one cannot answer you now. Answers run on a runner: the first reply waits for one to take it, usually a few seconds.',
      chooseFor: 'Choose an agent',
      empty: 'No agent you may choose',
      none: 'No agent',
      unknown: 'Unknown agent',
      placeholder: 'Choose an agent',
      myDefault: 'My default',
      systemDefault: 'System default',
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
};

export type ChatLocale = typeof chatEnUS;

export default chatEnUS;
