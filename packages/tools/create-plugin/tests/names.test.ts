import { describe, expect, it } from 'vitest';

import { createPluginNames, normalizePluginName } from '../src/lib/names.ts';

describe('normalizePluginName', () => {
  it.each([
    ['audit-log', 'audit-log'],
    ['app-plugin-audit-log', 'audit-log'],
    ['@nocobase/app-plugin-audit-log', 'audit-log'],
    ['@my-app/app-plugin-audit-log', 'audit-log'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizePluginName(input)).toBe(expected);
  });

  it.each(['', '../escape', 'AuditLog', 'audit--log', 'audit/log'])(
    'rejects unsafe name %s',
    (name) => {
      expect(() => normalizePluginName(name)).toThrow(
        'Plugin name must start with a lowercase letter',
      );
    },
  );

  it('rejects names that exceed the Agent Skill name limit', () => {
    expect(() => normalizePluginName(`a${'b'.repeat(44)}`)).toThrow(
      'the generated Agent Skill name must not exceed 64 characters',
    );
  });
});

describe('createPluginNames', () => {
  it('keeps a consumer scope while deriving local filenames', () => {
    expect(createPluginNames('@my-app/app-plugin-audit-log')).toMatchObject({
      packageName: '@my-app/app-plugin-audit-log',
      shortName: 'audit-log',
      directoryName: 'app-plugin-audit-log',
    });
  });
  it('derives package, directory, collection, and TypeScript names', () => {
    expect(createPluginNames('audit-log')).toEqual({
      collectionName: 'appPluginAuditLogRecords',
      directoryName: 'app-plugin-audit-log',
      moduleName: 'auditLog',
      packageName: '@nocobase/app-plugin-audit-log',
      shortName: 'audit-log',
      symbolName: 'AuditLog',
    });
  });
});
