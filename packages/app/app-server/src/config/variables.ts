import type { ConfigMap } from '@nocobase/config';
import {
  isSecretPath,
  type EnvironmentMapping,
  type EnvironmentValueGenerator,
} from '@nocobase/config/providers/env';

import { PLACEHOLDER_SECRET } from './placeholder-secret.js';
import { RUNTIME_ENVIRONMENT_VARIABLES } from './runtime-environment.js';

/**
 * Values the templates' `config.example.yml` ship that only stand in for a real one. A path holding one of them in the
 * example counts as having no value there, so a deployment is still asked for it. The application itself is not told:
 * an example copied by hand keeps working exactly as before.
 */
export const KNOWN_EXAMPLE_PLACEHOLDERS: readonly string[] = [
  PLACEHOLDER_SECRET,
  'admin123',
];

/** One variable in the manifest. `runtime` marks one the runtime reads itself rather than through a section. */
export interface VariablesManifestEntry {
  readonly name: string;
  readonly path?: string;
  readonly type: string;
  readonly description?: string;
  readonly secret: boolean;
  readonly required: boolean;
  /** The code defaults hold a value at the path. */
  readonly hasDefault: boolean;
  /** `config.example.yml` holds a value at the path that is not a known placeholder. */
  readonly exampleProvided: boolean;
  readonly firstStartOnly: boolean;
  readonly generate: EnvironmentValueGenerator | null;
  readonly runtime?: true;
}

/** `dist/variables.json`: every environment variable an application reads, as a deployment needs to know them. */
export interface VariablesManifest {
  readonly schemaVersion: 1;
  readonly app: { readonly name: string; readonly version?: string };
  readonly generatedAt: string;
  readonly variables: readonly VariablesManifestEntry[];
}

export interface BuildVariablesManifestOptions {
  readonly app: { readonly name: string; readonly version?: string };
  /** What `AppConfig.environmentVariableMappings()` returns: absolute paths. */
  readonly variables: Readonly<Record<string, EnvironmentMapping>>;
  /** The code defaults, `AppConfig.layers().defaults`. */
  readonly defaults: ConfigMap;
  /** `config.example.yml`, parsed; left out when the application ships none. */
  readonly example?: ConfigMap;
  readonly generatedAt?: Date;
}

/** Whether a value, or any string inside it, is one of {@link KNOWN_EXAMPLE_PLACEHOLDERS}. */
export function isExamplePlaceholder(value: unknown): boolean {
  if (typeof value === 'string')
    return KNOWN_EXAMPLE_PLACEHOLDERS.includes(value.trim());
  if (Array.isArray(value)) return value.some(isExamplePlaceholder);
  if (typeof value === 'object' && value !== null)
    return Object.values(value).some(isExamplePlaceholder);
  return false;
}

/**
 * Whether a deployment must supply a variable: the mapping says so, or else nothing else would give the path a value —
 * no code default, no real value in `config.example.yml`, and no way for the deployment to generate one.
 */
export function requiredOf(
  mapping: EnvironmentMapping,
  defaults: ConfigMap,
  example: ConfigMap | undefined,
): boolean {
  if (mapping.required !== undefined) return mapping.required;
  return (
    !hasValue(defaults, mapping.path) &&
    !hasRealValue(example, mapping.path) &&
    mapping.generate === undefined
  );
}

/** Builds the manifest `pnpm nocobase config variables` prints and `pnpm build` writes to `dist/variables.json`. */
export function buildVariablesManifest(
  options: BuildVariablesManifestOptions,
): VariablesManifest {
  const declared = Object.entries(options.variables)
    .map(([name, mapping]): VariablesManifestEntry => ({
      name,
      path: mapping.path,
      type: mapping.type ?? 'string',
      ...(mapping.description === undefined
        ? {}
        : { description: mapping.description }),
      secret: mapping.secret ?? isSecretPath(mapping.path),
      required: requiredOf(mapping, options.defaults, options.example),
      hasDefault: hasValue(options.defaults, mapping.path),
      exampleProvided: hasRealValue(options.example, mapping.path),
      firstStartOnly: mapping.firstStartOnly ?? false,
      generate: mapping.generate ?? null,
    }))
    .sort((a, b) => a.path!.localeCompare(b.path!));
  const runtime = RUNTIME_ENVIRONMENT_VARIABLES.map(
    (variable): VariablesManifestEntry => ({
      name: variable.name,
      type: 'string',
      description: variable.description,
      secret: false,
      required: false,
      hasDefault: false,
      exampleProvided: false,
      firstStartOnly: false,
      generate: null,
      runtime: true,
    }),
  );
  return {
    schemaVersion: 1,
    app: options.app,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    variables: [...declared, ...runtime],
  };
}

function valueAt(map: ConfigMap | undefined, path: string): unknown {
  let value: unknown = map;
  for (const segment of path.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

function hasValue(map: ConfigMap | undefined, path: string): boolean {
  const value = valueAt(map, path);
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function hasRealValue(map: ConfigMap | undefined, path: string): boolean {
  return hasValue(map, path) && !isExamplePlaceholder(valueAt(map, path));
}
