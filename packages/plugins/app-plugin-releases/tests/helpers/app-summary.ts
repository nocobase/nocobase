import type { AppSummary, ObservedState } from '../../shared/releases.js';

export function appSummary(
  state: ObservedState = 'running',
  id: string = 'shop',
): AppSummary {
  return {
    app: {
      id,
      environmentId: 'staging',
      name: id,
      description: null,
      currentDeploymentId: 'deployment-1',
      enabled: true,
      activation: 'onDemand',
      idleStopMinutes: null,
      dormantAfterHours: null,
      labels: {},
      previewOf: null,
      createdBy: 'user',
      createdVia: 'human',
      createdAt: '',
      updatedAt: '',
    },
    environment: {
      id: 'staging',
      name: 'Staging',
      protected: false,
      runsImages: false,
    },
    runtime: {
      available: true,
      state,
      version: null,
      startedAt: null,
      error: null,
      lastAccessedAt: null,
    },
    url: null,
    currentVersion: null,
    hasReleases: true,
    hasPendingDeployment: false,
    allowed: ['read', 'operate', 'configure'],
  };
}
