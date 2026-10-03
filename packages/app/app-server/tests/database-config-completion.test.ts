// db-test-portability: dialect-specific — completes each dialect's configuration
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('completes registered dialects and fields, including multiple connections', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const file = path.join(root, 'tests/database-config.virtual.ts');
  const config = ts.getParsedCommandLineOfConfigFile(
    path.join(root, 'tsconfig.json'),
    { isolatedDeclarations: false },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        );
      },
    },
  );
  if (!config) throw new Error('Cannot load TypeScript configuration.');
  let source = `
    import sqlite from '@nocobase/db-sqlite';
    import postgres from '@nocobase/db-postgres';
    import { defineAppDatabaseConfig } from '../src/database/index.js';
    export default defineAppDatabaseConfig((runtime) => ({
      drivers: { sqlite, postgres },
      connections: {
        main: { dialect: '', debug: false },
      },
    }));
  `;
  let version = 0;
  const service = ts.createLanguageService({
    getScriptFileNames: () => [file],
    getScriptVersion: () => String(version),
    getScriptSnapshot: (filename) => {
      const text = filename === file ? source : ts.sys.readFile(filename);
      return text === undefined
        ? undefined
        : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => root,
    getCompilationSettings: () => config.options,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  });
  try {
    const dialects = service
      .getCompletionsAtPosition(
        file,
        source.indexOf("dialect: ''") + "dialect: '".length,
        {},
      )
      ?.entries.map((entry) => entry.name);
    expect(dialects?.sort()).toEqual(['postgres', 'sqlite']);

    source = source.replace(
      "main: { dialect: '', debug: false },",
      `main: { dialect: 'postgres', debug: false },
       cache: { dialect: 'sqlite', filename: runtime.paths.storage('cache.sqlite') },`,
    );
    version += 1;
    const fields = service
      .getCompletionsAtPosition(file, source.indexOf('debug: false'), {})
      ?.entries.map((entry) => entry.name);
    expect(fields).toEqual(
      expect.arrayContaining(['host', 'port', 'schema', 'ssl']),
    );
    expect(fields).not.toContain('filename');
    expect(service.getSemanticDiagnostics(file)).toEqual([]);

    source = source.replace(
      "dialect: 'postgres', debug: false",
      "dialect: 'sqlite', debug: false, filename: ':memory:'",
    );
    version += 1;
    const sqliteFields = service
      .getCompletionsAtPosition(file, source.indexOf('debug: false'), {})
      ?.entries.map((entry) => entry.name);
    expect(sqliteFields).not.toContain('host');
    expect(service.getSemanticDiagnostics(file)).toEqual([]);
    const program = service.getProgram();
    const sourceFile = program?.getSourceFile(file);
    if (!program || !sourceFile)
      throw new Error('Missing configuration source.');
    expect(program.getDeclarationDiagnostics(sourceFile)).toEqual([]);
  } finally {
    service.dispose();
  }
});
