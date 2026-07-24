/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete';
import { type Diagnostic, linter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { type Tooltip, hoverTooltip } from '@codemirror/view';

import type { RunJSTypeLibraryRegistry } from './typescriptLibraryRegistry';
import type { TypeScriptWorkerOwner } from './sharedTypeScriptWorkerOwner';

export type { TypeScriptWorkerFactory } from './typescriptWorkerProjectSession';
import type { TypeScriptWorkerFactory } from './typescriptWorkerProjectSession';

export interface CodeEditorTypeScriptFile {
  path: string;
  content: string;
  revision?: number;
}

export interface CodeEditorTypeScriptProject {
  currentFilePath: string;
  files: CodeEditorTypeScriptFile[];
  declarationFiles?: CodeEditorTypeScriptFile[];
  ignoredDiagnosticCodes?: number[];
  typeLibraryIds?: string[];
  typeLibraryRegistry?: RunJSTypeLibraryRegistry;
  compilerOptions?: Partial<import('typescript').CompilerOptions>;
  runJSContext?: {
    modelUse?: string;
    globalContextType?: string;
  };
  onInternalError?: (error: CodeEditorTypeScriptProjectInternalError) => void;
  rewriteBuiltInAutoImports?: boolean;
  projectRevision?: number;
  documentRevision?: number;
}

export interface CodeEditorTypeScriptProjectRef {
  current?: CodeEditorTypeScriptProject;
}

export interface CodeEditorTypeScriptDiagnostic extends Diagnostic {
  code: number;
}

export type CodeEditorTypeScriptProjectInternalErrorCode = 'TYPE_LIBRARY_LOAD_FAILED' | 'TYPE_LIBRARY_FILE_CONFLICT';

export interface CodeEditorTypeScriptProjectInternalError {
  cause: unknown;
  code: CodeEditorTypeScriptProjectInternalErrorCode;
  message: string;
  packIds: readonly string[];
}

export interface CodeEditorTypeScriptProjectDebugState {
  allFileNames: string[];
  disposed: boolean;
  fileVersions: Record<string, string>;
  immutableFileCount: number;
  immutableSnapshotCreationCount: number;
  languageServiceCreationCount: number;
  rootFileNames: string[];
  structureKey?: string;
}

export interface CodeEditorTypeScriptProjectSession {
  dispose(): void;
  getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit?: boolean,
  ): Promise<CompletionResult | null>;
  getDebugState(): CodeEditorTypeScriptProjectDebugState;
  getDiagnostics(
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptDiagnostic[]>;
  getHover(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptQuickInfoResult | null>;
  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null;
  whenDisposed(): Promise<void>;
}

export interface CodeEditorTypeScriptQuickInfoResult {
  detail: string;
  from: number;
  message: string;
  to: number;
}

type MainThreadRuntime = typeof import('./typescriptProjectRuntime');

const emptyDebugState = (disposed = false): CodeEditorTypeScriptProjectDebugState => ({
  allFileNames: [],
  disposed,
  fileVersions: {},
  immutableFileCount: 0,
  immutableSnapshotCreationCount: 0,
  languageServiceCreationCount: 0,
  rootFileNames: [],
});

class DeferredTypeScriptProjectSession implements CodeEditorTypeScriptProjectSession {
  private disposal: Promise<void> = Promise.resolve();
  private disposed = false;
  private loading: Promise<CodeEditorTypeScriptProjectSession> | null = null;
  private session: CodeEditorTypeScriptProjectSession | null = null;

  constructor(private readonly loader: () => Promise<CodeEditorTypeScriptProjectSession>) {}

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const session = this.session;
    if (session) {
      session.dispose();
      this.disposal = session.whenDisposed();
    } else if (this.loading) {
      this.disposal = this.loading.then(
        (loadingSession) => {
          loadingSession.dispose();
          return loadingSession.whenDisposed();
        },
        () => undefined,
      );
    }
    this.disposal = this.disposal.finally(() => {
      this.loading = null;
      this.session = null;
    });
  }

  async getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit?: boolean,
  ): Promise<CompletionResult | null> {
    const session = await this.getSession();
    return session?.getCompletionResult(project, position, currentFileContent, explicit) ?? null;
  }

  getDebugState(): CodeEditorTypeScriptProjectDebugState {
    return this.session?.getDebugState() || emptyDebugState(this.disposed);
  }

  async getDiagnostics(
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptDiagnostic[]> {
    const session = await this.getSession();
    return (await session?.getDiagnostics(project, currentFileContent)) ?? [];
  }

  async getHover(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptQuickInfoResult | null> {
    const session = await this.getSession();
    return (await session?.getHover(project, position, currentFileContent)) ?? null;
  }

  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null {
    return this.session?.getLastInternalError() || null;
  }

  whenDisposed(): Promise<void> {
    return this.disposal;
  }

  private async getSession(): Promise<CodeEditorTypeScriptProjectSession | null> {
    if (this.disposed) return null;
    if (!this.loading) {
      this.loading = this.loader()
        .then((session) => {
          this.session = session;
          if (this.disposed) session.dispose();
          return session;
        })
        .catch((error: unknown) => {
          this.loading = null;
          throw error;
        });
    }
    const session = await this.loading;
    return this.disposed ? null : session;
  }
}

let loadedMainThreadRuntime: MainThreadRuntime | null = null;

async function createMainThreadSession(): Promise<CodeEditorTypeScriptProjectSession> {
  loadedMainThreadRuntime ||= await import('./typescriptProjectRuntime');
  return loadedMainThreadRuntime.createMainThreadTypeScriptProjectSession();
}

export function createTypeScriptProjectSession(options?: {
  workerFactory?: TypeScriptWorkerFactory;
  workerOwner?: TypeScriptWorkerOwner;
}): CodeEditorTypeScriptProjectSession {
  const fallback = new DeferredTypeScriptProjectSession(createMainThreadSession);
  return new DeferredTypeScriptProjectSession(async () => {
    const workerRuntime = await import('./typescriptWorkerProjectSession').catch(() => null);
    if (!workerRuntime) return fallback;
    return options?.workerFactory || workerRuntime.canUseTypeScriptWorker()
      ? new workerRuntime.WorkerBackedTypeScriptProjectSession(options?.workerFactory, fallback, options?.workerOwner)
      : fallback;
  });
}

let defaultProjectSession = createTypeScriptProjectSession();
let defaultProjectSessionDisposal = Promise.resolve();

function disposeDefaultTypeScriptProjectSession(): void {
  const session = defaultProjectSession;
  session.dispose();
  defaultProjectSessionDisposal = Promise.all([defaultProjectSessionDisposal, session.whenDisposed()]).then(
    () => undefined,
  );
}

export function resetDefaultTypeScriptProjectSession(): void {
  disposeDefaultTypeScriptProjectSession();
  defaultProjectSession = createTypeScriptProjectSession();
}

export async function shutdownDefaultTypeScriptProjectSession(): Promise<void> {
  disposeDefaultTypeScriptProjectSession();
  await defaultProjectSessionDisposal;
}

export function getDefaultTypeScriptProjectSessionDebugStateForTests(): CodeEditorTypeScriptProjectDebugState {
  return defaultProjectSession.getDebugState();
}

export function clearTypeScriptProjectCachesForTests(): void {
  resetDefaultTypeScriptProjectSession();
  loadedMainThreadRuntime?.clearMainThreadTypeScriptProjectCachesForTests();
}

export async function getTypeScriptCompletionResult(
  project: CodeEditorTypeScriptProject,
  position: number,
  currentFileContent?: string,
  explicit = false,
): Promise<CompletionResult | null> {
  return await defaultProjectSession.getCompletionResult(project, position, currentFileContent, explicit);
}

function getWordRange(context: CompletionContext): { from: number; to: number } | null {
  const word = context.matchBefore(/[$_\p{Letter}][$_\p{Letter}\p{Number}]*/u);
  if (word) return { from: word.from, to: word.to };
  if (!context.explicit) return null;
  return { from: context.pos, to: context.pos };
}

export function createTypeScriptCompletionSource(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): CompletionSource {
  const { projectRef, session = defaultProjectSession } = options;

  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const project = projectRef?.current;
    if (!project) return null;
    const range = getWordRange(context);
    if (!range) return null;
    try {
      const result = await session.getCompletionResult(
        project,
        context.pos,
        context.state.doc.toString(),
        context.explicit,
      );
      if (!result) return null;
      return {
        ...result,
        from: result.from === context.pos ? range.from : result.from,
        to: result.to === context.pos ? range.to : result.to,
      };
    } catch (_) {
      return null;
    }
  };
}

export async function getTypeScriptProjectDiagnostics(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): Promise<CodeEditorTypeScriptDiagnostic[]> {
  return await defaultProjectSession.getDiagnostics(project, currentFileContent);
}

export function createTypeScriptProjectLinter(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): Extension {
  const { projectRef, session = defaultProjectSession } = options;
  return linter(async (view) => {
    const project = projectRef?.current;
    if (!project) return [];
    try {
      return await session.getDiagnostics(project, view.state.doc.toString());
    } catch (_) {
      return [];
    }
  });
}

function createHoverTooltip(message: string, detail?: string): Tooltip['create'] {
  return () => {
    const dom = document.createElement('div');
    dom.style.maxWidth = '420px';
    dom.style.padding = '6px 8px';
    dom.style.whiteSpace = 'pre-wrap';
    dom.textContent = detail ? `${message}\n\n${detail}` : message;
    return { dom };
  };
}

export function createTypeScriptHoverTooltip(options: {
  projectRef?: CodeEditorTypeScriptProjectRef;
  session?: CodeEditorTypeScriptProjectSession;
}): Extension {
  const { projectRef, session = defaultProjectSession } = options;
  return hoverTooltip(async (view, position) => {
    const project = projectRef?.current;
    if (!project) return null;
    try {
      const quickInfo = await session.getHover(project, position, view.state.doc.toString());
      if (!quickInfo) return null;
      return {
        create: createHoverTooltip(quickInfo.message, quickInfo.detail),
        end: quickInfo.to,
        pos: quickInfo.from,
      };
    } catch (_) {
      return null;
    }
  });
}
