import type { DeploymentLogListener } from '../deployment-log.js';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ChildProcess } from 'node:child_process';
import type { JournalPage, JournalQuery } from '@nocobase/logging';
import {
  IPC_CHANNEL,
  callIpc,
  isIpcRequest,
  sendIpcResponse,
  type IpcRequest,
} from '../ipc-channel.ts';
import type { HostManagementService } from './manager.ts';
import type {
  ApplyDeploymentSetResult,
  HostDeploymentSpec,
  HostDeploymentSet,
  HostDescription,
  HostOperation,
  HostScope,
  HostScopeCheck,
  HostStatus,
  HostStatusQuery,
} from './types.ts';

type IpcMethod =
  | 'publishAppConfig'
  | 'restoreDeploymentSet'
  | 'reloadAppConfig'
  | 'applyDeploymentSet'
  | 'applyDeployment'
  | 'startDeployment'
  | 'stopDeployment'
  | 'removeDeployment'
  | 'getStatus'
  | 'restartApp'
  | 'getOperation'
  | 'describeHost'
  | 'checkScope'
  | 'readAppLogs';

export interface IpcHostManagementClientOptions {
  session: string;
  timeoutMs?: number;
}

export class IpcHostManagementClient implements HostManagementService {
  publishAppConfig(
    appId: string,
    content: string,
  ): ReturnType<HostManagementService['publishAppConfig']> {
    return this.call('publishAppConfig', { appId, content });
  }
  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    return this.call('restoreDeploymentSet', deploymentSet);
  }
  reloadAppConfig(
    appId: string,
  ): ReturnType<HostManagementService['reloadAppConfig']> {
    return this.call('reloadAppConfig', { appId });
  }
  private readonly session: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly child: ChildProcess,
    options: IpcHostManagementClientOptions,
  ) {
    this.session = options.session;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<ApplyDeploymentSetResult> {
    return this.call<ApplyDeploymentSetResult>(
      'applyDeploymentSet',
      deploymentSet,
    );
  }

  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus> {
    return this.call<HostStatus>('applyDeployment', deployment, listener);
  }

  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus> {
    return this.call<HostStatus>('startDeployment', deployment);
  }

  stopDeployment(appId: string): Promise<HostStatus> {
    return this.call<HostStatus>('stopDeployment', { appId });
  }

  removeDeployment(
    appId: string,
    options?: { purgeData?: boolean },
  ): Promise<HostStatus> {
    return this.call<HostStatus>('removeDeployment', {
      appId,
      ...(options?.purgeData === false ? { purgeData: false } : {}),
    });
  }

  getStatus(query?: HostStatusQuery): Promise<HostStatus> {
    return this.call<HostStatus>('getStatus', query);
  }

  restartApp(appId: string): Promise<HostStatus> {
    return this.call<HostStatus>('restartApp', { appId });
  }

  getOperation(
    operationId: string,
    options?: { scope?: HostScope },
  ): Promise<HostOperation | null> {
    return this.call<HostOperation | null>('getOperation', {
      operationId,
      ...(options?.scope ? { scope: options.scope } : {}),
    });
  }

  describeHost(): Promise<HostDescription> {
    return this.call<HostDescription>('describeHost');
  }

  checkScope(scope: HostScope): Promise<HostScopeCheck> {
    return this.call<HostScopeCheck>('checkScope', scope);
  }

  readAppLogs(appId: string, query: JournalQuery): Promise<JournalPage> {
    return this.call<JournalPage>('readAppLogs', { appId, query });
  }

  private call<T>(
    method: IpcMethod,
    payload?: unknown,
    listener?: DeploymentLogListener,
  ): Promise<T> {
    return callIpc<T>(this.child, {
      session: this.session,
      timeoutMs: this.timeoutMs,
      method,
      payload,
      onLog: listener,
    });
  }
}

export class IpcHostManagementServer {
  private attached = false;

  constructor(
    private readonly service: HostManagementService,
    private readonly session: string,
  ) {}

  attach(): void {
    if (this.attached) {
      return;
    }
    if (typeof process.send !== 'function') {
      throw new Error('Managed app host requires a Node IPC channel');
    }
    this.attached = true;
    process.on('message', this.handleMessage);
  }

  close(): void {
    if (!this.attached) {
      return;
    }
    this.attached = false;
    process.off('message', this.handleMessage);
  }

  private readonly handleMessage = (message: unknown): void => {
    if (!isIpcRequest(message)) {
      return;
    }
    this.respond(message).catch((error: unknown) => {
      const code = (error as { code?: unknown } | null)?.code;
      sendIpcResponse({
        channel: IPC_CHANNEL,
        kind: 'response',
        requestId: message.requestId,
        error: error instanceof Error ? error.message : String(error),
        ...(typeof code === 'string' ? { errorCode: code } : {}),
      });
    });
  };

  private async respond(request: IpcRequest): Promise<void> {
    if (request.session !== this.session) {
      throw new Error('Invalid app host IPC session');
    }
    let result: unknown;
    switch (request.method as IpcMethod) {
      case 'publishAppConfig':
        result = await this.service.publishAppConfig(
          payloadAppId(request),
          (request.payload as { content: string }).content,
        );
        break;
      case 'getStatus':
        result = await this.service.getStatus(request.payload ?? undefined);
        break;
      case 'applyDeploymentSet':
        this.accept(request);
        result = await this.service.applyDeploymentSet(
          request.payload as HostDeploymentSet,
        );
        break;
      case 'applyDeployment':
        this.accept(request);
        result = await this.service.applyDeployment(
          request.payload as HostDeploymentSpec,
          (log) =>
            sendIpcResponse({
              channel: IPC_CHANNEL,
              kind: 'response',
              requestId: request.requestId,
              log,
            }),
        );
        break;
      case 'startDeployment':
        this.accept(request);
        result = await this.service.startDeployment(
          request.payload as HostDeploymentSpec,
        );
        break;
      case 'stopDeployment':
        this.accept(request);
        result = await this.service.stopDeployment(payloadAppId(request));
        break;
      case 'removeDeployment':
        this.accept(request);
        result = await this.service.removeDeployment(
          payloadAppId(request),
          (request.payload as { purgeData?: boolean }).purgeData === false
            ? { purgeData: false }
            : {},
        );
        break;
      case 'reloadAppConfig':
        result = await this.service.reloadAppConfig(payloadAppId(request));
        break;
      case 'restoreDeploymentSet':
        this.accept(request);
        result = await this.service.restoreDeploymentSet(
          request.payload as HostDeploymentSet,
        );
        break;
      case 'restartApp':
        this.accept(request);
        result = await this.service.restartApp(
          (request.payload as { appId: string }).appId,
        );
        break;
      case 'getOperation': {
        const { operationId, scope } = request.payload as {
          operationId: string;
          scope?: HostScope;
        };
        result = await this.service.getOperation(
          operationId,
          scope ? { scope } : {},
        );
        break;
      }
      case 'describeHost':
        result = await this.service.describeHost();
        break;
      case 'checkScope':
        this.accept(request);
        result = await this.service.checkScope(request.payload as HostScope);
        break;
      case 'readAppLogs': {
        const { appId, query } = request.payload as {
          appId: string;
          query: JournalQuery;
        };
        result = await this.service.readAppLogs(appId, query ?? {});
        break;
      }
      default:
        throw new Error(`Unknown app host IPC method "${request.method}"`);
    }
    sendIpcResponse({
      channel: IPC_CHANNEL,
      kind: 'response',
      requestId: request.requestId,
      result,
    });
  }

  private accept(request: IpcRequest): void {
    sendIpcResponse({
      channel: IPC_CHANNEL,
      kind: 'response',
      requestId: request.requestId,
      accepted: true,
    });
  }
}

function payloadAppId(request: IpcRequest): string {
  return (request.payload as { appId: string }).appId;
}
