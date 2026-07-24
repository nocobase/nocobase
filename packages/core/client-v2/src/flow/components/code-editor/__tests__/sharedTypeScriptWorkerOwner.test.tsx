/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { TypeScriptWorkerOwnerProvider, useTypeScriptWorkerOwner } from '../TypeScriptWorkerOwnerProvider';
import { SharedTypeScriptWorkerOwner } from '../sharedTypeScriptWorkerOwner';
import {
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProject,
  type CodeEditorTypeScriptProjectSession,
} from '../typescriptProject';
import { TypeScriptWorkerClient, type TypeScriptWorkerFactory } from '../typescriptWorkerProjectSession';
import {
  RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
  type TypeScriptWorkerIncomingMessage,
  type TypeScriptWorkerOutgoingMessage,
  type TypeScriptWorkerRequest,
  type TypeScriptWorkerResponse,
} from '../typescriptWorkerProtocol';
import { shutdownTypeScriptProjectSessionSuite } from './helpers/withTypeScriptProjectSession';

type ErrorListener = (event: ErrorEvent) => void;
type MessageListener = (event: MessageEvent<TypeScriptWorkerOutgoingMessage>) => void;

class FakeWorker {
  private readonly errorListeners: ErrorListener[] = [];
  private readonly messageListeners: MessageListener[] = [];
  private heldResponse: TypeScriptWorkerResponse | null = null;
  readonly messages: TypeScriptWorkerRequest[] = [];
  terminateCount = 0;

  constructor(
    private crashOnFirstDiagnostics = false,
    private holdFirstResponse = false,
  ) {}

  addEventListener(type: 'error' | 'message', listener: ErrorListener | MessageListener): void {
    if (type === 'error') this.errorListeners.push(listener as ErrorListener);
    else this.messageListeners.push(listener as MessageListener);
  }

  postMessage(message: TypeScriptWorkerIncomingMessage): void {
    if (message.kind === 'load-pack-result') return;
    this.messages.push(message);
    if (this.crashOnFirstDiagnostics && message.kind === 'diagnostics') {
      this.crashOnFirstDiagnostics = false;
      queueMicrotask(() => {
        for (const listener of this.errorListeners) listener({ message: 'simulated crash' } as ErrorEvent);
      });
      return;
    }
    const response = this.response(message);
    if (this.holdFirstResponse) {
      this.holdFirstResponse = false;
      this.heldResponse = response;
      return;
    }
    queueMicrotask(() => this.emit(response));
  }

  releaseHeldResponse(): void {
    const response = this.heldResponse;
    this.heldResponse = null;
    if (response) this.emit(response);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  private emit(response: TypeScriptWorkerResponse): void {
    for (const listener of this.messageListeners) {
      listener({ data: response } as MessageEvent<TypeScriptWorkerOutgoingMessage>);
    }
  }

  private response(request: TypeScriptWorkerRequest): TypeScriptWorkerResponse {
    const common = {
      documentVersion: request.documentVersion,
      projectId: request.projectId,
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
      requestId: request.requestId,
    };
    if (request.kind === 'sync') return { ...common, kind: 'synced', result: null };
    if (request.kind === 'diagnostics') return { ...common, kind: 'diagnostics-result', result: [] };
    if (request.kind === 'completion') return { ...common, kind: 'completion-result', result: null };
    if (request.kind === 'hover') return { ...common, kind: 'hover-result', result: null };
    if (request.kind === 'dispose') return { ...common, kind: 'disposed', result: null };
    return {
      ...common,
      kind: 'debug-result',
      result: {
        actualLoadIds: [],
        allFileNames: [],
        cacheHitIds: [],
        dependencyFileCount: 0,
        disposed: false,
        fileVersions: {},
        immutableCacheCharacterCount: 0,
        immutableFileCount: 0,
        immutableSnapshotCreationCount: 0,
        languageServiceCreationCount: 0,
        packRequestIds: [],
        peakDeclarationCharacterCount: 0,
        programSourceFileCount: 0,
        rootFileNames: [],
      },
    };
  }
}

const project: CodeEditorTypeScriptProject = {
  currentFilePath: 'src/main.ts',
  files: [{ content: 'const answer: number = 42;', path: 'src/main.ts' }],
};

const clients = new Set<TypeScriptWorkerClient>();
const trackedOwners = new Set<SharedTypeScriptWorkerOwner>();
const sessions = new Set<CodeEditorTypeScriptProjectSession>();

function owner(): SharedTypeScriptWorkerOwner {
  const current = new SharedTypeScriptWorkerOwner();
  trackedOwners.add(current);
  return current;
}

function session(owner: SharedTypeScriptWorkerOwner, factory: TypeScriptWorkerFactory) {
  const current = createTypeScriptProjectSession({ workerFactory: factory, workerOwner: owner });
  sessions.add(current);
  return current;
}

async function dispose(...sessions: CodeEditorTypeScriptProjectSession[]) {
  for (const current of sessions) current.dispose();
  await Promise.all(sessions.map((current) => current.whenDisposed()));
}

afterEach(async () => {
  await dispose(...sessions);
  sessions.clear();
  for (const client of clients) client.stop();
  clients.clear();
  for (const current of trackedOwners) current.dispose();
  trackedOwners.clear();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

describe('SharedTypeScriptWorkerOwner', () => {
  it('provides one lazy owner per application provider', () => {
    const owners: SharedTypeScriptWorkerOwner[] = [];
    const Probe = () => {
      const owner = useTypeScriptWorkerOwner();
      if (owner) owners.push(owner as SharedTypeScriptWorkerOwner);
      return null;
    };
    const firstApp = render(
      <TypeScriptWorkerOwnerProvider>
        <Probe />
        <Probe />
      </TypeScriptWorkerOwnerProvider>,
    );

    expect(owners[0]).toBe(owners[1]);
    const disposeResource = vi.fn();
    owners[0].getResource(() => ({ dispose: disposeResource }));
    firstApp.unmount();
    expect(disposeResource).toHaveBeenCalledTimes(1);

    const previousOwner = owners[0];
    owners.length = 0;
    const secondApp = render(
      <TypeScriptWorkerOwnerProvider>
        <Probe />
      </TypeScriptWorkerOwnerProvider>,
    );
    expect(owners[0]).not.toBe(previousOwner);
    secondApp.unmount();
  });

  it('shares one worker until the last project is disposed', async () => {
    const workers: FakeWorker[] = [];
    const factory = () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    };
    const sharedOwner = owner();
    const first = session(sharedOwner, factory);
    const second = session(sharedOwner, factory);

    await first.getDiagnostics(project);
    await second.getDiagnostics(project);
    expect(workers).toHaveLength(1);
    expect(new Set(workers[0].messages.map((message) => message.projectId)).size).toBe(2);

    await dispose(first);
    expect(workers[0].terminateCount).toBe(0);
    await second.getDiagnostics(project);
    await dispose(second);
    expect(workers[0].terminateCount).toBe(1);

    const third = session(sharedOwner, factory);
    await third.getDiagnostics(project);
    expect(workers).toHaveLength(2);
    await dispose(third);
    sharedOwner.dispose();
  });

  it('recovers active projects after the shared worker crashes', async () => {
    const workers: FakeWorker[] = [];
    const factory = () => {
      const worker = new FakeWorker(workers.length === 0);
      workers.push(worker);
      return worker;
    };
    const sharedOwner = owner();
    const first = session(sharedOwner, factory);
    const second = session(sharedOwner, factory);
    const firstProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/first.ts',
      files: [{ content: 'const first: 1 = 1;', path: 'src/first.ts' }],
    };
    const secondProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/second.ts',
      files: [{ content: 'const second: 2 = 2;', path: 'src/second.ts' }],
    };

    await expect(
      Promise.all([first.getDiagnostics(firstProject), second.getDiagnostics(secondProject)]),
    ).resolves.toEqual([[], []]);
    expect(workers).toHaveLength(2);
    const recoveredSyncs = workers[1].messages.filter(
      (message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync',
    );
    expect(
      recoveredSyncs
        .map((message) => ({ currentFilePath: message.snapshot?.currentFilePath, files: message.snapshot?.files }))
        .sort((left, right) => String(left.currentFilePath).localeCompare(String(right.currentFilePath))),
    ).toEqual([
      { currentFilePath: 'src/first.ts', files: firstProject.files },
      { currentFilePath: 'src/second.ts', files: secondProject.files },
    ]);
    expect(
      new Set(
        workers[1].messages.filter((message) => message.kind === 'diagnostics').map((message) => message.projectId),
      ),
    ).toEqual(new Set(recoveredSyncs.map((message) => message.projectId)));

    await dispose(first, second);
    sharedOwner.dispose();
  });

  it('keeps owners from separate applications isolated', async () => {
    const workers: FakeWorker[] = [];
    const factory = () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    };
    const firstOwner = owner();
    const secondOwner = owner();
    const first = session(firstOwner, factory);
    const second = session(secondOwner, factory);

    await Promise.all([first.getDiagnostics(project), second.getDiagnostics(project)]);
    expect(workers).toHaveLength(2);
    firstOwner.dispose();
    expect(workers[0].terminateCount).toBe(1);
    expect(workers[1].terminateCount).toBe(0);
    await second.getDiagnostics(project);

    await dispose(first, second);
    secondOwner.dispose();
  });

  it('round-robins queued requests between projects', async () => {
    const worker = new FakeWorker(false, true);
    const client = new TypeScriptWorkerClient(() => worker);
    clients.add(client);
    const first = client.request({ documentVersion: 1, kind: 'debug', projectId: 'project-a' });
    const second = client.request({ documentVersion: 1, kind: 'debug', projectId: 'project-a' });
    const third = client.request({ documentVersion: 1, kind: 'debug', projectId: 'project-b' });

    await vi.waitFor(() => {
      expect(worker.messages.map((message) => message.projectId)).toEqual(['project-a', 'project-b', 'project-a']);
    });
    worker.releaseHeldResponse();
    await Promise.all([first, second, third]);
    expect(worker.messages.map((message) => message.projectId)).toEqual(['project-a', 'project-b', 'project-a']);
    client.stop();
  });
});
