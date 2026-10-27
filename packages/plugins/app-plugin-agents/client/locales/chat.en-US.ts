/**
 * The chat's wording this plugin uses itself: its hooks' notices (rename, archive, a failed send, switching agents),
 * the texts `noticeText` and `stepLineText` look up, the agents' availability and the profile's "Agent" section. The
 * chat UI's own wording ships with the UI Library's agent-chat block.
 */
const chatEnUS = {
  chat: {
    executionFailed:
      'Execution failed. Review the saved conversation before retrying.',
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
    fileInputFailures: {
      imageCapability:
        'Image input is not configured for this model. Switch to a model with verified image support.',
      unsupportedFormat:
        'Input for this attachment format is not configured for the selected model, and no local text extractor supports it. Use a supported document format or a model with verified file support.',
      formatMismatch:
        'The attachment filename and media type describe different document formats. Check the file format and upload it again.',
      invalidInline:
        'The attached file data is invalid or too large. Upload the file again or use a smaller file.',
      fileTooLarge:
        'An attachment exceeds its byte budget. Use a smaller file.',
      inputTooLarge:
        'The conversation attachments exceed the input byte budget. Use smaller files or start a new conversation.',
      documentTooLarge:
        'The attachment exceeds its extracted text budget. Use a smaller file.',
      contextTooLarge:
        'The conversation attachments exceed the extracted text budget. Use smaller files or start a new conversation.',
      fileCount:
        'The conversation exceeds the 100 file input limit. Start a new conversation.',
      nativeFileCount:
        'The conversation exceeds the configured native file limit. Use fewer attachments or convert them to a supported text document.',
      unreadable:
        'The attachment contains no readable text. Scanned documents require OCR.',
      extractionFailed:
        'The attachment text could not be extracted. Check that the document is readable and upload it again.',
      extractionTimeout:
        'Attachment text extraction timed out. Use a smaller file or try again.',
      preparationFailed:
        'The attachment could not be prepared. Check your access and the file format, then try again.',
    },
    notice: {
      switchedToDefault:
        'Switched to {{name}}, the system default, until {{own}} is back.',
      switchedToOnline:
        '{{own}} has no runner for you now, so {{name}} answers until {{own}} is back.',
      onlineFallbackUnavailable:
        'The online fallback agent cannot answer ({{reason}}). This conversation stays with {{own}} while it waits for a runner.',
      switchedAgent: 'Switched to {{name}} with this conversation’s history.',
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
