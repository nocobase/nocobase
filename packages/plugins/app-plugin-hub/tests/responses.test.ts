import { describe, expect, it } from 'vitest';
import {
  appDetailResponse,
  deploymentResponse,
} from '../server/routes/responses.js';
import type { HubAppDetail, HubDeploymentRecord } from '../server/tokens.js';

describe('Hub response field allowlists', () => {
  it('does not expose deployment storage paths and internal bookkeeping', () => {
    const record: HubDeploymentRecord = {
      id: 'd1',
      appId: 'app',
      releaseId: 'r1',
      kind: 'deploy',
      rollbackTargetDeploymentId: null,
      previousDeploymentId: 'old',
      status: 'succeeded',
      phase: 'completed',
      config: { mode: 'file', path: '/private/config.yml' },
      cacheHit: true,
      hostRevision: 7,
      error: null,
      createdAt: new Date(),
      startedAt: new Date(),
      finishedAt: new Date(),
    };
    expect(Object.keys(deploymentResponse(record)).sort()).toEqual([
      'cacheHit',
      'config',
      'createdAt',
      'error',
      'id',
      'kind',
      'phase',
      'releaseId',
      'status',
    ]);
    expect(deploymentResponse(record).config).toEqual({ mode: 'file' });
  });

  it('returns only UI fields in nested application and runtime objects', () => {
    const value: HubAppDetail = {
      hasReleases: true,
      hasPendingDeployment: false,
      currentVersion: '1.0',
      hostUrl: 'http://localhost:13010',
      buildTarget: {
        platform: 'linux',
        arch: 'arm64',
        libc: 'musl',
        nodeAbi: 137,
        nodeMajor: 24,
      },
      app: {
        id: 'app',
        name: 'App',
        description: 'unused',
        currentDeploymentId: 'd1',
        enabled: true,
        basePath: '/app',
        backend: 'in-process',
        startupMode: 'eager',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      runtime: {
        hostAvailable: true,
        state: 'running',
        version: '1',
        startedAt: null,
        lastAccessedAt: null,
        activeRequests: 9,
        hostRevision: 7,
        error: null,
      },
      deployment: {
        desiredReleaseId: 'r1',
        observedReleaseId: 'r1',
        desiredState: 'running',
        observedState: 'running',
        activation: 'eager',
        basePath: '/app',
        config: { mode: 'file', path: '/private/config.yml' },
        error: null,
        updatedAt: new Date(),
      },
    };
    const response = appDetailResponse(value);
    expect(Object.keys(response.app).sort()).toEqual([
      'currentDeploymentId',
      'id',
      'name',
      'updatedAt',
    ]);
    expect(response).toMatchObject({ enabled: true, startupMode: 'eager' });
    expect(response.runtime).toEqual({ hostAvailable: true, state: 'running' });
    expect(response.deployment).not.toHaveProperty('config');
    expect(response.deployment).not.toHaveProperty('desiredState');
    expect(response.buildTarget).toEqual({
      platform: 'linux',
      arch: 'arm64',
      libc: 'musl',
      nodeAbi: 137,
      nodeMajor: 24,
    });
  });
});
