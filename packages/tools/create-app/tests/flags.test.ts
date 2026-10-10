import { describe, expect, it } from 'vitest';
import { formatHelp, parseInput } from '../src/lib/flags.ts';

describe('parseInput', () => {
  it('installs and prompts by default, and accepts --json', async () => {
    expect((await parseInput(['crm'])).flags).toMatchObject({
      json: false,
      install: true,
    });
    expect((await parseInput(['crm', '--json'])).flags).toMatchObject({
      json: true,
    });
  });

  /**
   * Choosing a database is `config init`'s job now, and it needs the driver installed first. Leaving the flag parsed
   * but ignored would accept a command that silently did nothing about the database it named.
   */
  it('rejects the dialect flag, which creation no longer decides', async () => {
    await expect(parseInput(['crm', '--dialect=postgres'])).rejects.toThrow();
  });
  /**
   * `pnpm create @nocobase/app crm --template=examples` forwards everything after the package name verbatim, so this is the
   * exact argv the command receives in the documented invocation.
   */
  it('parses the directory argument and the template flag', async () => {
    const input = await parseInput(['crm', '--template=examples']);

    expect(input.directory).toBe('crm');
    expect(input.flags.template).toBe('examples');
  });

  it('accepts the space-separated flag form', async () => {
    const input = await parseInput(['crm', '--template', 'examples']);

    expect(input.flags.template).toBe('examples');
  });

  it('leaves the directory unset when it is omitted, so it can be prompted for', async () => {
    const input = await parseInput([]);

    expect(input.directory).toBeUndefined();
  });

  it('rejects the long-removed database flag', async () => {
    await expect(
      parseInput(['crm', '--db-dialect=postgres']),
    ).rejects.toThrow();
  });

  it('installs by default and honours --no-install', async () => {
    expect((await parseInput(['crm'])).flags.install).toBe(true);
    expect((await parseInput(['crm', '--no-install'])).flags.install).toBe(
      false,
    );
  });

  it('parses the template and registry overrides', async () => {
    const input = await parseInput([
      'crm',
      '--template=./packages/app-template-default',
      '--registry=https://registry.npmjs.org',
    ]);

    expect(input.flags.template).toBe('./packages/app-template-default');
    expect(input.flags.registry).toBe('https://registry.npmjs.org');
  });

  /** The default is a name, so the package it points at stays an implementation detail. */
  it('defaults the template to the default name', async () => {
    expect((await parseInput(['crm'])).flags.template).toBe('default');
  });

  it('defaults the template tag to latest and accepts beta', async () => {
    expect((await parseInput(['crm'])).flags['template-tag']).toBe('latest');
    expect(
      (await parseInput(['crm', '--template-tag=beta'])).flags['template-tag'],
    ).toBe('beta');
  });

  /** oclif validates against the declared options, so a typo fails at parse time rather than at download. */
  it('rejects an unknown template tag', async () => {
    await expect(
      parseInput(['crm', '--template-tag=nightly']),
    ).rejects.toThrow();
  });

  it('supports -h and --version', async () => {
    expect((await parseInput(['-h'])).flags.help).toBe(true);
    expect((await parseInput(['--version'])).flags.version).toBe(true);
  });

  /** Strict parsing turns a typo into an error rather than silently ignoring it. */
  it('rejects an unknown flag', async () => {
    await expect(parseInput(['crm', '--db-type=postgres'])).rejects.toThrow();
  });

  it('rejects a second positional argument', async () => {
    await expect(parseInput(['crm', 'extra'])).rejects.toThrow();
  });
});

describe('formatHelp', () => {
  it('documents the flags and the registry default', () => {
    const help = formatHelp('create-app');

    expect(help).not.toContain('--db-dialect');
    expect(help).toContain('--template-tag');
    expect(help).toContain('default');
    expect(help).toContain('--[no-]install');
    expect(help).toContain('https://registry.npmjs.org');
    expect(help).toContain('create-app crm');
  });
});
