import { realpathSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };

const require = createRequire(import.meta.url);

function installedPackage(name: string, from = require) {
  const file = from.resolve(`${name}/package.json`);
  const metadata = JSON.parse(readFileSync(file, 'utf8')) as {
    version: string;
    dependencies?: Record<string, string>;
  };
  return { file: realpathSync(file), metadata, require: createRequire(file) };
}

const sdkPackages = [
  'ai',
  ...Object.keys({
    ...packageMetadata.dependencies,
    ...packageMetadata.peerDependencies,
  }).filter(
    (name) =>
      (name.startsWith('@ai-sdk/') && name !== '@ai-sdk/provider-utils') ||
      name === 'ollama-ai-provider-v2',
  ),
];

it.each(sdkPackages)(
  '%s shares the Agents provider-utils schema identity',
  (name) => {
    const expected = installedPackage('@ai-sdk/provider-utils');
    const sdk = installedPackage(name);
    const actual = installedPackage('@ai-sdk/provider-utils', sdk.require);
    const guidance =
      'Upgrade the AI SDK release set together in pnpm-workspace.yaml, including ai, React, providers, and provider-utils. Root overrides apply only to workspace installations.';

    expect(
      actual.file,
      `${name} uses a separate Schema identity. ${guidance}`,
    ).toBe(expected.file);
    // An override must not hide an SDK upgrade that expects a newer utils API.
    if (name === 'ai' || name.startsWith('@ai-sdk/')) {
      expect(
        sdk.metadata.dependencies?.['@ai-sdk/provider-utils'],
        `${name} expects another provider-utils release. ${guidance}`,
      ).toBe(expected.metadata.version);
    }
  },
);
