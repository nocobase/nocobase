/** The registry npm resolves against when nothing says otherwise. */
export const PUBLIC_REGISTRY_HOSTS = ['registry.npmjs.org'];

export interface BuildNpmrcOptions {
  readonly registry: string;
}

/**
 * The `.npmrc` a generated project starts with.
 *
 * Two settings, for two different reasons.
 *
 * `@nocobase:registry` is written whenever the templates were fetched from somewhere other than the public npm,
 * because nothing else in a generated project records where NocoBase packages come from. Without this scoped setting,
 * both the initial install and later `pnpm add @nocobase/…` commands — a database driver, plugin or upgrade — resolve
 * against the default registry and
 * fails with a 404 that says nothing about a registry. Scoped rather than global, so everything else still comes
 * from the package manager’s configured default registry. It is omitted for the public registry so that an application generated after the packages are
 * published there does not carry a pin to a mirror it never needed.
 *
 * `strict-peer-dependencies=false` matches what this repository sets for itself. The templates carry the same line
 * in their own `.npmrc`, but npm strips that file from every tarball it builds, so it never reaches a generated
 * project and has to be written here instead.
 */
export function buildNpmrcFile(options: BuildNpmrcOptions): string {
  const lines = ['strict-peer-dependencies=false'];

  if (!isPublicRegistry(options.registry)) {
    lines.unshift(`@nocobase:registry=${options.registry}`);
  }

  return `${lines.join('\n')}\n`;
}

/** An unparseable registry is treated as private: writing the line is harmless, omitting it strands the user. */
function isPublicRegistry(registry: string): boolean {
  try {
    return PUBLIC_REGISTRY_HOSTS.includes(new URL(registry).host);
  } catch {
    return false;
  }
}
