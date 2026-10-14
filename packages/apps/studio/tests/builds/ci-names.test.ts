// @vitest-environment node
/**
 * What a "Configure CI" run names and records: the workflow file of an application and a target
 * (`nb-studio-<base>-<purpose>.yml`, `shared/ci-modes.ts`), and why a run failed, by reason (`ciFailureOf`).
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import { describe, expect, it } from 'vitest';

import { AccessError, conflict } from '../../server/access/errors.js';
import { ciFailureOf } from '../../server/builds/ci-setup.js';
import { ciWorkflowFile } from '../../server/builds/ci-workflow.js';
import { demoConnection } from '../../server/git/connections.js';
import { GitApiError } from '../../server/git/platform.js';
import {
  ciWorkflowPathOf,
  ciWorkflowTargetOf,
  parseCiFailure,
} from '../../shared/ci-modes.js';

describe('workflow file names', () => {
  it('name pull requests `preview` and a branch or tag its environment, the App ID’s environment once', () => {
    expect(
      ciWorkflowPathOf({
        appId: 'crm',
        trigger: 'pullRequest',
        environmentId: 'preview',
      }),
    ).toBe('.github/workflows/nb-studio-crm-preview.yml');
    expect(
      ciWorkflowPathOf({
        appId: 'crm-admin',
        trigger: 'pullRequest',
        environmentId: 'review',
      }),
    ).toBe('.github/workflows/nb-studio-crm-admin-preview.yml');
    // The demo's: App `crm-staging` in `demo-staging`, named "Staging".
    expect(
      ciWorkflowPathOf({
        appId: 'crm-staging',
        trigger: 'branch',
        environmentId: 'demo-staging',
        environmentName: 'Staging',
      }),
    ).toBe('.github/workflows/nb-studio-crm-staging.yml');
    // The default App ID `<base>-<environment>` loses its environment.
    expect(
      ciWorkflowPathOf({
        appId: 'crm-demo-production',
        trigger: 'tag',
        environmentId: 'demo-production',
        environmentName: 'Production',
      }),
    ).toBe('.github/workflows/nb-studio-crm-production.yml');
    // A name with no letters or digits falls back to the environment's ID.
    expect(
      ciWorkflowPathOf({
        appId: 'shop',
        trigger: 'branch',
        environmentId: 'prod',
        environmentName: '生产',
      }),
    ).toBe('.github/workflows/nb-studio-shop-prod.yml');
  });

  it('add the trigger, or the environment’s ID, only when another target holds the name', () => {
    const tag = {
      appId: 'crm',
      trigger: 'tag',
      environmentId: 'production',
      environmentName: 'Production',
    } as const;
    expect(ciWorkflowPathOf(tag, { ...tag })).toBe(
      '.github/workflows/nb-studio-crm-production.yml',
    );
    expect(
      ciWorkflowPathOf(tag, {
        appId: 'crm',
        trigger: 'branch',
        environmentId: 'production',
      }),
    ).toBe('.github/workflows/nb-studio-crm-production-tag.yml');
    expect(
      ciWorkflowPathOf(tag, {
        appId: 'crm',
        trigger: 'tag',
        environmentId: 'prod-eu',
      }),
    ).toBe('.github/workflows/nb-studio-crm-production-production.yml');
    expect(
      ciWorkflowPathOf(tag, {
        appId: 'crm-production',
        trigger: 'tag',
        environmentId: 'production',
      }),
    ).toBe('.github/workflows/nb-studio-crm-production-crm.yml');
  });

  it('read the target back from a file Studio generated, and nothing from any other', () => {
    const base = { studioUrl: 'https://studio.test', resourceId: 'r1' };
    const pull = ciWorkflowFile({
      ...base,
      app: { directory: 'apps/admin', appId: 'admin' },
      target: { trigger: 'pullRequest', environmentId: 'preview' },
    });
    expect(ciWorkflowTargetOf(pull.content)).toEqual({
      appId: 'admin',
      trigger: 'pullRequest',
      environmentId: 'preview',
    });
    const branch = ciWorkflowFile({
      ...base,
      app: { directory: '.', appId: 'admin-staging' },
      target: { trigger: 'branch', environmentId: 'staging' },
      environmentName: 'Staging',
    });
    expect(branch.path).toBe('.github/workflows/nb-studio-admin-staging.yml');
    expect(ciWorkflowTargetOf(branch.content)).toEqual({
      appId: 'admin-staging',
      trigger: 'branch',
      environmentId: 'staging',
    });
    expect(
      ciWorkflowTargetOf(
        ciWorkflowFile({
          ...base,
          app: { directory: '.', appId: 'admin' },
          target: { trigger: 'tag', environmentId: 'production' },
        }).content,
      ),
    ).toMatchObject({ trigger: 'tag' });
    expect(ciWorkflowTargetOf('name: CI\non:\n  push:\n')).toBeNull();
  });
});

describe('why a run failed', () => {
  it('is known by its reason and what it names', () => {
    expect(ciFailureOf(demoConnection({ name: 'Acme demo' }))).toEqual({
      reason: 'demoConnection',
      params: {},
    });
    expect(
      ciFailureOf(
        new ProtocolError('CONFLICT', 'May not write secrets yet.', {
          code: 'GIT_PERMISSION_MISSING',
        }),
      ).reason,
    ).toBe('connectionPermission');
    expect(ciFailureOf(new GitApiError(403, 'GitHub answered 403.'))).toEqual({
      reason: 'hostForbidden',
      params: {},
    });
    expect(
      ciFailureOf(new GitApiError(404, 'GitHub answered 404.')).reason,
    ).toBe('repositoryNotFound');
    // A rate limit is not a refusal: it names when to try again.
    expect(
      ciFailureOf(
        new GitApiError(403, 'Rate limited.', {
          retryAt: '2026-10-09T01:00:00.000Z',
        }),
      ),
    ).toEqual({
      reason: 'hostRateLimited',
      params: { retryAt: '2026-10-09T01:00:00.000Z' },
    });
    expect(
      ciFailureOf(
        new ProtocolError('CONFLICT', 'Rate limited.', {
          code: 'GITHUB_RATE_LIMITED',
          retryAt: '2026-10-09T01:00:00.000Z',
        }),
      ),
    ).toEqual({
      reason: 'hostRateLimited',
      params: { retryAt: '2026-10-09T01:00:00.000Z' },
    });
    expect(
      ciFailureOf(
        conflict('APP_IN_OTHER_ENVIRONMENT', 'shop runs in production.', {
          environmentId: 'production',
        }),
        { appId: 'shop', environmentId: 'staging' },
      ),
    ).toEqual({
      reason: 'appInOtherEnvironment',
      params: {
        appId: 'shop',
        environmentId: 'staging',
        actualEnvironmentId: 'production',
      },
    });
    expect(
      ciFailureOf(new AccessError('PERMISSION_DENIED', 'SOMETHING_ELSE', 'No.'))
        .reason,
    ).toBe('forbidden');
    expect(ciFailureOf(new Error('Something broke.'))).toEqual({
      reason: 'unknown',
      params: {},
    });
  });

  it('reads back what was stored, an unknown reason as `unknown`', () => {
    expect(
      parseCiFailure('{"reason":"keyRevoked","params":{"how":"deleted"}}'),
    ).toEqual({ reason: 'keyRevoked', params: { how: 'deleted' } });
    expect(parseCiFailure({ reason: 'later', params: { n: 1 } })).toEqual({
      reason: 'unknown',
      params: {},
    });
    expect(parseCiFailure(null)).toBeNull();
    expect(parseCiFailure('not json')).toBeNull();
  });
});
