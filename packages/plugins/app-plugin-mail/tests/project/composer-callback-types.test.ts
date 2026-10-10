import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('keeps public completion callbacks compatible with legacy discarded return values', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const file = path.join(root, 'tests/project/completion-consumer.ts');
  const source = `
    import type {
      MailComposerCompletionCallback,
      MailComposerCompletionDetails,
      MailComposerProps,
    } from '@nocobase/app-plugin-mail/client/components';
    const activities: string[] = [];
    const shorthand: MailComposerProps['onComplete'] = result => activities.push(result);
    const asyncValue: MailComposerCompletionCallback = async result => ({ result });
    const asyncVoid: MailComposerCompletionCallback = async (result, _rejected, _error, details) => {
      const snapshot: MailComposerCompletionDetails | undefined = details;
      if (snapshot && snapshot.kind !== 'draft') {
        activities.push(snapshot.input.accountId, snapshot.submissions[0]?.id ?? result);
      }
    };
    void [shorthand, asyncValue, asyncVoid];
  `;
  const options: ts.CompilerOptions = {
    ...parsed.options,
    noEmit: true,
    incremental: false,
    composite: false,
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const readFile = host.readFile.bind(host);
  host.fileExists = (name) => name === file || fileExists(name);
  host.readFile = (name) => (name === file ? source : readFile(name));
  host.getSourceFile = (
    name,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    name === file
      ? ts.createSourceFile(name, source, languageVersion, true)
      : getSourceFile(
          name,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
  const program = ts.createProgram([file], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    ),
  ).toEqual([]);
}, 30_000);
