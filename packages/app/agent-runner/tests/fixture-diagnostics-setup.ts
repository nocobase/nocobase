import type { TestProject } from 'vitest/node';
import type {} from './fixture-diagnostics.ts';

export default function setup(project: TestProject) {
  project.provide('fixtureConcurrency', {
    maxWorkers: project.config.maxWorkers,
    pool: project.config.pool,
    fileParallelism: project.globalConfig.fileParallelism ?? 'default',
  });
}
