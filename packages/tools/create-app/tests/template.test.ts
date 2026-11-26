import { createHash } from 'node:crypto';
import { applyTemplatePreset } from '../src/lib/template-preset.ts';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
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
  vi.unstubAllEnvs();
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

  it.each(['pro', 'enterprise'])(
    'resolves the %s edition at the requested channel',
    (edition) => {
      expect(resolveTemplateSource(edition, { tag: 'beta' })).toBe(
        `@nocobase/app-template-${edition}@beta`,
      );
    },
  );

  it('resolves multi-portal at the selected channel without rewriting explicit versions', () => {
    expect(resolveTemplateSource('multi-portal')).toBe(
      '@nocobase/app-template-enterprise@latest',
    );
    expect(resolveTemplateSource('multi-portal', { tag: 'beta' })).toBe(
      '@nocobase/app-template-enterprise@beta',
    );
    expect(
      resolveTemplateSource('@nocobase/app-template-multi-portal@0.1.0', {
        tag: 'beta',
      }),
    ).toBe('@nocobase/app-template-multi-portal@0.1.0');
  });

  it('resolves multi-app with the selected channel without changing explicit versions', () => {
    expect(isTemplateAlias('multi-app')).toBe(true);
    expect(resolveTemplateSource('multi-app')).toBe(
      '@nocobase/app-template-enterprise@latest',
    );
    expect(resolveTemplateSource('multi-app', { tag: 'beta' })).toBe(
      '@nocobase/app-template-enterprise@beta',
    );
    expect(
      resolveTemplateSource('@nocobase/app-template-multi-app@0.0.1', {
        tag: 'beta',
      }),
    ).toBe('@nocobase/app-template-multi-app@0.0.1');
  });
  it('resolves the child template at the requested channel', () => {
    expect(isTemplateAlias('sub-app')).toBe(true);
    expect(resolveTemplateSource('sub-app', { tag: 'beta' })).toBe(
      '@nocobase/app-template-enterprise@beta',
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

describe('local template archives', () => {
  it.each(['.tgz', '.tar.gz'])(
    'uses a packed %s artifact directly without package-registry access',
    async (extension) => {
      const root = await mkdtemp(path.join(os.tmpdir(), 'create-app-archive-'));
      created.push(root);
      await mkdir(path.join(root, 'package'));
      await writeFile(
        path.join(root, 'package', 'package.json'),
        JSON.stringify({ name: '@test/packed', version: '0.0.0' }),
      );
      await writeFile(path.join(root, 'package', 'marker'), 'archive-only');
      const archive = path.join(root, 'candidate archive' + extension);
      execFileSync('tar', ['-czf', archive, '-C', root, 'package']);
      const result = await downloadTemplate({
        source: archive,
        nocobaseRegistry: 'https://registry.invalid/',
      });
      created.push(result.directory);
      expect(result).toMatchObject({ name: '@test/packed', version: '0.0.0' });
      expect(
        await readFile(path.join(result.directory, 'marker'), 'utf8'),
      ).toBe('archive-only');
    },
  );
});

describe('isTemplateAlias', () => {
  it('recognizes only the names in the table', () => {
    expect(isTemplateAlias('default')).toBe(true);
    expect(isTemplateAlias('examples')).toBe(true);
    expect(isTemplateAlias('multi-portal')).toBe(true);
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

describe('downloadTemplate', () => {
  it.each([
    'scoped override',
    'configured scope',
    'third-party',
    'legacy',
    '401',
    '403',
  ])(
    'routes template requests using %s and reports download errors',
    { timeout: 60_000 },
    async (mode) => {
      // setup-node writes @nocobase:registry into its user config. npm prefers that scope
      // over --registry, so this network fixture must not inherit runner or user config.
      const npmConfig = await mkdtemp(
        path.join(os.tmpdir(), 'create-app-npm-config-'),
      );
      created.push(npmConfig);
      for (const config of ['userconfig', 'globalconfig']) {
        const filename = path.join(npmConfig, `${config}.npmrc`);
        await writeFile(filename, '');
        vi.stubEnv(`npm_config_${config}`, filename);
        vi.stubEnv(`NPM_CONFIG_${config.toUpperCase()}`, filename);
      }
      const requests: string[] = [];
      const registry = createServer((request, response) => {
        requests.push(request.url ?? '');
        response.writeHead(mode === '401' ? 401 : mode === '403' ? 403 : 404, {
          'content-type': 'application/json',
          ...(mode === '401'
            ? { 'www-authenticate': 'Bearer realm="nocobase-pro-registry"' }
            : {}),
        });
        response.end(JSON.stringify({ error: 'Not found' }));
      });
      await new Promise<void>((resolve, reject) => {
        registry.once('error', reject);
        registry.listen(0, '127.0.0.1', resolve);
      });
      try {
        const { port } = registry.address() as AddressInfo;
        const registryUrl = `http://127.0.0.1:${port}/`;
        const source =
          mode === 'third-party' || mode === 'legacy'
            ? '@other/template-probe'
            : '@nocobase/this-template-does-not-exist';
        const userConfig = path.join(npmConfig, 'userconfig.npmrc');
        await writeFile(
          userConfig,
          `registry=${registryUrl}\n@nocobase:registry=${mode === 'scoped override' ? 'http://127.0.0.1:1/' : registryUrl}\n`,
        );
        vi.stubEnv(
          'npm_config_registry',
          mode === 'legacy' ? 'http://127.0.0.1:1/' : registryUrl,
        );
        vi.stubEnv(
          'NPM_CONFIG_REGISTRY',
          mode === 'legacy' ? 'http://127.0.0.1:1/' : registryUrl,
        );
        await expect(
          downloadTemplate({
            source,
            ...(mode === 'legacy' ? { legacyRegistry: registryUrl } : {}),
            nocobaseRegistry:
              mode === 'configured scope'
                ? undefined
                : mode === 'third-party'
                  ? 'http://127.0.0.1:1/'
                  : registryUrl,
          }),
        ).rejects.toThrow(
          mode === '403'
            ? new RegExp(`${mode}.*GET ${registryUrl}`, 'u')
            : source,
        );
        expect(requests.map((url) => decodeURIComponent(url))).toContain(
          `/${source}`,
        );
      } finally {
        await new Promise<void>((resolve, reject) => {
          registry.close((error) => (error ? reject(error) : resolve()));
        });
      }
    },
  );

  it('downloads the original scenario on the same channel when Enterprise predates presets', async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'create-app-old-edition-'),
    );
    created.push(directory);
    const packageDir = path.join(directory, 'package');
    await mkdir(packageDir);
    const archives = new Map<string, Buffer>();
    for (const suffix of ['enterprise', 'sub-app']) {
      const name = '@nocobase/app-template-' + suffix;
      await writeFile(
        path.join(packageDir, 'package.json'),
        JSON.stringify({ name, version: '1.0.0' }),
      );
      archives.set(
        name,
        execFileSync('tar', ['-czf', '-', '-C', directory, 'package']),
      );
    }
    const registry = createServer((request, response) => {
      const target = decodeURIComponent(request.url ?? '');
      const name = target.slice(1).replace(/\.tgz$/u, '');
      const archive = archives.get(name);
      if (!archive) {
        response.writeHead(404);
        response.end();
        return;
      }
      if (target.endsWith('.tgz')) {
        response.end(archive);
        return;
      }
      const url =
        'http://127.0.0.1:' +
        (registry.address() as AddressInfo).port +
        target +
        '.tgz';
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          name,
          'dist-tags': { beta: '1.0.0' },
          versions: {
            '1.0.0': {
              name,
              version: '1.0.0',
              dist: {
                tarball: url,
                shasum: createHash('sha1').update(archive).digest('hex'),
              },
            },
          },
        }),
      );
    });
    await new Promise<void>((resolve) =>
      registry.listen(0, '127.0.0.1', resolve),
    );
    try {
      const result = await downloadTemplate({
        source: '@nocobase/app-template-enterprise@beta',
        preset: 'sub-app',
        nocobaseRegistry:
          'http://127.0.0.1:' + (registry.address() as AddressInfo).port + '/',
      });
      created.push(result.directory);
      expect(result.name).toBe('@nocobase/app-template-sub-app');
    } finally {
      await new Promise<void>((resolve) => registry.close(() => resolve()));
    }
  });

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

describe('Enterprise presets', () => {
  it('materializes only the selected source and runtime plugins before scaffolding', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'enterprise-preset-'));
    created.push(root);
    const content = "export default 'platform';";
    const after = createHash('sha256').update(content).digest('hex');
    await mkdir(path.join(root, 'presets/content'), { recursive: true });
    await writeFile(path.join(root, 'presets/content', after), content);
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        nocobase: { presets: ['sub-app'] },
        dependencies: {},
        devDependencies: { sso: '1', cli: '2' },
      }),
    );
    await writeFile(
      path.join(root, 'presets/sub-app.json'),
      JSON.stringify({
        format: 1,
        files: { 'client/login.ts': { before: null, after } },
        dependencies: { sso: '1' },
        devDependencies: {},
      }),
    );
    expect(await applyTemplatePreset(root, 'multi-app')).toBe(false);
    expect(await applyTemplatePreset(root, 'sub-app')).toBe(true);
    expect(await readFile(path.join(root, 'client/login.ts'), 'utf8')).toBe(
      content,
    );
    expect(
      JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')),
    ).toMatchObject({
      nocobase: { capabilities: ['sub-app'] },
      dependencies: { sso: '1' },
      devDependencies: { cli: '2' },
    });
    expect(
      JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
        .devDependencies,
    ).not.toHaveProperty('sso');
    await expect(applyTemplatePreset(root, 'sub-app')).rejects.toThrow(
      'Template and preset disagree',
    );
  });
});
