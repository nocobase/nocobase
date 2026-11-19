import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  isSecretPath,
  leafPaths,
  valueAtPath,
} from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { stringify } from 'yaml';

import {
  MASK,
  REDACTED,
  type ConfigInspectorSnapshot,
  type InspectedSetting,
  type InspectedVariable,
  type SettingSource,
} from '../shared/snapshot.js';
import { exampleSections, exampleValues } from './example.js';
import { maskUrls, Redactor } from './redact.js';

/** Everything the page shows, redacted. Nothing unredacted leaves this function. */
export async function inspectConfiguration(
  app: Pick<AppPluginApplication, 'config' | 'paths'>,
): Promise<ConfigInspectorSnapshot> {
  const inspection = app.config.inspect?.();
  const mappings = app.config.environmentVariableMappings?.() ?? {};
  const effective = app.config.raw();
  const variableOf = new Map<string, string>();
  const secretPaths = new Set<string>();
  for (const [name, mapping] of Object.entries(mappings)) {
    variableOf.set(mapping.path, name);
    if (mapping.secret ?? isSecretPath(mapping.path))
      secretPaths.add(mapping.path);
  }
  const redactor = new Redactor(secretPaths);
  const display = (at: string, value: unknown): string =>
    text(redactor.value(at, value));

  const exampleText = await readOptional(
    path.join(app.paths.deploymentRootDir, 'config.example.yml'),
  );
  const example = exampleText === null ? undefined : exampleValues(exampleText);
  const sourceOf = (at: string): SettingSource =>
    inspection?.sources[at] ?? 'default';
  const firstStartOnly = new Set(
    Object.values(mappings)
      .filter((mapping) => mapping.firstStartOnly)
      .map((mapping) => mapping.path),
  );

  const settings = leafPaths(effective).map((at): InspectedSetting => {
    const value = valueAtPath(effective, at);
    const source = sourceOf(at);
    const fileValue = valueAtPath(inspection?.fileValues, at);
    const variable = variableOf.get(at);
    return {
      path: at,
      value: display(at, value),
      source,
      secret: typeof value !== 'boolean' && redactor.isSensitive(at),
      customized:
        source !== 'default' &&
        !isDeepStrictEqual(valueAtPath(example, at), value),
      ...(variable ? { variable } : {}),
      ...(source === 'environment' && fileValue !== undefined
        ? { fileValue: display(at, fileValue) }
        : {}),
      ...(firstStartOnly.has(at) ? { firstStartOnly: true } : {}),
    };
  });

  const variables = Object.entries(mappings)
    .map(([name, mapping]): InspectedVariable => {
      const set = Object.entries(inspection?.sources ?? {}).some(
        ([at, source]) =>
          source === 'environment' &&
          (at === mapping.path || at.startsWith(`${mapping.path}.`)),
      );
      return {
        name,
        path: mapping.path,
        ...(mapping.description ? { description: mapping.description } : {}),
        secret: redactor.isSensitive(mapping.path),
        firstStartOnly: mapping.firstStartOnly ?? false,
        set,
        value: set
          ? display(mapping.path, valueAtPath(effective, mapping.path))
          : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const documented = exampleText === null ? [] : exampleSections(exampleText);
  const keys = new Set([
    ...documented.map((section) => section.key),
    ...Object.keys(effective),
  ]);
  const sections = [...keys].map((key) => {
    const comment = documented.find((section) => section.key === key)?.comment;
    return {
      key,
      ...(comment ? { comment: maskUrls(comment) } : {}),
      inExample: documented.some((section) => section.key === key),
    };
  });

  const file = inspection?.files.at(-1);
  return {
    file: {
      path: file ? displayPath(app.paths.deploymentRootDir, file.path) : null,
      exists: file?.text != null,
      text:
        file?.text == null
          ? ''
          : /\.ya?ml$/iu.test(file.path)
            ? redactor.yaml(file.text)
            : stringify(redactor.value('', inspection?.fileValues ?? {}), {
                lineWidth: 0,
              }).replaceAll(REDACTED, MASK),
    },
    example: exampleText === null ? null : redactor.yaml(exampleText),
    loadedAt: inspection?.loadedAt ?? null,
    reloads: inspection?.reloads ?? 0,
    settings,
    variables,
    sections,
  };
}

/** A file inside the deployment relative to it, such as `config.yml`; one elsewhere in full. */
function displayPath(root: string, file: string): string {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative
    : file;
}

function text(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value);
}

async function readOptional(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
