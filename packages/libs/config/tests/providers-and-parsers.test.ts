import { describe, expect, it } from 'vitest';

import { Config } from '../src/index.js';
import { dotenvParser } from '../src/parsers/dotenv.js';
import { jsonParser } from '../src/parsers/json.js';
import { yamlParser } from '../src/parsers/yaml.js';
import {
  environmentProvider,
  envBoolean,
  envInteger,
  envStrings,
  envString,
  isSecretPath,
} from '../src/providers/env.js';
import { fileProvider } from '../src/providers/file.js';
import { objectProvider } from '../src/providers/object.js';
import { rawBytesProvider } from '../src/providers/raw.js';

describe('providers and parsers', () => {
  it('parses and serializes JSON and YAML bytes', async () => {
    const json = jsonParser();
    const yaml = yamlParser();
    const config = new Config();

    await config.load(
      rawBytesProvider(new TextEncoder().encode('{"server":{"port":3000}}')),
      json,
    );
    await config.load(
      rawBytesProvider(
        new TextEncoder().encode('server:\n  host: localhost\n'),
      ),
      yaml,
    );

    expect(config.raw()).toEqual({
      server: { port: 3000, host: 'localhost' },
    });
    expect(json.parse(config.serialize(json))).toEqual(config.raw());
    expect(yaml.parse(config.serialize(yaml))).toEqual(config.raw());
  });

  it('maps environment variables without guessing value types', async () => {
    const config = new Config();
    await config.load(
      environmentProvider(
        {
          PORT: '13010',
          DEBUG: 'yes',
          SCHEMAS: 'public, tenant',
          CODE: '00123',
        },
        {
          mappings: {
            PORT: envInteger('server.port'),
            DEBUG: envBoolean('server.debug'),
            SCHEMAS: envStrings('database.schemas'),
            CODE: { path: 'app.code' },
          },
        },
      ),
    );

    expect(config.integer('server.port')).toBe(13010);
    expect(config.boolean('server.debug')).toBe(true);
    expect(config.strings('database.schemas')).toEqual(['public', 'tenant']);
    expect(config.string('app.code')).toBe('00123');
  });

  it('keeps metadata on a mapping without changing how it is read', async () => {
    const mapping = envInteger('server.port', {
      description: 'The port.',
      required: true,
      firstStartOnly: true,
    });
    expect(mapping).toMatchObject({
      path: 'server.port',
      description: 'The port.',
      required: true,
      firstStartOnly: true,
    });
    expect(envString('auth.secret', { generate: 'secret' })).toEqual({
      path: 'auth.secret',
      type: 'string',
      generate: 'secret',
    });
    expect(envStrings('a.b', ';', { secret: true }).secret).toBe(true);
    expect(envBoolean('a.b', { description: 'x' }).description).toBe('x');

    const config = new Config();
    await config.load(
      environmentProvider({ PORT: '80' }, { mappings: { PORT: mapping } }),
    );
    expect(config.integer('server.port')).toBe(80);
  });

  it('tells secret paths from the rest by their last word', () => {
    for (const path of [
      'auth.secret',
      'users.initialAdmin.password',
      'database.connections.main.password',
      'ai.apiKeys',
      'oauth.clientSecret',
      'agents.secretsKey',
    ]) {
      expect([path, isSecretPath(path)]).toEqual([path, true]);
    }
    for (const path of [
      'database.connections.main.host',
      'jwt.publicKey',
      'collection.primaryKey',
      'users.initialAdmin.username',
      'app.publicOrigin',
    ]) {
      expect([path, isSecretPath(path)]).toEqual([path, false]);
    }
  });

  it('supports flat object maps and dotenv documents', async () => {
    const config = new Config();
    await config.load(
      objectProvider(
        { 'server.port': 3000, 'server.host': 'localhost' },
        { flat: true },
      ),
    );

    const dotenv = dotenvParser();
    expect(
      dotenv.parse(new TextEncoder().encode('PORT=3000\nNAME="NocoBase"\n')),
    ).toEqual({ PORT: '3000', NAME: 'NocoBase' });
    expect(config.integer('server.port')).toBe(3000);
  });

  it('reads file bytes without owning file watching', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'nocobase-config-'));
    const filePath = path.join(directory, 'config.json');
    await writeFile(filePath, '{"server":{"port":3000}}');

    try {
      const provider = fileProvider(filePath);
      const config = new Config();
      await config.load(provider, jsonParser());

      expect(config.integer('server.port')).toBe(3000);
      expect('watch' in provider).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('allows an optional file to be absent', async () => {
    const provider = fileProvider('/missing/optional-config.yml', {
      optional: true,
    });
    const config = new Config();

    await expect(config.load(provider, jsonParser())).resolves.toBeUndefined();
    expect(config.raw()).toEqual({});
  });
});
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

it('rejects duplicate nested YAML Channel names instead of overwriting configuration', () => {
  const input = new TextEncoder().encode(
    'notification:\n  channels:\n    inbox:\n      provider: in-app\n    inbox:\n      provider: smtp\n',
  );
  expect(() => yamlParser().parse(input)).toThrow(/unique|duplicate/i);
});
