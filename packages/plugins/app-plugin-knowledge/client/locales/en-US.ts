import type { LocaleResource } from '@nocobase/i18n';

// The wording of the knowledge base's page and components, in the plugin's namespace (`ACCESS_NAMESPACE`).
const enUS = {
  indexing: {
    failedDocumentCount: 'Failed documents: {{count}}',
    enabled: 'Enable indexing',
    enabledHint:
      'Turn off to use text search only. Changes take effect after saving.',
    chooseInstance: 'Select an indexing instance',
    documentProgress: 'Document progress',
    pendingDocuments: 'Pending documents',
    failedDocuments: 'Failed documents',
    preparedChunks: 'Chunks prepared',
    committedChunks: 'Chunks committed',
    agentPrompt:
      'Help me configure knowledge base indexing in this NocoBase 3 application.\n\nRead the application’s AGENTS.md and check the indexing types (type) actually available here. Knowledge currently offers two vector database options: SQLite with sqlite-vec (type sqlite-vec, a local file) and PostgreSQL with pgvector (type pgvector, requiring the vector extension). Explain the available options and their requirements for this deployment. Let me choose before continuing; do not decide for me.\n\nAfter I choose, ask for the necessary information: the index file location for SQLite, or database connection details and whether the vector extension is ready for PostgreSQL. Do not show passwords or API keys.\n\nShow the proposed configuration and get my confirmation before writing it under knowledge.indexing in the application’s config.yaml. Preserve other settings. If the application uses config.yml, edit that existing file instead of creating another one.\n\nValidate the configuration safely and explain how to restart the application. Get my confirmation before restarting or installing dependencies. Then guide me back to index settings to enable indexing, select the instance and an embedding model, and save. Ask for confirmation before calling paid models or rebuilding indexes.',
    databases: {
      sqlite: {
        name: 'SQLite vector database',
        description:
          'Uses the sqlite-vec vector extension to keep the index in a local SQLite file on the application server. No separate database service is needed; suitable for single-host deployments.',
      },
      pgvector: {
        name: 'PostgreSQL vector database',
        description:
          'Uses the pgvector vector extension to store and search vectors in PostgreSQL. Prepare a database connection and enable the vector extension. Suitable for an existing PostgreSQL service or multiple application servers sharing an index.',
      },
    },
    setupTitle: 'Configuration steps',
    setup: {
      instance:
        'Open the application’s config.yaml and add an instance under knowledge.indexing, including its name, type and local file path or database connection details.',
      restart:
        'Save the file and restart the application to load the configuration.',
      enable:
        'Reopen index settings, enable indexing, select the new instance and an embedding model, then save.',
    },
    agentHandoff:
      'If you are unfamiliar with configuration files, copy the prompt below and ask a development Agent to help.',
    global: 'All knowledge spaces',
    back: 'Back to knowledge',
    configuration: 'Index configuration',
    typeHint:
      'Instances are grouped by type. Each type owns its form; not every index needs an Embedding model.',
    typeForm: 'Configuration form provided by this type',
    openPage: 'Open standalone settings',
    emptyTitle: 'Configure a vector database first',
    emptyDescription:
      'Knowledge indexing needs a vector database to store and retrieve document vectors. Choose one of the following options and add it to the application’s config.yaml:',
    agentTitle: 'Configuration prompt',
    copyPrompt: 'Copy configuration prompt',
    promptCopied: 'Configuration prompt copied. Nothing has been executed.',
    promptCopyFallback:
      'Automatic copying is unavailable. The prompt is selected; copy it manually.',
    promptLabel: 'Configuration prompt for your development Agent',
    rebuildHint: 'Changes require index rebuilding',
    editHint: 'Edit configuration to save',
    confirmRetryEmbedding:
      'Retry only failed documents in every knowledge space. Embedding calls may incur charges; completed work is not rebuilt.',
    confirmRetry:
      'Retry only failed documents in every knowledge space. Completed work is not rebuilt; index service resources will be used.',
    confirmResources:
      'This affects every knowledge space and rebuilds its index. This type does not require Embedding calls, but consumes index storage and service resources. The published index remains available until its replacement is ready.',
    deploymentPg:
      'Connection, Schema and table prefix are managed in deployment configuration, not this form.',
    deploymentFile:
      'The index file path is managed in deployment configuration, not this form.',
    errors: {
      configurationChanged:
        'Index/model settings have changed. The old generation cannot be retried under the new settings. Review the settings and rebuild all spaces if needed (Embedding costs may apply).',
      modelAuth:
        'Embedding authentication failed. Check the model service API key, access permissions and endpoint region.',
      modelQuota:
        'Embedding quota or credit is exhausted. Check the model account before retrying.',
      modelRateLimit:
        'The Embedding service is rate-limiting requests. Wait before retrying.',
      modelConfig:
        'The saved Embedding model is unavailable, changed or unsupported. Review the model service and model selection.',
      modelInput:
        'The Embedding input is too long. Review the document chunk sizes.',
      modelPolicy:
        'The Embedding service rejected the input under its content policy. Review the affected content.',
      modelResponse:
        'The Embedding service returned invalid vectors. Check model compatibility and vector dimensions.',
      modelUnavailable:
        'The Embedding service could not be reached or is temporarily unavailable. Check its endpoint and network.',
      storageAuth:
        'Index storage authentication failed. Check the database user, password and connection settings.',
      storagePermission:
        'Index storage denied the operation or is read-only. Check schema and table permissions.',
      storageSchema:
        'The index database, schema or required table is unavailable. Check the deployment and schema.',
      storageUnavailable:
        'Index storage could not be reached or the connection was interrupted. Check the address, port and network.',
      storageBusy:
        'Index storage is busy or encountered a transaction conflict. Wait for the host retry policy.',
      timeout:
        'An indexing operation timed out. Check storage and model service availability before retrying.',
      vectorExtension:
        'PostgreSQL is missing the vector extension. Ask the database administrator to install it.',
      ownership:
        'The index target ownership or structure does not match. Verify the instance resource; do not delete unrelated tables.',
      dependencies:
        'An indexing instance, extension or host jobs configuration is unavailable. Check deployment configuration and restart if needed.',
    },
    invalidValue: 'Check this value.',
    title: 'Knowledge index settings',
    description: 'Configure search indexing for all knowledge spaces.',
    progress: 'Indexing progress',
    instance: 'Indexing instance',
    off: 'Off — use text search only',
    missingForm:
      'This instance’s configuration form is unavailable. Saved options are preserved.',
    statusFailed: 'Unable to refresh indexing status.',
    loadFailed:
      'Unable to load index settings. Check your access and try again.',
    saveFailed: 'The request was not accepted. Your draft was retained.',
    conflict:
      'Index settings changed elsewhere. Reload the latest revision without discarding your draft, then review and save again.',
    saved: 'Request accepted. Indexing continues in the background.',
    workFailed:
      'Some indexing work failed. Review the instance and model service, then retry.',
    rebuild: 'Rebuild all spaces',
    retry: 'Retry failed work',
    confirmTitle: 'Confirm global index change',
    confirmRebuild:
      'This affects every knowledge space and may re-embed all documents, incur model charges, and require additional storage. The current index remains available until its replacement is ready.',
    confirmDisable:
      'This disables index retrieval for every knowledge space. Text search remains available. Cleanup runs in the background.',
    discardTitle: 'Discard unsaved changes?',
    discardDescription: 'Your unsaved index settings will be lost.',
    discard: 'Discard changes',
    confirm: 'Confirm',
    documents:
      'Documents: {{done}} / {{total}} · Pending: {{pending}} · Failed: {{failed}}',
    chunks: 'Chunks prepared: {{prepared}} · Committed: {{committed}}',
    availability: {
      disabled: 'Disabled — text search only',
      unavailable: 'Index unavailable — text search remains available',
      building: 'Building index',
      ready: 'Index ready',
      degraded: 'Index degraded — text search remains available',
    },
    table: 'Table name',
    modelService: 'Model service',
    model: 'Embedding model',
    chooseService: 'Choose a model service',
    chooseModel: 'Choose or enter a model name',
    loadingModels: 'Loading embedding models…',
    modelsUnavailable:
      'Embedding models are unavailable. Check the model service and try again.',
  },
  // What the plugin registers with the authorization plugin (`server/providers/authorization.ts`).
  access: {
    businessSection: 'Knowledge',
    businesses: {
      knowledge: {
        title: 'Knowledge',
        description: 'The documents of each knowledge space.',
        actions: {
          read: {
            title: 'Read knowledge',
            description:
              'Read the system knowledge and that of the spaces related to them',
            related: 'Read knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Read knowledge (all)',
          },
          propose: {
            title: 'Propose knowledge',
            description:
              'Propose a change for someone who may edit to decide; what agents may be given',
            related: 'Propose knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Propose knowledge (all)',
          },
          edit: {
            title: 'Edit knowledge',
            description:
              'Edit, archive and mark verified, and decide proposals; system knowledge needs all',
            related: 'Edit knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Edit knowledge (all)',
          },
          manage: {
            title: 'Manage knowledge access',
            description:
              'Change who may access each folder and article, and keep access to all of it; system knowledge needs all',
            related: 'Manage knowledge access (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Manage knowledge access (all)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: 'Knowledge',
      system: 'System knowledge',
      count_one: '{{count}} document',
      count_other: '{{count}} documents',
      archivedCount_one: '{{count}} archived document',
      archivedCount_other: '{{count}} archived documents',
      selectTarget: 'Open {{title}}',
      target: 'Create in {{title}}',
      chooseTarget: 'Choose a project or system knowledge to create in',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      retry: 'Retry',
      allProposals: 'All proposals',
      reviewPage: 'Page {{page}} of {{pages}} · {{total}} total',
      previous: 'Previous',
      next: 'Next',
      empty: 'No accessible knowledge spaces',
      emptyAccessHint:
        'Ask an administrator for access to project or system knowledge.',
      noAccess: 'This knowledge is unavailable or you no longer have access.',
      emptyHint:
        'Open this space to create a document, or ask an editor to add one.',
      createFailed:
        'Could not create this entry. Check the target and try again.',
      showResults: 'Show top results for “{{q}}”',
      topResults:
        'Top ranked sections across all projects and system knowledge.',
      welcome:
        'Expand a project or shared system knowledge to browse documents. Select a space to create there, or search across all authorized knowledge.',
    },
    title: 'Knowledge',
    someone: 'Someone',
    loading: 'Loading',
    index: {
      states: { pending: 'Waiting', done: 'Indexed', failed: 'Failed' },
      done: 'Indexed',
      pending: 'Indexing {{indexed}}/{{total}}',
      failed: 'Indexing failed',
      failedHint: 'Some sections failed to embed after every attempt.',
      reason: 'Reason: {{reason}}',
      retry: 'Index again',
      refreshFailed: 'Unable to refresh indexing status',
      retryRefresh: 'Retry refresh',
      queued: 'Queued for indexing again',
    },
    chunks: {
      open: 'View sections',
      title: 'Sections',
      description:
        'The {{count}} sections the current version of "{{title}}" is cut into; search and citations work section by section. Choose one to find it in the document.',
      lead: '(Before the first heading)',
      lines: 'Lines {{start}}–{{end}}',
      chars_one: '{{count}} character',
      chars_other: '{{count}} characters',
      empty: 'This document has no sections yet.',
      showing: 'Highlighting lines {{start}}–{{end}}.',
      clear: 'Clear highlight',
    },
    chunking: {
      title: 'Section settings',
      description:
        'Articles and files (their extracted text) in {{space}} are cut into sections at their headings for search and citations: Word keeps its own headings, each PDF or slide page and each sheet is a level 2 heading, and text without headings is cut by length. This space can be cut differently from the default.',
      own: 'Set for this space',
      defaults:
        'Default: headings down to level {{depth}}, aiming at {{target}} characters, at most {{max}}.',
      depth: 'Cut at headings',
      depths: {
        '1': 'Level 1 only (#)',
        '2': 'Down to level 2 (##)',
        '3': 'Down to level 3 (###)',
      },
      depthHint:
        'Deeper headings stay inside their section. At level 1 only, files are not cut by page or sheet.',
      target: 'Target length (characters)',
      max: 'Limit (characters)',
      sizesHint:
        'A section longer than the limit is cut between paragraphs into pieces near the target; code blocks and tables are never cut.',
      invalid:
        'Lengths are {{min}} to {{max}}, and the target is at most the limit.',
      effect:
        'Saving cuts the documents again in the background, and re-indexes their sections when semantic search is on.',
      rechunking: 'Cutting the documents again in the background…',
      save: 'Save',
      saved: 'Section settings saved',
    },
    loadFailed: 'Unable to load the knowledge',
    kinds: {
      folder: 'Folder',
      article: 'Article',
      file: 'File',
    },
    folder: {
      empty: 'This folder is empty.',
    },
    new: {
      label: 'New',
      article: 'New article',
      folder: 'New folder',
      childArticle: 'New article inside',
      childFolder: 'New folder inside',
    },
    files: {
      upload: 'Upload files',
      uploadHere: 'Upload files here',
      dropHint: 'Drop files here, or on a folder, to upload them.',
      uploaded_one: 'Uploaded {{count}} file; its text is being extracted.',
      uploaded_other:
        'Uploaded {{count}} files; their text is being extracted.',
      download: 'Download',
      version: 'Version {{version}}',
      statusHint: {
        parsing:
          'The text is being extracted; search finds the file once it is ready.',
        ready: 'Its text is extracted, so search and agents read it.',
        failed: 'The text could not be extracted.',
        unsupported:
          'Text is not extracted from files of this type; it is stored as it is.',
      },
      replace: 'Replace',
      replaced: 'Replaced: version {{version}}.',
      reparse: 'Extract again',
      file: 'File',
      propose: 'Propose',
      proposeNew: 'Propose a file',
      proposeNewHint:
        'Someone who may edit this knowledge decides; accepting it adds the file.',
      proposeReplace: 'Propose a replacement',
      proposeReplaceHint:
        'Someone who may edit this knowledge decides; accepting it makes your file the next version of {{title}}.',
      proposeReasonHint: 'Why it belongs here, for whoever decides.',
      proposed: 'Proposed; someone who may edit decides.',
      preview: 'Preview',
      text: 'Extracted text',
      failed: 'The text could not be extracted: {{reason}}',
      status: {
        parsing: 'Extracting text',
        ready: 'Text extracted',
        failed: 'Extraction failed',
        unsupported: 'Stored only',
      },
      noText: {
        parsing: 'The text is being extracted; it appears here once ready.',
        ready: 'The file holds no text.',
        failed: 'The text could not be extracted.',
        unsupported:
          'Text is not extracted from files of this type; the file is stored as it is.',
      },
    },
    spaces: {
      actions: 'Space actions',
      access: 'Space access',
      proposeOnly: 'Propose only',
      inherited: 'Inherited',
      inheritedHint: 'Inherited from another space; read-only here.',
      default: 'Knowledge',
      readOnly: 'Read-only',
      empty: 'No documents yet.',
    },
    tree: {
      actions: 'Actions',
      expand: 'Expand',
      collapse: 'Collapse',
      label: 'Documents',
      newDoc: 'New document',
      archived: 'Show archived',
      archivedBadge: 'Archived',
      pending: '{{count}} waiting',
      back: 'All documents',
      restricted: 'Restricted: only the people listed may access it',
    },
    doc: {
      permissions: 'Permissions',
      restricted: 'Restricted · {{count}}',
      restrictedHint:
        'Only the people listed, and whoever manages the space, may access it.',
      verifiedLabel: 'Verified',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: 'Propose changes',
      more: 'More actions',
      pending_one: '{{count}} pending',
      pending_other: '{{count}} pending',
      updatedAgo: 'Updated {{time}}',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: 'Rename “{{title}}”',
      renamedToast: 'Renamed.',
      notFound: 'This document no longer exists, or you may not see it.',
      notVerified: 'Not verified yet',
      contents: 'Contents',
      edit: 'Edit',
      rename: 'Rename',
      history: 'History',
      verify: 'Mark verified',
      verifiedToast: 'Marked verified.',
      archive: 'Archive',
      archiveTitle: 'Archive “{{title}}”?',
      archiveDescription:
        'It disappears from the tree and from agents. You can restore it later; its versions are kept.',
      archivedToast: 'Archived.',
      restore: 'Restore',
      restoredToast: 'Restored.',
      move: 'Move',
      moveTitle: 'Move “{{title}}”',
      moveTo: 'Under',
      root: 'At the top level',
      movedToast: 'Moved.',
      archivedNotice: 'This document is archived and read-only.',
      oldVersion: 'You are reading version {{version}}.',
      backToCurrent: 'Back to the current version',
      proposals: 'Proposals waiting',
      empty: 'This document is empty.',
    },
    editor: {
      editing: 'Editing',
      proposing: 'Proposing changes',
      properties: 'Properties',
      propertiesHint: 'What agents and links read about this document.',
      nothingToPreview: 'Nothing to preview yet.',
      reasonPlaceholder: 'Why this should change, for whoever decides',
      submitProposal: 'Submit proposal',
      proposed: 'Proposed; someone who may edit decides.',
      title: 'Title',
      slug: 'Slug',
      slugHint:
        'Lower-case letters, digits and hyphens; how agents and links name it. Left empty, it is made from the title.',
      summary: 'Summary',
      summaryHint: 'One line agents read in the index.',
      content: 'Content',
      contentPlaceholder: 'Markdown',
      write: 'Write',
      preview: 'Preview',
      note: 'Change note',
      notePlaceholder: 'What changed, for the history (optional)',
      parent: 'Parent',
      save: 'Save',
      saved: 'Saved as version {{version}}.',
      unchanged: 'Nothing changed.',
      create: 'Create',
      created: 'Document created.',
      cancel: 'Cancel',
      conflict:
        'Someone saved version {{version}} while you were editing. Copy your text, reload, and apply your change again.',
      reload: 'Reload',
    },
    history: {
      by: 'by {{name}}',
      title: 'History',
      current: 'Current',
      fromProposal: 'From a proposal',
      compare: 'Compare',
      with: 'with',
      previous: 'the version before',
      noChanges: 'No differences.',
      view: 'View',
      unchangedLines: '{{count}} unchanged lines',
      approvedBy: 'approved by {{name}}',
    },
    search: {
      description:
        'Search the documents of this space and the spaces it inherits.',
      hint: 'Type to search titles and text.',
      emptyHint: 'Try other words, or fewer of them.',
      all: 'Show all results for “{{q}}”',
      resultsFor: 'Results for “{{q}}”',
      placeholder: 'Search knowledge',
      label: 'Search knowledge',
      empty: 'Nothing found for “{{q}}”.',
      results: 'Results',
      inherited: 'Inherited',
    },
    home: {
      emptyTitle: 'No documents in {{space}} yet',
      emptyEdit: 'Write the first article, or upload files to start.',
      emptyPropose:
        'Propose a file, and someone who may edit decides whether it is added.',
      emptyRead: 'Nothing has been written here yet.',
      count_one: '{{count}} document',
      count_other: '{{count}} documents',
      pending_one: 'Waiting for review ({{count}})',
      pending_other: 'Waiting for review ({{count}})',
      all: 'View all',
      recent: 'Recently updated',
      updated: '{{time}} · {{name}}',
      unindexed: 'Not fully indexed',
      unindexedFailed: '{{failed}} failed · {{pending}} waiting',
      unindexedPending_one: '{{count}} section waiting',
      unindexedPending_other: '{{count}} sections waiting',
      unverified: 'Not verified lately',
      verifiedAgo: 'Verified {{time}}',
    },
    diff: {
      changes_one: '{{count}} change',
      changes_other: '{{count}} changes',
      previous: 'Previous change',
      next: 'Next change',
      layout: 'Diff layout',
      inline: 'Inline',
      split: 'Split',
    },
    access: {
      you: {
        manage: 'You can manage',
        edit: 'You can edit',
        propose: 'You can propose',
        read: 'You can read',
        none: 'No access',
      },
      title: 'Space access',
      description: 'Who may access {{space}}.',
      yours: 'Your access',
      actions: {
        read: 'Read the documents and search them',
        propose: 'Propose changes for someone who may edit to decide',
        edit: 'Edit, organize and verify documents',
        manage: 'Change who may access each folder and article',
      },
      allowed: 'Allowed',
      notAllowed: 'Not allowed',
      matrix: 'By role',
      role: 'Role',
      columns: {
        read: 'Read',
        propose: 'Propose',
        edit: 'Edit',
        manage: 'Manage',
      },
      from: 'Source: {{source}}',
      source: {
        space: 'your access to {{space}}',
        manager: 'you manage {{space}}',
        entry: '{{subject}}, set on “{{title}}”',
      },
      restrictedAt:
        'Restricted at “{{title}}”: only the people listed there may access it.',
      viewOnly: 'Only someone who manages it may change who may access it.',
      mine: '(yours)',
      howTitle: 'How access works here',
      agents:
        'Agents acting for someone read and propose at most; they never edit or decide.',
      manage: 'Change in Roles',
    },
    permissions: {
      title: 'Permissions of “{{title}}”',
      description: {
        folder:
          'Who may read, propose, edit and manage this folder and what it holds.',
        article: 'Who may read, propose, edit and manage this article.',
        file: 'Who may read, propose, edit and manage this file.',
      },
      modeLabel: 'Access',
      modes: {
        inherit: 'Inherit from its parent',
        custom: 'Only the people listed',
      },
      inheritHint:
        'Whoever may access its parent may access it too, and the people added below get at least their level.',
      customHint:
        'Only the people listed below may access it, whatever its parent allows; what is under it follows unless it is restricted itself.',
      inherited: 'Inherited',
      fromSpace: 'Everyone with access to {{space}}, by their roles',
      fromDoc: 'From “{{title}}”',
      fromRestricted:
        'From “{{title}}”, which only the people listed may access',
      added: 'Also has access',
      listed: 'People listed',
      add: 'Add people',
      addPlaceholder: 'Add people, roles…',
      noMatches: 'No matches.',
      noneAdded: 'Nobody beyond what is inherited.',
      noneListed:
        'Nobody listed: only whoever manages the space may access it.',
      managers:
        'Whoever manages the space always keeps access. Agents read and propose at most, and only what both they and their person may.',
      levelOf: 'Level of {{subject}}',
      levels: {
        read: 'Can read',
        propose: 'Can propose',
        edit: 'Can edit',
        manage: 'Can manage',
      },
      remove: 'Remove',
      removedSubject: 'Removed ({{id}})',
      save: 'Save',
      close: 'Close',
      saved: 'Permissions saved.',
      loadFailed: 'Unable to load the permissions.',
    },
    searchTest: {
      title: 'Search test',
      description:
        'Runs a search as you would and shows how each hit was ranked: its relevance, its rank by keywords and by meaning, the rerank score, and where it is in its document.',
      keyword: 'Keywords',
      semantic: 'Meaning',
      relevance: 'Relevance {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: not found',
      lines: 'Lines {{start}}–{{end}}',
      notExplained:
        'Ranking details are shown only to people who manage the space or the search settings.',
      query: 'Words to search for',
      run: 'Search',
      fused: 'Fused {{score}}',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: 'Reranked {{score}}',
      notReranked: 'Not reranked',
    },
    proposals: {
      listTitle: 'Proposals',
      statuses: {
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
      },
      none: {
        pending: 'Nothing is waiting for review.',
        accepted: 'No accepted proposals yet.',
        rejected: 'No rejected proposals.',
      },
      about: 'On “{{title}}”',
      clearAbout: 'Show all proposals',
      onBehalf: '{{proposer}} on behalf of {{person}}',
      overview: 'Overview',
      changes: 'Changes',
      staleTitle: 'The document changed since',
      decision: 'Decision',
      commentLabel: 'Comment',
      pendingEntry: 'Pending review · {{count}}',
      kinds: {
        update: 'Change',
        create: 'New document',
        verify: 'Still holds',
      },
      by: '{{proposer}} for {{person}}',
      from: 'From {{source}}',
      reason: 'Reason',
      summary: 'Summary',
      stale:
        'The document changed since this was written (v{{base}} → v{{current}}). Accepting replaces the current version with the proposal whole.',
      diffProposed: 'Proposed change (v{{base}} → proposal)',
      diffCurrent: 'Against the current version (v{{current}} → proposal)',
      newContent: 'Proposed content',
      newFile: 'Proposed file',
      replacementFile: 'Replacement for version {{base}}',
      fileNote: 'Its text is extracted once it is accepted.',
      verifyNote:
        'Nothing in the document changes; it is marked verified today.',
      accept: 'Accept',
      acceptAnyway: 'Accept anyway',
      reject: 'Reject',
      comment: 'Comment (optional)',
      accepted: 'Accepted.',
      rejected: 'Rejected.',
      decided: '{{outcome}} by {{name}}',
      open: 'Open',
      readOnly: 'Someone who may edit this knowledge decides it.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      'Your earlier proposal for this document is still waiting; it has to be decided first.',
    KNOWLEDGE_PROPOSAL_REJECTED:
      'The same change was rejected before; propose something different.',
    EMPTY_CONTENT: 'The proposed content is empty.',
    INVALID_REASON: 'Say why it should change (at most 500 characters).',
    KNOWLEDGE_VERSION_CONFLICT:
      'Someone saved a newer version meanwhile; reload and apply your change again.',
    KNOWLEDGE_SLUG_TAKEN: 'Another document in this space has that slug.',
    KNOWLEDGE_HAS_CHILDREN: 'Archive or move its sub-documents first.',
    KNOWLEDGE_ARCHIVED: 'The document is archived; restore it first.',
    KNOWLEDGE_DEPTH_EXCEEDED: 'Documents nest at most four levels deep.',
    KNOWLEDGE_INVALID_MOVE:
      'A document cannot go under itself or one of its own.',
    KNOWLEDGE_PROPOSAL_STALE:
      'The document changed since the proposal was written.',
    KNOWLEDGE_PROPOSAL_DECIDED: 'This proposal has already been decided.',
    INVALID_SLUG: 'The slug takes lower-case letters, digits and hyphens.',
    INVALID_TITLE: 'A title is required (at most 200 characters).',
    FILE_TOO_LARGE: 'The file is too large.',
    FILES_UNAVAILABLE: 'This application stores no files.',
    INVALID_FILE: 'Send one file.',
    INVALID_PARENT: 'Nothing goes under a file.',
    KNOWLEDGE_NOT_FAILED:
      'Only a file whose text could not be extracted is extracted again.',
  },
  ui: { nav: { knowledge: 'Knowledge' } },
  common: {
    forbidden: 'You do not have permission to do this.',
    requestFailed: 'The request failed. Please try again.',
  },
};

export type KnowledgeClientResource = LocaleResource<typeof enUS>;

export default enUS;
