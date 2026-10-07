/** The Models page (`client/pages/models/`) and its model services UI (`client/online/`). */
const servicesEnUS = {
  models: {
    title: 'Models',
    description:
      'The model services online agents call, and the models each one offers: chat models for agents, embedding and rerank models for search.',
  },
  defaultModel: {
    title: 'Default chat model',
    description:
      'Online agents with no models of their own answer with it, such as a new agent or one that came with the application.',
    none: 'No chat model is turned on yet. Add a model service and turn on a chat model: the first one becomes the default.',
    saved: 'The default chat model is now {{model}}.',
  },
  services: {
    list: 'Model services',
    columns: {
      name: 'Name',
      provider: 'Provider type',
      status: 'Status',
    },
    loadFailed: 'Could not load the model services',
    empty: {
      title: 'No model service yet',
      description:
        'Once you add a model service, online agents can answer through it.',
      readOnly: 'Ask an administrator to add a model service.',
    },
    add: {
      open: 'Add service',
      title: 'Add a model service',
      provider: 'Provider type',
      created: '{{title}} added.',
    },
    status: {
      on: 'On',
      off: 'Off',
      noKey: 'No API key',
      noModels: 'No model on',
    },
    service: {
      edit: 'Edit {{title}}',
      defaultHost: 'Provider default',
      actions: 'More actions for {{title}}',
      turnOn: 'Turn on',
      turnOff: 'Turn off',
      turnedOn: '{{title}} is on.',
      turnedOff: '{{title}} is off.',
      name: 'Name',
      enabled: 'Enabled',
      enabledHint: 'Online agents may use its models only while it is on.',
      saved: '{{title}} saved.',
      delete: 'Delete',
      deleteTitle: 'Delete {{title}}?',
      deleteDescription:
        'Agents that use its models stop answering until they are given another, and its model prices are deleted.',
      deleted: '{{title}} deleted.',
    },
    connection: {
      apiKey: 'API key',
      keyPlaceholder: 'Paste the API key',
      baseUrl: 'Base URL',
      baseUrlHint: 'Empty uses the provider’s default, {{url}}.',
      baseUrlRequired: 'The address of the provider’s API.',
      baseUrlInvalid: 'The base URL starts with http:// or https://.',
      test: 'Test connection',
      testing: 'Testing…',
      testOk: 'Connected: {{model}} answered.',
      testFailed: '{{model}} did not answer: {{message}}',
      testNeedsModel: 'Check a model to test the connection.',
    },
    models: {
      title: 'Models',
      description:
        'Check the models this service offers, and say what each is for: chat models answer agents, embedding models index text for search, rerank models order search results. An embedding model may ask for vectors of a size.',
      fetching: 'Fetching the provider’s models…',
      fetchFailed: 'The provider would not list its models: {{message}}',
      fetch: 'Fetch models',
      search: 'Search models',
      noMatch: 'No model matches.',
      empty:
        'No model yet. Fetch them from the provider, or add one by its ID.',
      add: 'Add model',
      addPlaceholder: 'Model ID',
      kind: 'What {{model}} is for',
      kinds: {
        chat: 'Chat',
        embedding: 'Embedding',
        rerank: 'Rerank',
      },
      test: 'Test {{model}}',
      testOk: 'Answered as {{kind}}.',
      testFailed: 'Did not answer: {{message}}',
      notKind: {
        chat: 'This model doesn’t look like a chat model',
        embedding: 'This model doesn’t look like an embedding model',
        rerank: 'This model doesn’t look like a rerank model',
      },
      looksLike: '{{notKind}}: it answers as {{kind}}.',
      kindNouns: {
        chat: 'a chat model',
        embedding: 'an embedding model',
        rerank: 'a rerank model',
      },
      dimensions: 'Vector size of {{model}}',
      dimensionsPlaceholder: 'Default',
      counts: {
        chat: '{{count}} chat',
        embedding: '{{count}} embedding',
        rerank: '{{count}} rerank',
      },
    },
  },
};

export type ServicesLocale = typeof servicesEnUS;

export default servicesEnUS;
