import { pluginTopicFor } from '@nocobase/app-cli';
import { describe, expect, it } from 'vitest';

import cliPlugin from '../src/cli/index.ts';
import HubDeploy from '../src/cli/deploy.ts';
import HubUpload from '../src/cli/upload.ts';
import packageMetadata from '../package.json' with { type: 'json' };

describe('the commands an application gets from this package', () => {
  it('belongs to this package and mounts under hub', () => {
    expect(cliPlugin.packageName).toBe(packageMetadata.name);
    expect(cliPlugin.topic).toBe('hub');
    expect(pluginTopicFor(packageMetadata.name)).toBe('hub');
    expect(cliPlugin.description).toBeTruthy();
  });

  it('contributes development commands only, so a built dist/ has none', () => {
    expect(cliPlugin.commands).toEqual({});
    expect(cliPlugin.devCommands).toEqual({
      deploy: HubDeploy,
      upload: HubUpload,
    });
  });

  it('declares no hooks, which a package found through package.json may not contribute', () => {
    expect(cliPlugin.buildHooks).toEqual({});
    expect(cliPlugin.devHooks).toEqual({});
  });

  it('names its CLI entry for the application command line to find', () => {
    const entry = packageMetadata.nocobase.cli.entry;
    expect(entry).toBe('./cli');
    expect(packageMetadata.exports[entry]).toBeDefined();
    expect(packageMetadata.publishConfig.exports[entry]).toBeDefined();
  });

  it('takes the command line and oclif from the application', () => {
    expect(packageMetadata.peerDependencies['@nocobase/app-cli']).toBeTruthy();
    expect(packageMetadata.peerDependencies['@oclif/core']).toBeTruthy();
    // Declared once. pnpm resolves a peer here on its own, so a duplicate devDependency would add nothing.
    expect(
      (packageMetadata.devDependencies as Record<string, string>)[
        '@nocobase/app-cli'
      ],
    ).toBeUndefined();
  });

  it('gives every command a summary, an example and described flags', () => {
    for (const [name, command] of Object.entries(cliPlugin.devCommands)) {
      expect(command.summary, `${name} has no summary`).toBeTruthy();
      expect(
        command.examples?.length,
        `${name} has no example`,
      ).toBeGreaterThan(0);
      for (const [flag, definition] of Object.entries(command.flags ?? {})) {
        expect(
          definition.description,
          `${name} --${flag} has no description`,
        ).toBeTruthy();
      }
    }
  });
});
