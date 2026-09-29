import path from 'node:path';

export interface WorkflowRuntimeConfig {
  readonly sourceRoot: string;
  readonly distRoot: string;
  readonly artifactDisk: string;
  readonly production: boolean;
}

export interface ResolveWorkflowRuntimeConfigOptions {
  readonly rootDir: string;
  readonly serverDir: string;
}

export function resolveWorkflowRuntimeConfig(
  config: WorkflowRuntimeConfig,
  options: ResolveWorkflowRuntimeConfigOptions,
): WorkflowRuntimeConfig {
  const built = path.basename(path.dirname(options.serverDir)) === 'dist';
  return {
    ...config,
    distRoot: built
      ? path.join(path.dirname(options.serverDir), 'workflows')
      : path.join(options.rootDir, 'dist', 'workflows'),
    production: config.production || built,
  };
}
