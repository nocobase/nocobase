export interface BuildNpmrcOptions {
  readonly nocobaseRegistry?: string;
}

/** Persist only an explicit NocoBase scope override; inherit other package-manager settings. */
export function buildNpmrcFile(options: BuildNpmrcOptions): string {
  const lines = ['strict-peer-dependencies=false'];
  if (options.nocobaseRegistry !== undefined) {
    lines.unshift(`@nocobase:registry=${options.nocobaseRegistry}`);
  }
  return `${lines.join('\n')}\n`;
}
