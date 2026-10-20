import {
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  environment: createShadcnRegistryConfig(),
  tsconfigRootDir: import.meta.dirname,
  // Registry source is compiled after installation by the consuming app.
  ignores: ['registry/**'],
});
