import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../..');
const filename = path.join(root, 'tests', 'job-contract.ts');
const prelude = `
import { Job, type JobClass, type JobEvent, type JobExecutor, type JobExecutorService } from '../src/index.js';
declare const executor: JobExecutor;
declare const service: JobExecutorService;
interface Payload { value: number; }
class Valid extends Job<Payload> {
  static readonly jobName: string = 'valid';
  async execute(): Promise<void> { this.payload.value.toFixed(); }
}
const validClass: JobClass<Payload> = Valid;
executor.registerJob(validClass);
`;

function compile(body: string): readonly ts.Diagnostic[] {
  const config = ts.readConfigFile(
    path.join(root, 'tsconfig.json'),
    ts.sys.readFile,
  );
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
    );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const options: ts.CompilerOptions = {
    ...parsed.options,
    rootDir: root,
    noEmit: true,
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (
    name,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    name === filename
      ? ts.createSourceFile(name, prelude + body, languageVersion, true)
      : original(name, languageVersion, onError, shouldCreateNewSourceFile);
  return ts.getPreEmitDiagnostics(ts.createProgram([filename], options, host));
}

describe('public one-off job TypeScript contract', () => {
  it('compiles payload-specific constructors and instance submission under the real strict library configuration', () => {
    const diagnostics = compile(`
const jobClass: JobClass<Payload, Valid> = Valid;
executor.registerJob(jobClass);
executor.registerJob(Valid);
void executor.addJob(new Valid({ value: 1 }));
const jobs: JobExecutor = service.getJobExecutor('scope', 'named');
void jobs.setup({ consume: false });
const unsubscribe: () => void = jobs.subscribe((event: JobEvent) => {
  event.attempt.toFixed();
  if (event.name === 'JobError') { event.error.message.toUpperCase(); event.reason.toUpperCase(); }
});
unsubscribe();
class WithoutStatic extends Job<Payload> { async execute(): Promise<void> {} }
// Instance submission cannot express constructor static fields; runtime registration checks them.
void executor.addJob(new WithoutStatic({ value: 1 }));
`);
    expect(
      diagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      ),
    ).toEqual([]);
  });

  it('rejects missing static identity, abstract or dependency-requiring constructors, invalid payload and overrides', () => {
    const diagnostics = compile(`
class Missing extends Job<Payload> { async execute(): Promise<void> {} }
class NeedsDependency extends Job<Payload> {
  static readonly jobName: string = 'dependency';
  constructor(payload: Payload, dependency: string) { super(payload); dependency.toUpperCase(); }
  async execute(): Promise<void> {}
}
abstract class Abstract extends Job<Payload> { static readonly jobName: string = 'abstract'; }
executor.registerJob(Missing);
executor.registerJob(NeedsDependency);
executor.registerJob(Abstract);
void executor.addJob(new Valid({ value: 'wrong' }));
service.getJobExecutor('scope', 'name', {});
const error: JobEvent = { name: 'JobError', jobId: 'id', jobName: 'valid', enqueuedAt: new Date(), runAt: new Date(), attempt: 1 };
void error;
`);
    expect(diagnostics).toHaveLength(6);
    expect(
      diagnostics.every((diagnostic) => diagnostic.file?.fileName === filename),
    ).toBe(true);
    const messages = diagnostics
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      )
      .join('\n');
    expect(messages).toContain('jobName');
    expect(messages).toContain('NeedsDependency');
    expect(messages).toContain('abstract');
    expect(messages).toContain('number');
    expect(messages).toContain('arguments');
    expect(messages).toContain('reason');
  });
});
