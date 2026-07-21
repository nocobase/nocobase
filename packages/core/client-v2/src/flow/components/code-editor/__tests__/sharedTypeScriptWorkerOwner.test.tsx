/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
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

function session(owner: SharedTypeScriptWorkerOwner, factory: TypeScriptWorkerFactory) {
  return createTypeScriptProjectSession({ workerFactory: factory, workerOwner: owner });
}

async function dispose(...sessions: CodeEditorTypeScriptProjectSession[]) {
  for (const current of sessions) current.dispose();
  await Promise.all(sessions.map((current) => current.whenDisposed()));
}

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
    const owner = new SharedTypeScriptWorkerOwner();
    const first = session(owner, factory);
    const second = session(owner, factory);

    await first.getDiagnostics(project);
    await second.getDiagnostics(project);
    expect(workers).toHaveLength(1);
    expect(new Set(workers[0].messages.map((message) => message.projectId)).size).toBe(2);

    await dispose(first);
    expect(workers[0].terminateCount).toBe(0);
    await second.getDiagnostics(project);
    await dispose(second);
    expect(workers[0].terminateCount).toBe(1);

    const third = session(owner, factory);
    await third.getDiagnostics(project);
    expect(workers).toHaveLength(2);
    await dispose(third);
    owner.dispose();
  });

  it('recovers active projects after the shared worker crashes', async () => {
    const workers: FakeWorker[] = [];
    const factory = () => {
      const worker = new FakeWorker(workers.length === 0);
      workers.push(worker);
      return worker;
    };
    const owner = new SharedTypeScriptWorkerOwner();
    const first = session(owner, factory);
    const second = session(owner, factory);

    await expect(Promise.all([first.getDiagnostics(project), second.getDiagnostics(project)])).resolves.toEqual([
      [],
      [],
    ]);
    expect(workers).toHaveLength(2);

    await dispose(first, second);
    owner.dispose();
  });

  it('keeps owners from separate applications isolated', async () => {
    const workers: FakeWorker[] = [];
    const factory = () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    };
    const firstOwner = new SharedTypeScriptWorkerOwner();
    const secondOwner = new SharedTypeScriptWorkerOwner();
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
