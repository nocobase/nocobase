/** Every key the agent chat looks up, so each locale is checked against the same list. */
export interface AgentChatLocale {
  readonly chat: {
    readonly title: string;
    readonly ask: string;
    readonly close: string;
    readonly expand: string;
    readonly restoreSize: string;
    readonly openPage: string;
    readonly openInPanel: string;
    readonly more: string;
    readonly newConversation: string;
    readonly untitled: string;
    readonly rename: string;
    readonly renameHint: string;
    readonly archive: string;
    readonly unarchive: string;
    readonly you: string;
    readonly agentGone: string;
    readonly anyAgent: string;
    readonly loadFailed: string;
    readonly notFound: string;
    readonly notFoundDescription: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    readonly noAgent: string;
    readonly chooseAgent: string;
    readonly messages: string;
    readonly olderMessages: string;
    readonly sources: {
      readonly panel: string;
    };
    readonly availability: {
      readonly online: string;
      readonly agentMissing: string;
      readonly agentArchived: string;
      readonly forbidden: string;
      readonly noRunner: string;
      readonly modelUnavailable: string;
    };
    readonly mode: {
      readonly online: string;
      readonly runner: string;
      readonly onlineHint: string;
      readonly runnerHint: string;
    };
    readonly reply: {
      readonly writing: string;
      readonly interrupted: string;
    };
    readonly offline: {
      readonly agentMissing: string;
      readonly agentArchived: string;
      readonly forbidden: string;
      readonly noRunner: string;
      readonly modelUnavailable: string;
      readonly kept: string;
      readonly fallback: string;
      readonly usingDefault: string;
      readonly restore: string;
    };
    readonly notice: {
      readonly switchedToDefault: string;
      readonly switchedBack: string;
      readonly runFailed: string;
      readonly runFailedReason: string;
      readonly runCancelled: string;
    };
    readonly consultation: {
      readonly title: string;
      readonly question: string;
      readonly answer: string;
      readonly steps: string;
      readonly plans_one: string;
      readonly plans_other: string;
      readonly usage: string;
      readonly state: {
        readonly running: string;
        readonly completed: string;
        readonly failed: string;
        readonly refused: string;
      };
    };
    readonly steps: {
      readonly title: string;
      readonly waiting: string;
      readonly starting: string;
      readonly thinking: string;
      readonly reading: string;
      readonly working: string;
      readonly count_one: string;
      readonly count_other: string;
      readonly started: string;
      readonly finished: string;
    };
    readonly pending: {
      readonly sending: string;
      readonly failed: string;
      readonly retry: string;
      readonly discard: string;
    };
    readonly model: {
      readonly label: string;
      readonly current: string;
      readonly default: string;
    };
    readonly composer: {
      readonly label: string;
      readonly placeholder: string;
      readonly hint: string;
      readonly runningHint: string;
      readonly tooLong: string;
      readonly send: string;
      readonly stop: string;
      readonly stopping: string;
    };
    readonly attachments: {
      readonly attach: string;
      readonly label: string;
      readonly sent: string;
      readonly images: string;
      readonly files: string;
      readonly remove: string;
      readonly uploading: string;
      readonly tooLarge: string;
      readonly failed: string;
      readonly tooMany: string;
      readonly blocked: string;
      readonly waiting: string;
      readonly drop: string;
      readonly preview: string;
      readonly download: string;
      readonly previous: string;
      readonly next: string;
    };
    readonly context: {
      readonly label: string;
      readonly sent: string;
      readonly filter: string;
      readonly selection: string;
      readonly remove: string;
    };
    readonly agents: {
      readonly switch: string;
      readonly withStatus: string;
      readonly chooseFor: string;
      readonly startWith: string;
      readonly boundHint: string;
      readonly empty: string;
      readonly none: string;
      readonly field: string;
      readonly unknown: string;
      readonly placeholder: string;
      readonly myDefault: string;
      readonly systemDefault: string;
      readonly personal: string;
      readonly temporary: string;
      readonly onlineGroup: string;
      readonly runnerGroup: string;
      readonly modeHint: string;
    };
    readonly history: {
      readonly title: string;
      readonly search: string;
      readonly show: string;
      readonly active: string;
      readonly archived: string;
      readonly agent: string;
      readonly allAgents: string;
      readonly source: string;
      readonly allSources: string;
      readonly loadFailed: string;
      readonly noMatch: string;
      readonly noArchived: string;
      readonly empty: string;
      readonly more: string;
      readonly unread: string;
      readonly actions: string;
    };
    readonly loading: string;
    readonly retry: string;
    readonly errors: {
      readonly forbidden: string;
      readonly notFound: string;
      readonly requestFailed: string;
    };
    readonly transcript: {
      readonly waiting: string;
      readonly empty: string;
      readonly fetchFailed: string;
      readonly expand: string;
      readonly truncated: string;
      readonly events: string;
      readonly inputDelivered: string;
      readonly tokens: string;
      readonly kinds: {
        readonly text: string;
        readonly thinking: string;
        readonly toolUse: string;
        readonly toolResult: string;
        readonly allowed: string;
        readonly denied: string;
        readonly input: string;
        readonly checkout: string;
        readonly status: string;
        readonly error: string;
        readonly usage: string;
      };
    };
  };
}

const agentChatEnUS: AgentChatLocale = {
  chat: {
    title: 'Agent chat',
    ask: 'Ask agent',
    close: 'Close',
    expand: 'Full width',
    restoreSize: 'Back to side panel',
    openPage: 'Open full screen',
    openInPanel: 'Open in side panel',
    more: 'More',
    newConversation: 'New conversation',
    untitled: 'Untitled conversation',
    rename: 'Rename',
    renameHint: '{{title}} (click to rename)',
    archive: 'Archive',
    unarchive: 'Unarchive',
    you: 'You',
    agentGone: 'Deleted agent',
    anyAgent: 'Agent',
    loadFailed: 'Could not load the conversation',
    notFound: 'This conversation cannot be opened',
    notFoundDescription:
      'It may have been removed, or it belongs to someone else.',
    emptyTitle: 'What can {{name}} do for you?',
    emptyDescription:
      'Ask anything, or describe the work to organize. What this page shows goes along as context.',
    noAgent:
      'There is no agent you may chat with. Ask an administrator to create one or to give you access.',
    chooseAgent:
      'Choose who to chat with below. To start with an agent every time, set your default in your profile.',
    messages: 'Messages',
    olderMessages: 'Earlier messages',
    sources: {
      panel: 'Chat panel',
    },
    availability: {
      online: 'Online',
      agentMissing: 'Deleted',
      agentArchived: 'Archived',
      forbidden: 'Not available to you',
      noRunner: 'No runner online',
      modelUnavailable: 'Model unavailable',
    },
    mode: {
      online: 'Online',
      runner: 'Runner',
      onlineHint: 'Answers in seconds on the server',
      runnerHint: 'A coding agent on a runtime',
    },
    reply: {
      writing: 'Writing…',
      interrupted: 'The reply stopped here.',
    },
    offline: {
      agentMissing: '{{name}} no longer exists',
      agentArchived: '{{name}} is archived',
      forbidden: 'You may no longer use {{name}}',
      noRunner: '{{name}} has no runner online right now',
      modelUnavailable:
        'The model of {{name}} is not available; ask an administrator',
      kept: 'Your messages are kept and answered once it can answer.',
      fallback: 'Use the system default here',
      usingDefault:
        'This conversation uses {{name}}, the system default, for now.',
      restore: 'Switch back to {{own}}',
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
      question: 'Question',
      answer: 'Answer',
      steps: 'Its steps',
      plans_one: 'Proposed a plan for you to confirm.',
      plans_other: 'Proposed {{count}} plans for you to confirm.',
      usage: 'Used {{input}} input and {{output}} output tokens.',
      state: {
        running: 'Answering…',
        completed: 'Answered',
        failed: 'Failed',
        refused: 'Refused',
      },
    },
    steps: {
      title: 'Steps',
      waiting: 'Waiting for a runner to pick this up…',
      starting: 'Starting…',
      thinking: 'Thinking…',
      reading: 'Looking at {{subject}}',
      working: 'Working on {{subject}}',
      count_one: '{{count}} step',
      count_other: '{{count}} steps',
      started: 'The agent is replying.',
      finished: 'The agent finished replying.',
    },
    pending: {
      sending: 'Sending…',
      failed: 'Not sent',
      retry: 'Send again',
      discard: 'Discard',
    },
    model: {
      label: 'Model',
      current: 'Model: {{name}}',
      default: '{{model}} (default)',
    },
    composer: {
      label: 'Message to the agent',
      placeholder: 'Ask, or describe the work to organize…',
      hint: 'Enter to send, Shift+Enter for a new line',
      runningHint: 'Messages you send now join the work in progress',
      tooLong: 'At most {{max}} characters.',
      send: 'Send',
      stop: 'Stop',
      stopping: 'Stopping…',
    },
    attachments: {
      attach: 'Attach files',
      label: 'Files the next message carries',
      sent: 'Files sent with this message',
      images: 'Images',
      files: 'Files',
      remove: 'Remove {{name}}',
      uploading: 'Uploading…',
      tooLarge: 'Larger than {{max}}',
      failed: 'Could not upload',
      tooMany: 'At most {{max}} files per message.',
      blocked: 'Remove the files that could not be uploaded to send.',
      waiting: 'Sending once the files are uploaded…',
      drop: 'Drop files to attach them',
      preview: 'Preview {{name}}',
      download: 'Download {{name}}',
      previous: 'Previous image',
      next: 'Next image',
    },
    context: {
      label: 'Context the next message carries',
      sent: 'Context this message carried',
      filter: 'Filter: {{filter}}',
      selection: 'Selected text: “{{text}}”',
      remove: 'Remove context: {{label}}',
    },
    agents: {
      switch: 'Agent: {{name}}; choose another',
      withStatus: '{{name}}, {{status}}',
      chooseFor: 'Chat with',
      startWith: 'Start a new conversation with',
      boundHint:
        'A conversation stays with its agent; choosing another starts a new conversation.',
      empty: 'No agent you may chat with',
      none: 'No agent',
      field: 'Agent: {{name}}',
      unknown: 'Unknown agent',
      placeholder: 'Choose an agent',
      myDefault: 'My default',
      systemDefault: 'System default',
      personal: 'Only me',
      temporary: 'Temporary',
      onlineGroup: 'Online agents',
      runnerGroup: 'Runner agents',
      modeHint:
        'Online answers on the server in seconds; Runner runs a coding agent on a runtime. A conversation keeps its mode.',
    },
    history: {
      title: 'Conversations',
      search: 'Search conversations',
      show: 'Show',
      active: 'Open',
      archived: 'Archived',
      agent: 'Agent',
      allAgents: 'All agents',
      source: 'Started from',
      allSources: 'Anywhere',
      loadFailed: 'Could not load conversations',
      noMatch: 'No conversation matches',
      noArchived: 'No archived conversations',
      empty: 'No conversations yet',
      more: 'Load more',
      unread: 'New reply',
      actions: 'Actions for {{title}}',
    },
    loading: 'Loading',
    retry: 'Retry',
    errors: {
      forbidden: 'You are not allowed to do this.',
      notFound: 'It no longer exists.',
      requestFailed: 'The request failed. Try again.',
    },
    transcript: {
      waiting: 'Waiting for the agent to start…',
      empty: 'This run recorded no events.',
      fetchFailed: 'Unable to fetch new events. Retrying…',
      expand: 'Show all',
      truncated: 'Cut short: the full text was too long to keep.',
      events: 'Run transcript',
      inputDelivered: '{{count}} input(s) delivered to the agent',
      tokens: '{{input}} tokens in, {{output}} out',
      kinds: {
        text: 'Agent',
        thinking: 'Thinking',
        toolUse: 'Tool',
        toolResult: 'Result',
        allowed: 'Allowed',
        denied: 'Denied',
        input: 'Input',
        checkout: 'Checkout',
        status: 'Status',
        error: 'Error',
        usage: 'Usage',
      },
    },
  },
};

export default agentChatEnUS;
