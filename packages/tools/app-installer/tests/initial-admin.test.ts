import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readInitialAdmin } from '../src/lib/initial-admin.ts';

let dir: string;
let config: string;
let example: string;

const section = (password: string) =>
  `users:\n  initialAdmin:\n    username: nocobase\n    email: admin@nocobase.com\n    password: ${password}\n`;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'app-installer-admin-'));
  config = path.join(dir, 'config.yml');
  example = path.join(dir, 'config.example.yml');
  await writeFile(example, section('admin123'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('readInitialAdmin', () => {
  it('names the account and says the password is still the template default', async () => {
    await writeFile(config, section('admin123'));
    expect(await readInitialAdmin(config, example)).toEqual({
      key: 'users.initialAdmin',
      username: 'nocobase',
      email: 'admin@nocobase.com',
      defaultPassword: true,
    });
  });

  it('tells a replaced password apart without returning it', async () => {
    await writeFile(config, section('"a quoted: secret"'));
    const admin = await readInitialAdmin(config, example);
    expect(admin.defaultPassword).toBe(false);
    expect(JSON.stringify(admin)).not.toContain('secret');
  });

  it('reports what it cannot read as unknown rather than failing the install', async () => {
    await writeFile(config, 'auth:\n  secret: x\n');
    expect(
      await readInitialAdmin(config, path.join(dir, 'missing.yml')),
    ).toEqual({
      key: 'users.initialAdmin',
      username: null,
      email: null,
      defaultPassword: null,
    });
    await writeFile(config, 'users: [unclosed');
    expect((await readInitialAdmin(config, example)).username).toBeNull();
  });
});
