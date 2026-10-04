import { ApiClientError } from '@nocobase/app-client';
import { describe, expect, it } from 'vitest';

import {
  appActionState,
  appManagementStatus,
  appStatusLabel,
  applicationUrl,
  formatDate,
  formatDateTime,
  readError,
} from '../client/pages/hub/utils.js';
import type {
  AppDetail,
  AppOverview,
  AppSummary,
} from '../client/pages/hub/types.js';

const summary = (overrides: Partial<AppSummary> = {}): AppSummary => ({
  app: {
    id: 'customer',
    name: 'Customer',
    currentDeploymentId: 'deployment-1',
    updatedAt: '2026-09-11T00:00:00Z',
  },
  runtime: { hostAvailable: true, state: 'stopped' },
  currentVersion: '1.0.0',
  hasReleases: true,
  hasPendingDeployment: false,
  enabled: false,
  startupMode: 'eager',
  ...overrides,
});

describe('Hub App status and action mapping', () => {
  it('opens hosted apps through the public entry instead of the private Host port', () => {
    const app = {
      hostUrl: '/',
      deployment: { basePath: '/customer', desiredReleaseId: 'release-1' },
    } as AppDetail;
    expect(applicationUrl(app)).toBe('/customer/');
    expect(
      applicationUrl({ ...app, hostUrl: 'https://apps.example.com' }),
    ).toBe('https://apps.example.com/customer');
  });
  it('prioritizes Host and deployment state over runtime state', () => {
    expect(
      appManagementStatus(
        summary({
          runtime: { hostAvailable: false, state: 'running' },
        }),
      ),
    ).toBe('host-unavailable');
    expect(
      appManagementStatus(
        summary({
          hasPendingDeployment: true,
          runtime: { hostAvailable: true, state: 'running' },
        }),
      ),
    ).toBe('deployment-pending');
  });

  it('distinguishes lazy Ready from a user-stopped App', () => {
    expect(
      appManagementStatus(
        summary({
          enabled: true,
          startupMode: 'lazy',
          runtime: { hostAvailable: true, state: 'stopped' },
        }),
      ),
    ).toBe('ready');
    expect(appManagementStatus(summary())).toBe('stopped');
    expect(
      appManagementStatus(
        summary({
          enabled: true,
          startupMode: 'eager',
          runtime: { hostAvailable: true, state: 'stopped' },
        }),
      ),
    ).toBe('stopped');
  });

  it('does not treat an unknown runtime as lazy Ready', () => {
    expect(
      appManagementStatus(
        summary({
          enabled: true,
          startupMode: 'lazy',
          runtime: { hostAvailable: true, state: 'unknown' },
        }),
      ),
    ).toBe('unknown');
  });

  it('uses a user-facing label for an unresolved runtime state', () => {
    expect(appStatusLabel('unknown')).toBe('Status unavailable');
  });

  it('explains lifecycle action availability', () => {
    expect(
      appActionState(
        summary({ app: { ...summary().app, currentDeploymentId: null } }),
        'start',
      ),
    ).toEqual({
      enabled: false,
      reason: 'deployReleaseFirst',
    });
    expect(
      appActionState(
        summary({ runtime: { hostAvailable: false, state: 'stopped' } }),
        'stop',
      ),
    ).toEqual({ enabled: false, reason: 'hostUnavailable' });
    expect(
      appActionState(
        summary({ runtime: { hostAvailable: true, state: 'running' } }),
        'stop',
      ),
    ).toEqual({ enabled: true });
    expect(
      appActionState(
        summary({ runtime: { hostAvailable: true, state: 'running' } }),
        'restart',
        true,
      ),
    ).toEqual({ enabled: false, reason: 'operationInProgress' });
  });

  it('supports detail responses with the same mapping', () => {
    const detail = {
      ...summary(),
      deployment: {
        desiredReleaseId: 'release-1',
        observedReleaseId: 'release-1',
        observedState: 'stopped',
        activation: 'lazy',
        basePath: '/customer',
        updatedAt: '2026-09-11T00:00:00Z',
      },
      releases: [],
      deployments: [],
      hostUrl: null,
    } as unknown as AppOverview;
    expect(appManagementStatus(detail)).toBe('stopped');
  });

  it('turns API failures into readable details without exposing paths', () => {
    const payload = {
      error: {
        code: 400,
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_ARTIFACT',
        domain: 'hub',
        message:
          "Invalid release artifact: ENOENT: no such file or directory, lstat '/var/folders/example/package.json'",
      },
    };
    const error = readError(
      new ApiClientError(payload.error.message, {
        status: 400,
        payload,
        reason: 'INVALID_ARTIFACT',
        domain: 'hub',
        method: 'POST',
        url: '/api/hub/apps/customer/releases',
      }),
    );

    expect(error).toMatchObject({
      reason: 'INVALID_ARTIFACT',
      status: 400,
      isTechnical: true,
      message: 'The operation could not be completed.',
    });
    expect(error.technicalMessage).toContain('INVALID_ARTIFACT');
    expect(error.technicalMessage).toContain(
      '/var/folders/example/package.json',
    );
    expect(error.message).not.toContain('/var/folders/example/package.json');
  });

  it('never infers a reason from a message', () => {
    const error = readError(
      'Artifact version mismatch for app "ts": expected "1.0.0-beta.22", received "local"',
    );

    expect(error.reason).toBeUndefined();
    expect(error.status).toBeUndefined();
  });

  it('keeps ordinary user-facing errors readable', () => {
    expect(readError(new Error('Application name is required'))).toMatchObject({
      isTechnical: false,
      message: 'Application name is required',
      technicalMessage: 'Application name is required',
    });
  });

  it('formats dates in the language the application is in', () => {
    // Without an explicit locale these fall back to the browser's own language, which is not the one the user chose
    // in the application: an English UI on a Chinese browser rendered "2026年9月14日" next to English labels.
    const value = '2026-09-14T08:30:00.000Z';
    expect(formatDate(value, 'en-US')).toBe('Sep 14, 2026');
    expect(formatDate(value, 'zh-CN')).toBe('2026年9月14日');
    expect(formatDate(value, 'en-US')).not.toBe(formatDate(value, 'zh-CN'));
    expect(formatDateTime(value, 'en-US')).not.toBe(
      formatDateTime(value, 'zh-CN'),
    );
  });

  it('renders an unusable date as a dash in every language', () => {
    for (const locale of ['en-US', 'zh-CN']) {
      expect(formatDate('not-a-date', locale)).toBe('—');
      expect(formatDateTime('1970-01-01T00:00:00.000Z', locale)).toBe('—');
    }
  });
});
