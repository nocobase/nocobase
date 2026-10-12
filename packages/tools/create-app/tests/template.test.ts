import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_REGISTRY,
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATE_TAG,
  downloadTemplate,
  isLocalTemplateSource,
  isTemplateAlias,
  resolveTemplateSource,
  TEMPLATE_ALIASES,
  TEMPLATE_TAGS,
} from '../src/lib/template.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('isLocalTemplateSource', () => {
  it('treats paths as local', () => {
    expect(isLocalTemplateSource('./packages/app-template-default')).toBe(true);
    expect(isLocalTemplateSource('../template')).toBe(true);
    expect(isLocalTemplateSource('/abs/path')).toBe(true);
    expect(isLocalTemplateSource('~/template')).toBe(true);
    expect(isLocalTemplateSource('C:\\template')).toBe(true);
  });

  it('treats package specifiers as remote', () => {
    expect(isLocalTemplateSource('@nocobase/app-template-default')).toBe(false);
    expect(isLocalTemplateSource('@nocobase/app-template-default@beta')).toBe(
      false,
    );
    expect(isLocalTemplateSource('some-template')).toBe(false);
  });
});

describe('DEFAULT_TEMPLATE', () => {
  it('is a name rather than a package specifier', () => {
    expect(DEFAULT_TEMPLATE).toBe('default');
    expect(isTemplateAlias(DEFAULT_TEMPLATE)).toBe(true);
  });
});

describe('TEMPLATE_ALIASES', () => {
  it('resolves examples at the selected release channel', () => {
    expect(TEMPLATE_ALIASES.examples).toEqual({
      packageName: '@nocobase/app-template-examples',
    });
    expect(resolveTemplateSource('examples')).toBe(
      '@nocobase/app-template-examples@latest',
    );
    expect(resolveTemplateSource('examples', { tag: 'beta' })).toBe(
      '@nocobase/app-template-examples@beta',
    );
  });

  it('maps the default name to the app template', () => {
    expect(TEMPLATE_ALIASES.default).toEqual({
      packageName: '@nocobase/app-template-default',
    });
  });

  /** The channel is applied separately, so `--template-tag` can move every alias at once. */
  it('carries no tag of its own', () => {
    for (const { packageName } of Object.values(TEMPLATE_ALIASES)) {
      expect(packageName).not.toMatch(/@(?:latest|beta|\d)/u);
    }
  });
});

describe('DEFAULT_TEMPLATE_TAG', () => {
  /**
   * changesets leaves the `beta` dist-tag on a package's first published version and tags every release since as
   * `latest`, so `beta` names the oldest template rather than the newest. Defaulting to it handed everyone a stale
   * template — an app scaffolded from it missed settings later releases added to `config.example.yml`.
   */
  it('is latest, because beta names the oldest published template', () => {
    expect(DEFAULT_TEMPLATE_TAG).toBe('latest');
    expect(TEMPLATE_TAGS).toContain('beta');
  });
});

describe('resolveTemplateSource', () => {
  it('expands a known name into its package at the default channel', () => {
    expect(resolveTemplateSource('default')).toBe(
      '@nocobase/app-template-default@latest',
    );
    expect(resolveTemplateSource('examples')).toBe(
      '@nocobase/app-template-examples@latest',
    );
  });

  it('applies the requested channel', () => {
    expect(resolveTemplateSource('default', { tag: 'beta' })).toBe(
      '@nocobase/app-template-default@beta',
    );
  });

  /**
   * A caller who spelled out a package already said which version they want, so appending a tag would override the
   * more specific request — and appending one to a local path would not resolve at all.
   */
  it('leaves a package specifier and a path alone even when a tag is given', () => {
    expect(
      resolveTemplateSource('@nocobase/app-template-default@0.0.1', {
        tag: 'beta',
      }),
    ).toBe('@nocobase/app-template-default@0.0.1');
    expect(resolveTemplateSource('./local-template', { tag: 'beta' })).toBe(
      './local-template',
    );
  });

  it('ignores surrounding whitespace', () => {
    expect(resolveTemplateSource('  default  ')).toBe(
      '@nocobase/app-template-default@latest',
    );
  });

  /**
   * An alias table that swallowed package specifiers and paths would make the flag less capable than it was, so
   * anything unknown passes through untouched.
   */
  it('passes a package specifier through untouched', () => {
    expect(resolveTemplateSource('@nocobase/app-template-default@0.0.1')).toBe(
      '@nocobase/app-template-default@0.0.1',
    );
    expect(resolveTemplateSource('some-other-template')).toBe(
      'some-other-template',
    );
  });

  it('passes a local path through untouched', () => {
    expect(resolveTemplateSource('./packages/app-template-default')).toBe(
      './packages/app-template-default',
    );
  });
});

describe('isTemplateAlias', () => {
  it('recognizes only the names in the table', () => {
    expect(isTemplateAlias('default')).toBe(true);
    expect(isTemplateAlias('examples')).toBe(true);
    expect(isTemplateAlias('hub')).toBe(false);
    expect(isTemplateAlias('@nocobase/app-template-default')).toBe(false);
    expect(isTemplateAlias('./local')).toBe(false);
  });

  /** Inherited Object properties must not read as templates. */
  it('is not fooled by inherited properties', () => {
    expect(isTemplateAlias('constructor')).toBe(false);
    expect(isTemplateAlias('toString')).toBe(false);
  });
});

describe('DEFAULT_REGISTRY', () => {
  it('points at the public npm registry', () => {
    expect(DEFAULT_REGISTRY).toBe('https://registry.npmjs.org');
  });
});

describe('downloadTemplate', () => {
  it(
    'reports the source when a package cannot be fetched',
    { timeout: 60_000 },
    async () => {
      await expect(
        downloadTemplate({ source: '@nocobase/this-template-does-not-exist' }),
      ).rejects.toThrow(/this-template-does-not-exist/u);
    },
  );

  it('leaves no extract directory behind when it fails', async () => {
    const notAPackage = await mkdtemp(
      path.join(os.tmpdir(), 'create-app-not-a-package-'),
    );
    created.push(notAPackage);

    const before = await countTempDirectories();
    await downloadTemplate({ source: notAPackage }).catch(() => undefined);

    expect(await countTempDirectories()).toBe(before);
  });

  it('rejects a local directory that is not a package', async () => {
    const empty = await mkdtemp(
      path.join(os.tmpdir(), 'create-app-not-a-package-'),
    );
    created.push(empty);

    await expect(downloadTemplate({ source: empty })).rejects.toThrow();
  });
});

async function countTempDirectories(): Promise<number> {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(os.tmpdir());

  return entries.filter((entry) => entry.startsWith('nocobase-template-'))
    .length;
}
