import {
  createClientLibraryConfig,
  createShadcnRegistryConfig,
} from '@nocobase/dev-config/eslint';

export default createClientLibraryConfig({
  tsconfigRootDir: import.meta.dirname,
  // The primitives in client/components/ui are shadcn registry output.
  environment: createShadcnRegistryConfig(),
});
