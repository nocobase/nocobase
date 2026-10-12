import type { AppClientSourceExtension } from '@nocobase/app-client/plugins';

interface AppClientSourceExtensionModule {
  readonly default: AppClientSourceExtension;
}

const extensionModules = import.meta.glob<AppClientSourceExtensionModule>(
  './extensions/*/extension.ts',
  { eager: true },
);

export const sourceExtensions: readonly AppClientSourceExtension[] =
  Object.freeze(
    Object.entries(extensionModules)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, module]) => module.default),
  );

export default sourceExtensions;
