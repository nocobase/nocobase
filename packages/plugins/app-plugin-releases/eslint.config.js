import {
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // Registry source is compiled after installation by the consuming app.
  ignores: ['registry/**'],
  // The primitives in client/components/ui are shadcn registry output.
  environment: createShadcnRegistryConfig(),
});
