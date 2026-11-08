const agentsOverview = {
  statusTitle: 'This application',
  connected: 'Configured',
  pending: 'Not configured',
  partial: 'Configuration incomplete',
  unknown: 'Unable to confirm',
  loading: 'Checking…',
  refresh: 'Refresh status',
  connectedHint:
    'The plugin is configured. Which features people can use still depends on the configured models, business entry points and machine connections.',
  pendingHint:
    'AI agent capabilities have not been configured in this application. Choose a scenario below and give its request to your development Agent to get started.',
  partialHint:
    'AI agent configuration is incomplete. Ask your development Agent to finish the configuration for the scenario you choose below.',
  unknownHint:
    'The current configuration status is unavailable. You can still use the feature descriptions and setup guides below.',
  forbidden: 'Your account cannot read configuration status.',
  expired: 'Sign in again to read configuration status.',
  failed: 'Unable to read configuration status. Try refreshing it.',
  signIn: 'Sign in',
  capabilitiesTitle: 'What it provides',
  capabilities: {
    models: {
      title: 'Model services',
      description:
        'Connect model providers, choose chat models and test connections.',
    },
    chat: {
      title: 'AI conversations',
      description:
        'Read replies as they arrive, stop generation and return to conversation history.',
    },
    skills: {
      title: 'Business Skills',
      description:
        'Maintain reusable team instructions, supporting files and their versions.',
    },
    tools: {
      title: 'Business tools',
      description:
        'Let assistants query or act on business data through explicitly integrated, authorized operations.',
    },
    machines: {
      title: 'Machine agents',
      description:
        'Connect coding tools on a machine and track delegated work and its results.',
    },
    usage: {
      title: 'Usage and pricing',
      description:
        'Review model usage and maintain prices used for cost reporting.',
    },
  },
  goalsTitle: 'Choose a use case',
  preparation: 'Prepare',
  business: {
    title: 'Add AI conversations to a business page',
    description:
      'Help people summarize customer conversations, draft content or ask questions alongside their work.',
    preparation:
      'A model service and a chat model. Querying or changing business records also requires the corresponding business tools and permissions.',
    boundary:
      'Model conversations do not directly read application source code or run project builds and tests. Use a machine agent for project work.',
    setup: 'Set up AI conversations',
    steps: {
      entry:
        'Ask your development Agent to add a chat entry and the model management page to the application. Decide who may use them and what business information the assistant may access.',
      models:
        'Add a model service, enter its credentials in the dedicated fields, fetch the available models and enable a chat model. Test the connection before saving; embedding and rerank models are not chat models.',
      chat: 'Open the chat, select a model and send a small request using information you provide. Check that replies arrive, generation can be stopped and the conversation can be reopened.',
      verify:
        'If the assistant needs business data, add the relevant tools and access rules. Verify real tool results and confirm that switching accounts does not expose another person’s conversations.',
    },
    prompt:
      'Add an AI conversation entry to [business page] for [users]. It should help with [questions or content tasks], allow model selection and stopping a reply, and preserve each person’s conversation history.\n\nRead the installed nocobase-app-plugin-agents Skill and check the existing integration. Reuse or add the model management page and chat entry. Configure a chat model through model management; credentials belong in its dedicated fields, not this request or source code.\n\nIf the assistant needs business records, integrate only the necessary tools and enforce the current user’s permissions. Verify an actual reply, stopping, reopening history and account isolation. Report any setup still missing.',
  },
  skills: {
    title: 'Apply team standards with business Skills',
    description:
      'Turn recurring instructions into reusable Skills, such as organizing a weekly report or drafting customer responses in the team’s format.',
    preparation:
      'A working model conversation, the team’s instructions and any supporting documents.',
    boundary:
      'Importing a Skill does not select it for every conversation. A Skill guides the work; it does not grant access to business data.',
    setup: 'Set up a business Skill',
    steps: {
      prepare:
        'Write down the input, output format and handling of missing information. Prepare the Skill instructions and any examples or supporting documents.',
      import:
        'Have the application expose Skill management, then import the Skill and check its instructions, supporting files and version.',
      select:
        'Add a dedicated business entry or configure the conversation to use that Skill. Opening an ordinary chat does not automatically select an imported Skill.',
      verify:
        'Try a real input and inspect the tool record to confirm that the instructions and supporting files were read. Check the draft against team rules; missing facts should remain identified as missing.',
    },
    prompt:
      'Create a business Skill for [team] to help with [recurring task, such as preparing a weekly report]. Follow [format and rules] and use [supporting documents]. Mark missing facts instead of inventing them, and produce a draft without publishing it.\n\nRead the installed nocobase-app-plugin-agents Skill. Reuse existing model services and Skill management, prepare the Skill and its supporting files, and add a business entry that explicitly selects it for the conversation. Preserve the current user’s business permissions.\n\nVerify with a real example. Check that the tool record shows the Skill and supporting files were read, that the draft follows the rules and that the entry handles failures clearly.',
  },
  runner: {
    title: 'Delegate project work to a machine agent',
    description:
      'Use a coding assistant on a connected computer or server to inspect a project, make changes and run checks.',
    preparation:
      'A coding tool installed and signed in on the target machine, a Runner connection, and an enabled tool/model combination.',
    boundary:
      'Machine agents use the coding tool’s own credentials. A normal conversation has its own working directory and does not automatically open the application’s source project.',
    setup: 'Set up a machine agent',
    steps: {
      prepare:
        'Choose the target machine and coding tool, install it and complete its sign-in. Ask your development Agent to prepare the application’s machine connection and agent management entries, including the required Runner distribution.',
      connect:
        'Create a personal or shared machine connection, choose allowed tools, and follow the connection instructions. Wait for the machine to report its tools, sign-in state and models.',
      enable:
        'In machine agent management, add or select an available tool/model combination and enable it. An online machine alone does not mean an agent is enabled.',
      verify:
        'Choose the machine agent in chat and first request a read-only check of its working directory. For project changes, configure an authorized project directory and inspect actual command output, code changes and check results.',
    },
    prompt:
      'Connect a coding assistant on [target machine] so that users can select an available machine agent, submit [task type] and follow its progress and results in the application.\n\nRead the installed nocobase-app-plugin-agents Skill and inspect existing integration. Prepare the required management entries and Runner distribution, connect the machine, check the coding tool’s own sign-in and reported models, and enable the chosen tool/model combination. Do not confuse its credentials with model services used for ordinary chat.\n\nFirst verify a read-only task in the conversation’s working directory. If work should target [project], provide an authorized project directory rather than trusting a path typed into chat. Verify real commands and output, then report the code changes and checks for any requested edits.',
  },
  agentTab: 'Development request',
  manualTab: 'Setup steps',
  promptHint:
    'Replace the bracketed details and give this request to the Agent developing your application. It is not a message for a business conversation.',
  promptLabel: 'Editable request',
  copy: 'Copy request',
  copied: 'Copied',
  copyFailed: 'Copy failed. Select the request above and copy it manually.',
  management: 'Where to manage models, Skills and usage',
  managementHint:
    'The application chooses which management pages and business entry points to provide. The following describes their roles, not what has already been configured here.',
  managementItems: {
    models: {
      title: 'Model services',
      description:
        'Add providers, fetch models, test connections and manage credentials in model management. Model services are not configured under agents in config.yml.',
    },
    skills: {
      title: 'Skills',
      description:
        'Import team instructions and supporting files, maintain versions and explicitly select them for a business conversation or task.',
    },
    machines: {
      title: 'Machine connections and agents',
      description:
        'Manage connected machines and permitted coding tools separately from enabled tool/model combinations. Check both when a task cannot start.',
    },
    usage: {
      title: 'Usage and prices',
      description:
        'Use usage management to inspect consumption and maintain model prices. Add this management entry when the application needs it.',
    },
  },
};

export default agentsOverview;
