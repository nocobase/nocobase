import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCliPluginsEditor } from '../packages/app/app-cli/src/lib/cli-plugins.ts';
import { createClientPluginsEditor } from '../packages/app/app-cli/src/lib/client-plugins.ts';
import { createServerPluginsEditor } from '../packages/app/app-cli/src/lib/server-plugins.ts';

const expectedSection = new Map([
  ['preinstall-and-enable', 'dependencies'],
  ['preinstall-only', 'devDependencies'],
  ['do-not-preinstall', null],
  ['deprecated', null],
]);

export function policyErrors(plugin, template, registrations) {
  const policy = plugin.nocobase?.pluginPolicy;
  if (!expectedSection.has(policy))
    return [
      `nocobase.pluginPolicy must be one of: ${[...expectedSection.keys()].join(', ')}`,
    ];

  const errors = [];
  const expected = expectedSection.get(policy);
  const sections = ['dependencies', 'devDependencies'].filter((key) =>
    Object.hasOwn(template[key] ?? {}, plugin.name),
  );
  if (
    sections.length !== Number(expected !== null) ||
    (expected && !sections.includes(expected))
  ) {
    errors.push(
      `${policy}: expected ${expected ?? 'no direct dependency'} in Default, found ${sections.join(' and ') || 'no direct dependency'}`,
    );
  }
  const enabled = policy === 'preinstall-and-enable';
  let hasEntry = false;
  for (const [side, packages] of Object.entries(registrations)) {
    const providesEntry = Object.hasOwn(plugin.exports ?? {}, './' + side);
    hasEntry ||= providesEntry;
    const required = enabled && providesEntry;
    if (packages.has(plugin.name) !== required)
      errors.push(
        `${policy}: ${required ? 'missing' : 'unexpected'} registration in Default ${side}/plugins.ts`,
      );
  }
  if (enabled && !hasEntry)
    errors.push(`${policy}: no client, server or CLI plugin entry to enable`);
  return errors;
}

if (process.argv[1] === import.meta.filename) {
  const root = fileURLToPath(new URL('../packages/', import.meta.url));
  const templateRoot = join(root, 'templates/app-template-default');
  const template = JSON.parse(
    readFileSync(join(templateRoot, 'package.json'), 'utf8'),
  );
  const registrations = {};
  for (const [side, createEditor] of Object.entries({
    client: createClientPluginsEditor,
    server: createServerPluginsEditor,
    cli: createCliPluginsEditor,
  })) {
    const editor = await createEditor(templateRoot);
    const source = readFileSync(join(templateRoot, side, 'plugins.ts'), 'utf8');
    registrations[side] = new Set(
      editor.list(source).map((entry) => entry.packageName),
    );
  }

  for (const entry of readdirSync(join(root, 'plugins'), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;
    const manifest = join('plugins', entry.name, 'package.json');
    const path = join(root, manifest);
    if (!existsSync(path)) continue;
    for (const error of policyErrors(
      JSON.parse(readFileSync(path, 'utf8')),
      template,
      registrations,
    )) {
      console.error(`packages/${manifest}: ${error}`);
      process.exitCode = 1;
    }
  }
}
