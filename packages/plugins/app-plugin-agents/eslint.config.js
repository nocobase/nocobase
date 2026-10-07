import {
  commandRules,
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

// This plugin knows no business plugin: the application joins it to one (the assembling application joins it to the projects plugin in
// `server/agents/`).
const businessPlugins = {
  group: ['@nocobase/app-plugin-projects', '@nocobase/app-plugin-projects/*'],
  message:
    'The agents plugin does not know the projects plugin; the application joins them (for example, server/agents).',
};

// The commands in cli/ keep the imports the shared command rules refuse, which a later rule would otherwise replace.
const commandOverrides = commandRules.map((config) => {
  const restricted = config.rules?.['no-restricted-imports'];
  const options = Array.isArray(restricted) ? restricted[1] : undefined;
  return {
    name: 'app-plugin-agents/no-business-plugins-in-commands',
    files: config.files,
    ignores: config.ignores,
    rules: {
      'no-restricted-imports': [
        'error',
        { ...options, patterns: [businessPlugins] },
      ],
    },
  };
});

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // The primitives in client/components/ui are shadcn registry output.
  environment: createShadcnRegistryConfig(),
  overrides: [
    {
      name: 'app-plugin-agents/no-business-plugins',
      rules: {
        'no-restricted-imports': ['error', { patterns: [businessPlugins] }],
      },
    },
    ...commandOverrides,
  ],
});
