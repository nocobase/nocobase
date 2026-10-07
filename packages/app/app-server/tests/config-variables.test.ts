import { describe, expect, it } from 'vitest';

import {
  buildVariablesManifest,
  envBoolean,
  envString,
  isExamplePlaceholder,
  requiredOf,
} from '../src/config/index.js';
import { connectionEnvironment } from '../src/database/index.js';
import { envSecretKeys } from '../src/secrets/index.js';

describe('requiredOf', () => {
  const smtp = envString('mail.smtp.password');

  it('requires a variable nothing else gives a value', () => {
    expect(requiredOf(smtp, {}, undefined)).toBe(true);
  });

  it('does not require a variable with a code default or a real example value', () => {
    expect(requiredOf(smtp, { mail: { smtp: { password: 'x' } } }, {})).toBe(
      false,
    );
    expect(requiredOf(smtp, {}, { mail: { smtp: { password: 'x' } } })).toBe(
      false,
    );
  });

  it('treats a known example placeholder as no value', () => {
    expect(
      requiredOf(
        envString('users.initialAdmin.password'),
        {},
        { users: { initialAdmin: { password: 'admin123' } } },
      ),
    ).toBe(true);
    expect(
      requiredOf(
        envSecretKeys('secrets.keys'),
        { secrets: { keys: [] } },
        {
          secrets: {
            keys: [{ version: 1, key: 'replace-with-a-unique-secret' }],
          },
        },
      ),
    ).toBe(true);
  });

  it('does not require a variable the deployment can generate, or one marked optional', () => {
    expect(
      requiredOf(envString('auth.secret', { generate: 'secret' }), {}, {}),
    ).toBe(false);
    expect(requiredOf(envString('a.b', { required: false }), {}, {})).toBe(
      false,
    );
    expect(
      requiredOf(envString('a.b', { required: true }), { a: { b: 1 } }, {}),
    ).toBe(true);
  });

  it('recognizes placeholders nested in a value', () => {
    expect(
      isExamplePlaceholder([{ key: 'replace-with-a-unique-secret' }]),
    ).toBe(true);
    expect(isExamplePlaceholder({ password: 'real' })).toBe(false);
  });
});

describe('buildVariablesManifest', () => {
  it('lists declared and runtime variables with their metadata', () => {
    const database = Object.fromEntries(
      Object.entries(connectionEnvironment('main')).map(([name, mapping]) => [
        name,
        { ...mapping, path: `database.${mapping.path}` },
      ]),
    );
    const manifest = buildVariablesManifest({
      app: { name: 'crm', version: '1.0.0' },
      generatedAt: new Date('2026-10-06T00:00:00Z'),
      variables: {
        ...database,
        SMTP_PASSWORD: envString('mail.smtp.password'),
        APP_SAMPLE_DATA: envBoolean('app.sampleData', {
          firstStartOnly: true,
          required: false,
        }),
      },
      defaults: {
        database: {
          connections: { main: { dialect: 'postgres', host: 'db.internal' } },
        },
      },
      example: { mail: { smtp: { password: 'admin123' } } },
    });

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      app: { name: 'crm', version: '1.0.0' },
      generatedAt: '2026-10-06T00:00:00.000Z',
    });
    const byName = new Map(
      manifest.variables.map((entry) => [entry.name, entry]),
    );
    expect(byName.get('DB_PASSWORD')).toMatchObject({
      path: 'database.connections.main.password',
      type: 'string',
      secret: true,
      required: false,
      hasDefault: false,
      generate: null,
    });
    expect(byName.get('DB_DIALECT')).toMatchObject({
      hasDefault: true,
      secret: false,
    });
    expect(byName.get('DB_PORT')?.type).toBe('integer');
    expect(byName.get('SMTP_PASSWORD')).toMatchObject({
      secret: true,
      required: true,
      exampleProvided: false,
    });
    expect(byName.get('APP_SAMPLE_DATA')).toMatchObject({
      type: 'boolean',
      firstStartOnly: true,
      required: false,
    });
    expect(byName.get('APP_BASE_PATH')).toMatchObject({
      runtime: true,
      required: false,
    });
  });
});
