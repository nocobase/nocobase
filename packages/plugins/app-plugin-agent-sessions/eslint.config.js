import {
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

// This plugin knows no business plugin: the application ties its records to sessions (for Studio, `server/agent-sessions/`).
const businessPlugins = {
  group: ['@nocobase/app-plugin-projects', '@nocobase/app-plugin-projects/*'],
  message:
    'Agent sessions do not know the projects plugin; the application ties its records to sessions.',
};

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // The primitives in client/components/ui are shadcn registry output.
  environment: createShadcnRegistryConfig(),
  overrides: [
    {
      name: 'app-plugin-agent-sessions/no-business-plugins',
      rules: {
        'no-restricted-imports': ['error', { patterns: [businessPlugins] }],
      },
    },
  ],
});
