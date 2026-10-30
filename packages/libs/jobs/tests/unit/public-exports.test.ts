import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };
import * as jobs from '../../src/index.js';
import { BackendJobExecutor } from '../../src/job/executor.js';
import { BackendScheduleExecutor } from '../../src/schedule/executor.js';
import { jobQueueName } from '../../src/job/backend.js';

describe('Jobs public exports', () => {
  it('exposes shared backend executors and naming through the root entry', () => {
    expect(jobs).toMatchObject({
      BackendJobExecutor,
      BackendScheduleExecutor,
      jobQueueName,
    });
    expect('JobsBackendRegistry' in jobs).toBe(false);
  });

  it('has one public source and published entry without a backend barrel', () => {
    expect(Object.keys(packageMetadata.exports)).toEqual(['.']);
    expect(Object.keys(packageMetadata.publishConfig.exports)).toEqual(['.']);
    expect(existsSync(new URL('../../src/backend.ts', import.meta.url))).toBe(
      false,
    );
  });
});
