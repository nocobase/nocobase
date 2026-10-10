import type { ConfigIssue } from '../server/instructions/types.js';

/** Validate both evaluated source definitions and typed builder output. */
export function validateWorkflowOptions(options: unknown): ConfigIssue[] {
  if (options === undefined) return [];
  if (options === null || typeof options !== 'object' || Array.isArray(options))
    return [{ path: 'workflow.options', message: 'options must be an object' }];
  const issues: ConfigIssue[] = [];
  for (const [key, value] of Object.entries(options)) {
    const path = `workflow.options.${key}`;
    if (key !== 'timeout' && key !== 'stackLimit') {
      issues.push({ path, message: `Unknown workflow option "${key}"` });
      continue;
    }
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      (key === 'stackLimit' && !Number.isSafeInteger(value))
    )
      issues.push({
        path,
        message:
          key === 'timeout'
            ? 'timeout must be a finite non-negative number of seconds'
            : 'stackLimit must be a non-negative safe integer',
      });
  }
  return issues;
}
