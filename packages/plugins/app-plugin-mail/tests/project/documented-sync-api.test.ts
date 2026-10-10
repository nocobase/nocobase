import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('typechecks the published Provider and checkpoint consumer examples against public Server exports', () => {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const documentation = readFileSync(
    resolve(
      packageRoot,
      'skills/nocobase-app-plugin-mail/references/message-sync-events.md',
    ),
    'utf8',
  );
  const examples = [...documentation.matchAll(/```ts\n([\s\S]*?)\n```/g)].map(
    (match) => match[1],
  );
  expect(examples).toHaveLength(2);
  const config = ts.readConfigFile(
    resolve(packageRoot, 'tsconfig.json'),
    ts.sys.readFile,
  );
  expect(config.error).toBeUndefined();
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    packageRoot,
  );
  const options: ts.CompilerOptions = {
    ...parsed.options,
    noEmit: true,
    incremental: false,
    tsBuildInfoFile: undefined,
  };
  const host = ts.createCompilerHost(options);
  const sourceFiles = new Map(
    examples.map((example, index) => [
      resolve(packageRoot, `server/__documented_sync_example_${index}.ts`),
      example,
    ]),
  );
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (
    path,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) => {
    const example = sourceFiles.get(path);
    return example === undefined
      ? originalGetSourceFile(
          path,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        )
      : ts.createSourceFile(path, example, languageVersion, true);
  };
  const program = ts.createProgram([...sourceFiles.keys()], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => packageRoot,
      getCanonicalFileName: (path) => path,
      getNewLine: () => '\n',
    }),
  ).toBe('');
}, 60_000);
